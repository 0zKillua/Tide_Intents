module tide::errors {
    const EInvalidAmount: u64 = 1;
    const EInvalidRate: u64 = 2;
    const EInvalidDuration: u64 = 3;
    const ENotBorrower: u64 = 4;
    const ENotLender: u64 = 5;
    const ELoanNotActive: u64 = 6;
    const ELoanNotRepaid: u64 = 7;
    const ENotLiquidatable: u64 = 8;
    const EInsufficientPayment: u64 = 9;
    const EUnsafeLTVGap: u64 = 10;
    const ERateMismatch: u64 = 11;
    const EDurationMismatch: u64 = 12;
    const EMarketMismatch: u64 = 13;
    const EIntentExpired: u64 = 14;
    const EOracleStale: u64 = 15;
    const EPriceDeviation: u64 = 16;
    const EInvalidLoanNote: u64 = 17;

    public fun invalid_amount(): u64 { EInvalidAmount }
    public fun invalid_rate(): u64 { EInvalidRate }
    public fun invalid_duration(): u64 { EInvalidDuration }
    public fun not_borrower(): u64 { ENotBorrower }
    public fun not_lender(): u64 { ENotLender }
    public fun loan_not_active(): u64 { ELoanNotActive }
    public fun loan_not_repaid(): u64 { ELoanNotRepaid }
    public fun not_liquidatable(): u64 { ENotLiquidatable }
    public fun insufficient_payment(): u64 { EInsufficientPayment }
    public fun unsafe_ltv_gap(): u64 { EUnsafeLTVGap }
    public fun rate_mismatch(): u64 { ERateMismatch }
    public fun duration_mismatch(): u64 { EDurationMismatch }
    public fun market_mismatch(): u64 { EMarketMismatch }
    public fun intent_expired(): u64 { EIntentExpired }
    public fun oracle_stale(): u64 { EOracleStale }
    public fun price_deviation(): u64 { EPriceDeviation }
    public fun invalid_loan_note(): u64 { EInvalidLoanNote }
}
