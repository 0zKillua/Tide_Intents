module tide::oracle {
    use sui::clock::{Self, Clock};
    use tide::errors;

    // === Constants ===
    const MAX_PRICE_AGE_MS: u64 = 60000; // 1 minute freshness

    // === Structs ===
    
    /// Mock PriceInfoObject for development. 
    /// In production, this would be the generic Pyth PriceInfoObject or Wormhole VAA wrapper.
    public struct PriceOracle has key, store {
        id: UID,
        price: u64, // Scaled by 10^X
        decimals: u8,
        timestamp_ms: u64
    }
    
    // === Admin/Test Functions ===
    
    public fun create_oracle(ctx: &mut TxContext): PriceOracle {
        PriceOracle {
            id: object::new(ctx),
            price: 0,
            decimals: 9,
            timestamp_ms: 0
        }
    }

    public fun update_price(
        oracle: &mut PriceOracle, 
        price: u64, 
        timestamp_ms: u64
    ) {
        oracle.price = price;
        oracle.timestamp_ms = timestamp_ms;
    }

    // === Public Interface ===

    public fun get_price(
        oracle: &PriceOracle,
        clock: &Clock
    ): u64 {
        let now = clock::timestamp_ms(clock);
        
        // Check Staleness
        assert!(now >= oracle.timestamp_ms, errors::oracle_stale());
        assert!(now - oracle.timestamp_ms <= MAX_PRICE_AGE_MS, errors::oracle_stale());
        
        oracle.price
    }
}
