module tide::protocol_constants {
    // === Math Constants ===
    
    /// 100% in Basis Points
    public fun basis_points(): u64 { 10000 }
    
    /// Seconds in a year (365 days)
    public fun seconds_per_year(): u64 { 31536000 }

    /// Scaling factor for Interest Rates (if needed)
    public fun rate_scale(): u64 { 10000 }

    // === Protocol Constants ===
    
    /// Oracle freshness threshold in ms (15 minutes)
    public fun oracle_timeout_ms(): u64 { 900_000 } 

    /// Minimum gap between Origination LTV and Liquidation LTV (8%)
    public fun min_ltv_gap_bps(): u64 { 800 } 

    /// Bonus received by liquidators (5%)
    public fun liquidation_bonus_bps(): u64 { 500 }

    /// Pool Creation Fee (DeepBook) - 500 DEEP
    public fun pool_creation_fee(): u64 { 500_000_000 } // 500 * 10^6

    // === Exchange Rates (1:1 Hardcoded for Demo) ===
    
    /// 1 SUI = 1 USDC
    /// Returns price of 1 Unit of Collateral in terms of Debt
    /// Scaled by 1 (1:1)
    public fun hardcoded_exchange_rate(): u64 { 1 }
}
