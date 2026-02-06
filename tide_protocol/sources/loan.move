module tide::loan {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::type_name::{get, into_string};
    
    use tide::constants;
    use tide::errors;
    use tide::math;

    // === Structs ===

    /// The active loan object. 
    /// Shared Object. held by the protocol until repayment or liquidation.
    public struct Loan<phantom CoinType, phantom CollateralType> has key, store {
        id: UID,
        borrower: address,
        principal: u64,
        collateral: Balance<CollateralType>,
        repaid_funds: Balance<CoinType>,
        interest_rate_bps: u64,
        ltv_bps: u64, // Liquidation threshold (max_ltv)
        start_time_ms: u64,
        duration_ms: u64,
        state: u8, // 0=Active, 1=Repaid, 2=Liquidated
    }

    /// The "receipt" implementation. 
    /// Owned Object. Held by the Lender. Can be traded/sold.
    /// Represents the right to claim the principal + interest (or liquidation proceeds).
    public struct LoanNote has key, store {
        id: UID,
        loan_id: ID,
        principal: u64,
        interest_rate_bps: u64,
        coin_type_name: std::ascii::String, // For metadata/UI
    }

    /// Hot Potato for collateral-based repayment.
    /// No `store` or `drop` ability - MUST be consumed in same transaction.
    /// This enables "flash repay" where collateral is withdrawn, swapped externally,
    /// and the proceeds used to repay the loan atomically.
    public struct FlashReceipt<phantom CoinType, phantom CollateralType> {
        loan_id: ID,
        collateral_withdrawn: u64,
        min_repay_amount: u64, // Minimum debt tokens required to close this receipt
    }

    // === Constants for State ===
    const STATE_ACTIVE: u8 = 0;
    const STATE_REPAID: u8 = 1;
    const STATE_LIQUIDATED: u8 = 2;

    // === Events ===

    public struct LoanCreated has copy, drop { 
        loan_id: ID, 
        note_id: ID, 
        borrower: address, 
        lender: address, 
        principal: u64,
        rate_bps: u64
    }

    public struct LoanRepaid has copy, drop { 
        loan_id: ID, 
        amount_paid: u64,
        interest_paid: u64 
    }

    public struct LoanClaimed has copy, drop { 
        loan_id: ID, 
        lender: address, 
        amount: u64 
    }

    public struct LoanLiquidated has copy, drop {
        loan_id: ID,
        liquidator: address,
        debt_paid: u64,
        collateral_seized: u64
    }

    // === Entry Functions ===

    /// Borrower repays the loan + interest.
    public fun repay<CoinType, CollateralType>(
        loan: &mut Loan<CoinType, CollateralType>,
        mut payment: Coin<CoinType>,
        _clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(loan.state == STATE_ACTIVE, errors::loan_not_active());
        
        // In a real implementation, we might check time-elapsed for variable interest.
        // For fixed-duration fixed-rate, we charge the full amount usually.
        let interest = math::calculate_interest(
            loan.principal, 
            loan.interest_rate_bps, 
            loan.duration_ms
        );
        let total_due = loan.principal + interest;

        let payment_value = coin::value(&payment);
        assert!(payment_value >= total_due, errors::insufficient_payment());

        // Take what is needed
        let paid_coin = coin::split(&mut payment, total_due, ctx);
        balance::join(&mut loan.repaid_funds, coin::into_balance(paid_coin));

        // Return excess if any
        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, tx_context::sender(ctx));
        } else {
            coin::destroy_zero(payment);
        };

        // Return collateral to borrower
        let collateral_val = balance::value(&loan.collateral);
        let collateral_coin = coin::from_balance(balance::split(&mut loan.collateral, collateral_val), ctx);
        transfer::public_transfer(collateral_coin, loan.borrower);

        loan.state = STATE_REPAID;

        event::emit(LoanRepaid {
            loan_id: object::uid_to_inner(&loan.id),
            amount_paid: total_due,
            interest_paid: interest
        });
    }

    /// Lender claims the repaid funds using their LoanNote.
    public fun claim<CoinType, CollateralType>(
        loan: &mut Loan<CoinType, CollateralType>,
        note: LoanNote,
        ctx: &mut TxContext
    ) {
        let loan_id = object::uid_to_inner(&loan.id);
        assert!(note.loan_id == loan_id, errors::invalid_loan_note());
        
        // Can claim if Repaid OR Liquidated
        assert!(loan.state != STATE_ACTIVE, errors::loan_not_repaid());
        
        // Burn note
        let LoanNote { id: note_uid, loan_id: _, principal: _, interest_rate_bps: _, coin_type_name: _ } = note;
        object::delete(note_uid);

        // Transfer funds to note holder
        let funds_val = balance::value(&loan.repaid_funds);
        let funds = coin::from_balance(balance::split(&mut loan.repaid_funds, funds_val), ctx);
        
        transfer::public_transfer(funds, tx_context::sender(ctx));

        event::emit(LoanClaimed {
            loan_id,
            lender: tx_context::sender(ctx),
            amount: funds_val
        });
    }

    // === Friend / Package Functions (Creation) ===

    public(package) fun create_loan<CoinType, CollateralType>(
        borrower: address,
        lender: address,
        principal: u64,
        collateral: Balance<CollateralType>,
        interest_rate_bps: u64,
        ltv_bps: u64,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): (ID, ID) { // returns (loan_id, note_id)
        let id = object::new(ctx);
        let loan_id = object::uid_to_inner(&id);
        let start_time_ms = clock::timestamp_ms(clock);
        
        let loan = Loan<CoinType, CollateralType> {
            id,
            borrower,
            principal,
            collateral,
            repaid_funds: balance::zero(),
            interest_rate_bps,
            ltv_bps,
            start_time_ms,
            duration_ms,
            state: STATE_ACTIVE
        };
        
        // Share object
        transfer::share_object(loan);

        // Create Note for Lender
        let note_uid = object::new(ctx);
        let note_id = object::uid_to_inner(&note_uid);
        
        let note = LoanNote {
            id: note_uid,
            loan_id,
            principal,
            interest_rate_bps,
            coin_type_name: into_string(get<CoinType>())
        };

        transfer::public_transfer(note, lender);

        event::emit(LoanCreated {
            loan_id,
            note_id,
            borrower,
            lender,
            principal,
            rate_bps: interest_rate_bps
        });

        (loan_id, note_id)
    }

    // === Liquidator Access ===

    // Revised liquidation helper to be cleaner
    public(package) fun execute_liquidation<CoinType, CollateralType>(
        loan: &mut Loan<CoinType, CollateralType>,
        payment: Balance<CoinType>, // Full debt payment
        collateral_to_seize: u64
    ): Balance<CollateralType> {
        // Mark as liquidated/repaid (functionally same for lender claim)
        // We use STATE_LIQUIDATED to distinguish history
        loan.state = STATE_LIQUIDATED;
        
        balance::join(&mut loan.repaid_funds, payment);
        balance::split(&mut loan.collateral, collateral_to_seize)
    }

    // === Getters ===

    public fun state<C, T>(loan: &Loan<C, T>): u8 { loan.state }
    public fun principal<C, T>(loan: &Loan<C, T>): u64 { loan.principal }
    public fun interest_rate<C, T>(loan: &Loan<C, T>): u64 { loan.interest_rate_bps }
    public fun start_time<C, T>(loan: &Loan<C, T>): u64 { loan.start_time_ms }
    public fun duration<C, T>(loan: &Loan<C, T>): u64 { loan.duration_ms }
    public fun ltv_bps<C, T>(loan: &Loan<C, T>): u64 { loan.ltv_bps }
    public fun collateral_balance<C, T>(loan: &Loan<C, T>): u64 { balance::value(&loan.collateral) }
    public fun borrower<C, T>(loan: &Loan<C, T>): address { loan.borrower }
    
    // For liquidation check
    public fun is_active<C, T>(loan: &Loan<C, T>): bool { loan.state == STATE_ACTIVE }

    // Helper to return remaining collateral to borrower
    public(package) fun return_remaining_collateral<C, T>(
        loan: &mut Loan<C, T>,
        ctx: &mut TxContext
    ) {
        let val = balance::value(&loan.collateral);
        if (val > 0) {
            let coin = coin::from_balance(balance::split(&mut loan.collateral, val), ctx);
            transfer::public_transfer(coin, loan.borrower);
        }
    }

    // === Flash Repayment (Hot Potato Pattern) ===

    /// Step 1: Borrower initiates collateral-based repayment.
    /// Withdraws collateral and returns a FlashReceipt that MUST be consumed.
    /// The borrower can take this collateral, swap it on DeepBook (or any DEX),
    /// and use the proceeds to call `finish_collateral_repayment`.
    public fun start_collateral_repayment<CoinType, CollateralType>(
        loan: &mut Loan<CoinType, CollateralType>,
        collateral_amount: u64,
        ctx: &mut TxContext
    ): (Coin<CollateralType>, FlashReceipt<CoinType, CollateralType>) {
        assert!(loan.state == STATE_ACTIVE, errors::loan_not_active());
        
        // Verify caller is the borrower
        assert!(tx_context::sender(ctx) == loan.borrower, errors::not_borrower());
        
        // Verify sufficient collateral
        assert!(balance::value(&loan.collateral) >= collateral_amount, errors::invalid_amount());
        
        // Calculate total debt
        let interest = math::calculate_interest(
            loan.principal, 
            loan.interest_rate_bps, 
            loan.duration_ms
        );
        let total_debt = loan.principal + interest;
        
        // Withdraw collateral
        let withdrawn = coin::from_balance(
            balance::split(&mut loan.collateral, collateral_amount),
            ctx
        );
        
        // Create hot potato receipt
        let receipt = FlashReceipt<CoinType, CollateralType> {
            loan_id: object::uid_to_inner(&loan.id),
            collateral_withdrawn: collateral_amount,
            min_repay_amount: total_debt, // Must repay full debt
        };
        
        (withdrawn, receipt)
    }

    /// Step 2: Complete the collateral-based repayment.
    /// The borrower provides the debt tokens (obtained by swapping collateral).
    /// This destroys the FlashReceipt (hot potato consumed).
    public fun finish_collateral_repayment<CoinType, CollateralType>(
        loan: &mut Loan<CoinType, CollateralType>,
        receipt: FlashReceipt<CoinType, CollateralType>,
        mut payment: Coin<CoinType>,
        ctx: &mut TxContext
    ) {
        // Unpack receipt (this destroys the hot potato)
        let FlashReceipt { 
            loan_id, 
            collateral_withdrawn: _, 
            min_repay_amount 
        } = receipt;
        
        // Verify receipt matches this loan
        assert!(loan_id == object::uid_to_inner(&loan.id), errors::invalid_loan_note());
        
        // Verify sufficient payment
        let payment_value = coin::value(&payment);
        assert!(payment_value >= min_repay_amount, errors::insufficient_payment());
        
        // Take exact repayment amount
        let paid_coin = coin::split(&mut payment, min_repay_amount, ctx);
        balance::join(&mut loan.repaid_funds, coin::into_balance(paid_coin));
        
        // Return any leftover collateral to borrower
        let remaining_collateral = balance::value(&loan.collateral);
        if (remaining_collateral > 0) {
            let collateral_coin = coin::from_balance(
                balance::split(&mut loan.collateral, remaining_collateral),
                ctx
            );
            transfer::public_transfer(collateral_coin, loan.borrower);
        };
        
        // Return excess payment if any
        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, loan.borrower);
        } else {
            coin::destroy_zero(payment);
        };
        
        // Mark loan as repaid
        loan.state = STATE_REPAID;
        
        // Calculate interest for event
        let interest = math::calculate_interest(
            loan.principal, 
            loan.interest_rate_bps, 
            loan.duration_ms
        );
        
        event::emit(LoanRepaid {
            loan_id,
            amount_paid: min_repay_amount,
            interest_paid: interest
        });
    }
}
