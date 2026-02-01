module tide::market {
    use std::ascii::String;
    use std::type_name::{get, into_string};
    use sui::event;
    
    // === Structs ===

    /// The Market object registers a supported pair.
    /// This allows frontend to discover supported markets.
    public struct Market<phantom CoinType, phantom CollateralType> has key, store {
        id: UID,
        coin_type_name: String,
        collateral_type_name: String,
        is_active: bool,
        total_loans: u64,
        total_volume: u64,
    }

    /// Admin Capability for the protocol.
    public struct AdminCap has key, store { id: UID }

    /// Specific capability to pause/unpause markets.
    public struct PauseCap has key, store { id: UID }

    // === Events ===
    
    public struct MarketCreated has copy, drop {
        market_id: ID,
        coin_type: String,
        collateral_type: String
    }

    // === Init ===

    fun init(ctx: &mut TxContext) {
        let admin = AdminCap { id: object::new(ctx) };
        transfer::public_transfer(admin, tx_context::sender(ctx));
        
        let pause = PauseCap { id: object::new(ctx) };
        transfer::public_transfer(pause, tx_context::sender(ctx));
    }

    // === Types for Errors ===
    const EMarketPaused: u64 = 100;

    // === Entry Functions ===

    public fun create_market<CoinType, CollateralType>(
        _admin: &AdminCap,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let market_id = object::uid_to_inner(&id);
        
        // Note: type_name::get returns a TypeName which we convert to ASCII String
        let coin_type_name = into_string(get<CoinType>());
        let collateral_type_name = into_string(get<CollateralType>());
        
        let market = Market<CoinType, CollateralType> {
            id,
            coin_type_name,
            collateral_type_name,
            is_active: true,
            total_loans: 0,
            total_volume: 0
        };

        event::emit(MarketCreated {
            market_id,
            coin_type: coin_type_name,
            collateral_type: collateral_type_name
        });

        transfer::share_object(market);
    }

    public fun pause_market<CoinType, CollateralType>(
        _pause_cap: &PauseCap,
        market: &mut Market<CoinType, CollateralType>
    ) {
        market.is_active = false;
    }

    public fun unpause_market<CoinType, CollateralType>(
        _pause_cap: &PauseCap,
        market: &mut Market<CoinType, CollateralType>
    ) {
        market.is_active = true;
    }

    // === Validation Helpers ===
    
    public fun assert_active<CoinType, CollateralType>(
        market: &Market<CoinType, CollateralType>
    ) {
        assert!(market.is_active, EMarketPaused);
    }
}
