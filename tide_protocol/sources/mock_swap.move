/// Mock swap module for testing the hot potato pattern.
/// Simulates a 1:1 swap between any two coin types.
/// This is for testing only - in production, use DeepBook adapter.
#[test_only]
module tide::mock_swap {
    use sui::coin::{Self, Coin};
    use sui::balance;

    /// Mock swap: exchanges CoinIn for CoinOut at 1:1 ratio.
    /// For testing purposes only.
    public fun swap<CoinIn, CoinOut>(
        coin_in: Coin<CoinIn>,
        ctx: &mut TxContext
    ): Coin<CoinOut> {
        let amount = coin::value(&coin_in);
        // Convert to balance and destroy
        let bal = coin::into_balance(coin_in);
        balance::destroy_for_testing(bal);
        // Mint output
        coin::mint_for_testing<CoinOut>(amount, ctx)
    }

    /// Mock swap with configurable rate (for testing slippage scenarios).
    /// rate_bps: 10000 = 1:1, 9000 = 90% output, 11000 = 110% output
    public fun swap_with_rate<CoinIn, CoinOut>(
        coin_in: Coin<CoinIn>,
        rate_bps: u64,
        ctx: &mut TxContext
    ): Coin<CoinOut> {
        let amount = coin::value(&coin_in);
        let output_amount = (amount * rate_bps) / 10000;
        let bal = coin::into_balance(coin_in);
        balance::destroy_for_testing(bal);
        coin::mint_for_testing<CoinOut>(output_amount, ctx)
    }
}
