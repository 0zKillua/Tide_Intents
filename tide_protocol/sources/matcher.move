module tide::matcher {
    use sui::clock::{Self, Clock};
    use sui::coin::{Self};
    
    use tide::intents::{Self, LendOffer, BorrowRequest};
    use tide::loan::{Self};
    use tide::constants;
    use tide::errors;

    public fun match_intents<CoinType, CollateralType>(
        offer: &mut LendOffer<CoinType>,
        request: BorrowRequest<CoinType, CollateralType>,
        clock: &Clock,
        ctx: &mut TxContext
    ): (ID, ID) { // Returns (loan_id, note_id)
        
        let (borrower, _, request_amount, _, _, _, request_expiry) = intents::borrow_request_info(&request);
        let (lender, _, min_rate_bps, max_ltv_bps, lender_max_duration, min_fill_amount, offer_expiry) = intents::lend_offer_info(offer);
        let (_, _, _, _, min_ltv_bps, duration_ms, _) = intents::borrow_request_info(&request);
        
        // === Validations ===
        
        // 1. Check Expiry
        let now = clock::timestamp_ms(clock);
        assert!(now <= request_expiry, errors::intent_expired());
        assert!(now <= offer_expiry, errors::intent_expired());

        // 2. Check Rates
        // We need separate calls or a clean way to get data. 
        // Re-fetching request info to get max_rate
        let (_, _, _, request_max_rate_bps, _, _, _) = intents::borrow_request_info(&request);
        assert!(request_max_rate_bps >= min_rate_bps, errors::rate_mismatch());

        // 3. Check Duration
        assert!(duration_ms <= lender_max_duration, errors::duration_mismatch());

        // 4. Check LTV Safety (Gap)
        assert!(min_ltv_bps + constants::min_ltv_gap_bps() <= max_ltv_bps, errors::unsafe_ltv_gap());

        // 5. Check Amounts
        assert!(request_amount >= min_fill_amount, errors::invalid_amount());
        
        // === Execution ===

        // 1. Consume Borrow Request (get collateral)
        let (collateral_balance, _request_uid) = intents::consume_borrow_request(request);

        // 2. Take Funds from Offer
        let principal_coin_balance = intents::update_lend_offer(offer, request_amount);
        
        // 3. Create Loan
        // Use Lender's min rate as execution rate
        let execution_rate = min_rate_bps; 

        // 5. Execute Creation
        let (loan_id, note_id) = loan::create_loan<CoinType, CollateralType>(
            borrower,
            lender,
            request_amount,
            collateral_balance,
            execution_rate,
            min_ltv_bps,
            duration_ms,
            clock,
            ctx
        );

        // 6. Transfer Principal to Borrower
        let principal_coin = coin::from_balance(principal_coin_balance, ctx);
        transfer::public_transfer(principal_coin, borrower);

        (loan_id, note_id)
    }

    // === Direct Fill Functions (Atomic Instant Matching) ===

    /// Borrower fills a LendOffer directly with collateral.
    /// Creates a loan atomically without needing a separate BorrowRequest.
    public entry fun fill_lend_offer<CoinType, CollateralType>(
        offer: &mut LendOffer<CoinType>,
        collateral: coin::Coin<CollateralType>,
        borrow_amount: u64, // How much to borrow from this offer
        ltv_bps: u64,       // Borrower's desired LTV (must be <= offer's max_ltv)
        duration_ms: u64,   // Loan duration (must be <= offer's max_duration)
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let borrower = tx_context::sender(ctx);
        let (lender, available_amount, min_rate_bps, max_ltv_bps, max_duration_ms, min_fill_amount, offer_expiry) = 
            intents::lend_offer_info(offer);
        
        // === Validations ===
        let now = clock::timestamp_ms(clock);
        assert!(now <= offer_expiry, errors::intent_expired());
        assert!(borrow_amount >= min_fill_amount, errors::invalid_amount());
        assert!(borrow_amount <= available_amount, errors::invalid_amount());
        assert!(ltv_bps <= max_ltv_bps, errors::unsafe_ltv_gap());
        assert!(duration_ms <= max_duration_ms, errors::duration_mismatch());
        
        // Check collateral sufficiency (simplified - in production use oracle)
        let collateral_value = coin::value(&collateral);
        assert!(collateral_value > 0, errors::invalid_amount());
        
        // === Execution ===
        
        // 1. Take funds from offer
        let principal_balance = intents::update_lend_offer(offer, borrow_amount);
        
        // 2. Create loan
        let (loan_id, note_id) = loan::create_loan<CoinType, CollateralType>(
            borrower,
            lender,
            borrow_amount,
            coin::into_balance(collateral),
            min_rate_bps, // Use offer's rate
            ltv_bps,
            duration_ms,
            clock,
            ctx
        );
        
        // 3. Transfer principal to borrower
        let principal_coin = coin::from_balance(principal_balance, ctx);
        transfer::public_transfer(principal_coin, borrower);
        
        // Emit event (reusing match event pattern)
        sui::event::emit(LoanFilled { 
            loan_id, 
            note_id, 
            borrower, 
            lender, 
            amount: borrow_amount 
        });
    }

    /// Lender fills a BorrowRequest directly with principal.
    /// Creates a loan atomically without needing a separate LendOffer.
    public entry fun fill_borrow_request<CoinType, CollateralType>(
        request: BorrowRequest<CoinType, CollateralType>,
        payment: coin::Coin<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let lender = tx_context::sender(ctx);
        let (borrower, _collateral_val, request_amount, max_rate_bps, min_ltv_bps, duration_ms, request_expiry) = 
            intents::borrow_request_info(&request);
        
        // === Validations ===
        let now = clock::timestamp_ms(clock);
        assert!(now <= request_expiry, errors::intent_expired());
        
        let payment_value = coin::value(&payment);
        assert!(payment_value >= request_amount, errors::invalid_amount());
        
        // === Execution ===
        
        // 1. Consume request (get collateral)
        let (collateral_balance, _request_id) = intents::consume_borrow_request(request);
        
        // 2. Split exact payment if overpaid
        let mut payment_mut = payment;
        if (payment_value > request_amount) {
            let excess = coin::split(&mut payment_mut, payment_value - request_amount, ctx);
            transfer::public_transfer(excess, lender);
        };
        
        // 3. Create loan
        let (loan_id, note_id) = loan::create_loan<CoinType, CollateralType>(
            borrower,
            lender,
            request_amount,
            collateral_balance,
            max_rate_bps, // Use borrower's max rate
            min_ltv_bps,
            duration_ms,
            clock,
            ctx
        );
        
        // 4. Transfer principal to borrower
        transfer::public_transfer(payment_mut, borrower);
        
        // Emit event
        sui::event::emit(LoanFilled { 
            loan_id, 
            note_id, 
            borrower, 
            lender, 
            amount: request_amount 
        });
    }

    // === Events ===
    public struct LoanFilled has copy, drop {
        loan_id: ID,
        note_id: ID,
        borrower: address,
        lender: address,
        amount: u64
    }
}
