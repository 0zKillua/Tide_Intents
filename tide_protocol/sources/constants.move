module tide::constants {
    // Risk Parameters
    const BASIS_POINTS: u64 = 10000;
    const MIN_LTV_GAP_BPS: u64 = 800;      // 8%
    const WITHDRAWAL_BUFFER_BPS: u64 = 300; // 3%
    const LIQUIDATION_BONUS_BPS: u64 = 500; // 5%
    const MAX_PRICE_DEVIATION_BPS: u64 = 1500; // 15%
    const ORACLE_TIMEOUT_MS: u64 = 3600000; // 1 hour
    const SECONDS_PER_YEAR: u64 = 31536000;

    public fun basis_points(): u64 { BASIS_POINTS }
    public fun min_ltv_gap_bps(): u64 { MIN_LTV_GAP_BPS }
    public fun withdrawal_buffer_bps(): u64 { WITHDRAWAL_BUFFER_BPS }
    public fun liquidation_bonus_bps(): u64 { LIQUIDATION_BONUS_BPS }
    public fun max_price_deviation_bps(): u64 { MAX_PRICE_DEVIATION_BPS }
    public fun oracle_timeout_ms(): u64 { ORACLE_TIMEOUT_MS }
    public fun seconds_per_year(): u64 { SECONDS_PER_YEAR }
}
