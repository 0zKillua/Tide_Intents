module tide::intents {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::type_name::{get, into_string};
    
    use tide::constants;
    use tide::errors;

    // === Structs ===

    /// A lender's intent to lend `CoinType`.
    /// This is a Shared Object to allow solvers to match it.
    public struct LendOffer<phantom CoinType> has key, store {
        id: UID,
        provider: address,
        asset: Balance<CoinType>,
        filled_amount: u64,
        min_fill_amount: u64,
        min_rate_bps: u64,
        max_ltv_bps: u64,
        max_duration_ms: u64,
        allow_partial_fill: bool,
        expiry_ms: u64,
        market_id: ID, // Future-proofing: Points to Market object
    }

    /// A borrower's intent to borrow `CoinType` by collateralizing `CollateralType`.
    /// This is a Shared Object.
    public struct BorrowRequest<phantom CoinType, phantom CollateralType> has key, store {
        id: UID,
        borrower: address,
        collateral: Balance<CollateralType>,
        request_amount: u64,
        max_rate_bps: u64,
        min_ltv_bps: u64,
        matcher_commission_bps: u64,
        duration_ms: u64,
        expiry_ms: u64,
        market_id: ID,
    }

    // === Events ===

    public struct LendOfferCreated has copy, drop { 
        offer_id: ID, 
        provider: address, 
        amount: u64,
        coin_type: std::ascii::String 
    }
    public struct LendOfferCancelled has copy, drop { offer_id: ID }
    
    public struct BorrowRequestCreated has copy, drop { 
        request_id: ID, 
        borrower: address, 
        amount: u64, 
        collateral_amount: u64,
        coin_type: std::ascii::String,
        collateral_type: std::ascii::String 
    }
    public struct BorrowRequestCancelled has copy, drop { request_id: ID }

    // === Entry Functions: LendOffer ===

    public fun create_lend_offer<CoinType>(
        payment: Coin<CoinType>,
        min_rate_bps: u64,
        max_ltv_bps: u64,
        max_duration_ms: u64,
        min_fill_amount: u64,
        allow_partial_fill: bool,
        market_id: ID, // Placeholder for Phase 6
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        assert!(amount > 0, errors::invalid_amount());
        
        // Basic validations
        assert!(min_fill_amount <= amount, errors::invalid_amount());

        let id = object::new(ctx);
        let offer_id = object::uid_to_inner(&id);
        let provider = tx_context::sender(ctx);

        let offer = LendOffer {
            id,
            provider,
            asset: coin::into_balance(payment),
            filled_amount: 0,
            min_fill_amount,
            min_rate_bps,
            max_ltv_bps,
            max_duration_ms,
            allow_partial_fill,
            expiry_ms: clock::timestamp_ms(clock) + constants::oracle_timeout_ms() * 24, // Example default
            market_id,
        };

        event::emit(LendOfferCreated {
            offer_id,
            provider,
            amount,
            coin_type: into_string(get<CoinType>())
        });

        // Share object
        transfer::share_object(offer);
    }

    public fun cancel_lend_offer<CoinType>(
        offer: LendOffer<CoinType>,
        ctx: &mut TxContext
    ) {
        assert!(offer.provider == tx_context::sender(ctx), errors::not_lender());
        
        let LendOffer {
            id,
            provider: _,
            asset,
            filled_amount: _,
            min_fill_amount: _,
            min_rate_bps: _,
            max_ltv_bps: _,
            max_duration_ms: _,
            allow_partial_fill: _,
            expiry_ms: _,
            market_id: _,
        } = offer;

        let amount_remaining = balance::value(&asset);
        if (amount_remaining > 0) {
            let coin_to_return = coin::from_balance(asset, ctx);
            transfer::public_transfer(coin_to_return, tx_context::sender(ctx));
        } else {
            balance::destroy_zero(asset);
        };

        event::emit(LendOfferCancelled { offer_id: object::uid_to_inner(&id) });
        object::delete(id);
    }

    // === Entry Functions: BorrowRequest ===

    public fun create_borrow_request<CoinType, CollateralType>(
        collateral: Coin<CollateralType>,
        request_amount: u64,
        max_rate_bps: u64,
        min_ltv_bps: u64,
        matcher_commission_bps: u64,
        duration_ms: u64,
        market_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let collateral_amount = coin::value(&collateral);
        assert!(collateral_amount > 0, errors::invalid_amount());
        assert!(request_amount > 0, errors::invalid_amount());

        let id = object::new(ctx);
        let request_id = object::uid_to_inner(&id);
        let borrower = tx_context::sender(ctx);
        let expiry_ms = clock::timestamp_ms(clock) + constants::oracle_timeout_ms() * 24; // Default expiry

        let request = BorrowRequest<CoinType, CollateralType> {
            id,
            borrower,
            collateral: coin::into_balance(collateral),
            request_amount,
            max_rate_bps,
            min_ltv_bps,
            matcher_commission_bps,
            duration_ms,
            expiry_ms,
            market_id,
        };

        event::emit(BorrowRequestCreated {
            request_id,
            borrower,
            amount: request_amount,
            collateral_amount,
            coin_type: into_string(get<CoinType>()),
            collateral_type: into_string(get<CollateralType>())
        });

        transfer::share_object(request);
    }

    public fun cancel_borrow_request<CoinType, CollateralType>(
        request: BorrowRequest<CoinType, CollateralType>,
        ctx: &mut TxContext
    ) {
        assert!(request.borrower == tx_context::sender(ctx), errors::not_borrower());

        let BorrowRequest {
            id,
            borrower: _,
            collateral,
            request_amount: _,
            max_rate_bps: _,
            min_ltv_bps: _,
            matcher_commission_bps: _,
            duration_ms: _,
            expiry_ms: _,
            market_id: _,
        } = request;

        let collateral_len = balance::value(&collateral);
        if (collateral_len > 0) {
            let coin_to_return = coin::from_balance(collateral, ctx);
            transfer::public_transfer(coin_to_return, tx_context::sender(ctx));
        } else {
            balance::destroy_zero(collateral);
        };

        event::emit(BorrowRequestCancelled { request_id: object::uid_to_inner(&id) });
        object::delete(id);
    }

    // === Getters (for Matching Phase) ===

    public fun lend_offer_info<CoinType>(offer: &LendOffer<CoinType>): (address, u64, u64, u64, u64, u64, u64) {
        (
            offer.provider,
            balance::value(&offer.asset),
            offer.min_rate_bps,
            offer.max_ltv_bps,
            offer.max_duration_ms,
            offer.min_fill_amount,
            offer.expiry_ms
        )
    }

    public fun borrow_request_info<CoinType, CollateralType>(
        req: &BorrowRequest<CoinType, CollateralType>
    ): (address, u64, u64, u64, u64, u64, u64) {
        (
            req.borrower,
            balance::value(&req.collateral),
            req.request_amount,
            req.max_rate_bps,
            req.min_ltv_bps,
            req.duration_ms,
            req.expiry_ms
        )
    }

    // === Friend Functions ===
    // These will be used by the matcher module to modify the objects

    public(package) fun update_lend_offer<CoinType>(
        offer: &mut LendOffer<CoinType>, 
        amount_taken: u64
    ): Balance<CoinType> {
        offer.filled_amount = offer.filled_amount + amount_taken;
        balance::split(&mut offer.asset, amount_taken)
    }

    public(package) fun consume_borrow_request<CoinType, CollateralType>(
        request: BorrowRequest<CoinType, CollateralType>
    ): (Balance<CollateralType>, ID) {
        let BorrowRequest {
            id,
            borrower: _,
            collateral,
            request_amount: _,
            max_rate_bps: _,
            min_ltv_bps: _,
            matcher_commission_bps: _,
            duration_ms: _,
            expiry_ms: _,
            market_id: _,
        } = request;
        let uid = object::uid_to_inner(&id);
        object::delete(id);
        (collateral, uid)
    }
}
