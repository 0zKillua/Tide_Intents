module tide::deepbook_adapter {
    use sui::coin::{Self, Coin};
    use sui::clock::Clock;
    use sui::tx_context::TxContext;
    use deepbook::pool::{Self, Pool};
    use token::deep::DEEP;

    /// Swap Exact Base (e.g. SUI) for Quote (e.g. USDC).
    /// Used for Liquidation (Seized SUI -> USDC) or Repayment.
    /// Wraps `deepbook::pool::swap_exact_quantity` which handles
    /// ephemeral BalanceManager creation internally.
    public fun swap_exact_base_for_quote<Base, Quote>(
        pool: &mut Pool<Base, Quote>,
        base_in: Coin<Base>,
        min_quote_out: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): (Coin<Base>, Coin<Quote>) {
        // 1. Prepare Inputs
        // We are selling Base, so we provide Base input and 0 Quote input.
        let quote_empty = coin::zero<Quote>(ctx);
        let deep_empty = coin::zero<DEEP>(ctx);

        // 2. Call DeepBook
        // Returns (base_remainder, quote_proceeds, deep_unused)
        let (base_out, quote_out, deep_out) = pool::swap_exact_quantity(
            pool,
            base_in,
            quote_empty,
            deep_empty,
            min_quote_out,
            clock,
            ctx
        );

        // 3. Clean up
        coin::destroy_zero(deep_out);

        (base_out, quote_out)
    }
}
