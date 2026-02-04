#[test_only]
module tide::test_env {
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::test_scenario::{Self, Scenario};
    use sui::tx_context::TxContext;
    
    // === Mock Token Implementations ===
    public struct USDC has drop {}
    public struct BTC has drop {}

    // === Helpers ===

    public fun scenario(): Scenario {
        test_scenario::begin(@0xCAFE)
    }

    public fun setup_test_coin<T>(mint_amount: u64, ctx: &mut TxContext): Coin<T> {
        coin::mint_for_testing<T>(mint_amount, ctx)
    }

    public fun forward_time(clock: &mut Clock, ms: u64) {
        clock::increment_for_testing(clock, ms);
    }
}
