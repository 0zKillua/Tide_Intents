module tide::protocol_math {
    use tide::protocol_constants as constants;

    public fun calculate_interest(principal: u64, rate_bps: u64, duration_ms: u64): u64 {
        let duration_seconds = duration_ms / 1000;
        let numerator = (principal as u128) * (rate_bps as u128) * (duration_seconds as u128);
        // BASIS_POINTS * SECONDS_PER_YEAR
        let denominator = (constants::basis_points() as u128) * (constants::seconds_per_year() as u128);
        (numerator / denominator as u64)
    }

    public fun calculate_ltv(principal: u64, collateral_value: u64): u64 {
        if (collateral_value == 0) return 0; // Should not happen in valid loans but safe check
        let numerator = (principal as u128) * (constants::basis_points() as u128);
        ((numerator / (collateral_value as u128)) as u64)
    }

    public fun calculate_collateral_to_seize(debt: u64, bonus_bps: u64, price: u64): u64 {
        if (price == 0) return 0; // Prevent division by zero
        // collateral_value = debt * (1 + bonus)
        
        let debt_val = (debt as u128);
        let total_bps = (constants::basis_points() as u128) + (bonus_bps as u128);
        
        let collateral_value_needed = (debt_val * total_bps) / (constants::basis_points() as u128);
        
        // quantity = value / price
        ((collateral_value_needed / (price as u128)) as u64)
    }
}
