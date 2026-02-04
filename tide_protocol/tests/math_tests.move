#[test_only]
module tide::math_tests {
    use tide::math;

    #[test]
    fun test_interest_calc() {
        let principal = 1000;
        let rate_bps = 1000; // 10%
        let duration_ms = 31536000000; // 1 year (approx)
        
        let interest = math::calculate_interest(principal, rate_bps, duration_ms);
        
        // 1000 * 10% = 100
        assert!(interest == 100, 0); 
    }

    #[test]
    fun test_interest_calc_half_year() {
        let principal = 1000;
        let rate_bps = 1000; // 10%
        let duration_ms = 31536000000 / 2; // 0.5 year
        
        let interest = math::calculate_interest(principal, rate_bps, duration_ms);
        
        // 1000 * 10% * 0.5 = 50
        assert!(interest == 50, 0); 
    }

    #[test]
    fun test_ltv_calc() {
        let debt = 700;
        let collateral_val = 1000;
        
        let ltv = math::calculate_ltv(debt, collateral_val);
        // 700 / 1000 = 0.7 = 7000 bps
        assert!(ltv == 7000, 0);
    }
}
