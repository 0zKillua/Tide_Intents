module tide::liquidation {
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::event;
    
    use tide::loan::{Self, Loan};
    use tide::oracle::{Self, PriceOracle};
    use tide::protocol_math as math;
    use tide::protocol_constants as constants;
    use tide::errors;

    use tide::deepbook_adapter;
    use deepbook::pool::Pool;

    public struct LiquidationEvent has copy, drop {
        loan_id: ID,
        liquidator: address,
        debt_paid: u64,
        collateral_seized: u64,
        surplus_usdc: u64
    }

    /// Liquidate a loan by seizing collateral, swapping it on DeepBook, 
    /// and using proceeds to repay debt.
    /// Caller receives the liquidation bonus (surplus proceeds).
    public fun liquidate<CoinType, CollateralType>(
        loan: &mut Loan<CoinType, CollateralType>,
        pool: &mut Pool<CollateralType, CoinType>, // Collateral(SUI) -> Coin(USDC)
        oracle: &PriceOracle,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 1. Validation
        assert!(loan::is_active(loan), errors::loan_not_active());
        
        let now = clock::timestamp_ms(clock);
        let debt = loan::principal(loan) + math::calculate_interest(
            loan::principal(loan), 
            loan::interest_rate(loan), 
            loan::duration(loan)
        );

        // Check if overdue
        let is_overdue = now > (loan::start_time(loan) + loan::duration(loan));
        
        // Check Health Factor (Oracle Logic)
        let price = oracle::get_price(oracle, clock);
        let collateral_val_usd = (loan::collateral_balance(loan) * price) / constants::basis_points(); 
        
        let current_ltv = math::calculate_ltv(debt, collateral_val_usd);
        let is_unhealthy = current_ltv > loan::ltv_bps(loan);

        assert!(is_overdue || is_unhealthy, errors::not_liquidatable());

        // 2. Calculate Seize Amount
        // seize_value = debt * (1 + bonus)
        // This is in Collateral Token terms.
        let collateral_to_seize = math::calculate_collateral_to_seize(
            debt, 
            constants::liquidation_bonus_bps(), 
            price
        );
        
        // Cap at total collateral
        let total_collateral = loan::collateral_balance(loan);
        let final_seize_amount = if (collateral_to_seize > total_collateral) {
            total_collateral
        } else {
            collateral_to_seize
        };

        // 3. Seize Collateral
        let seized_balance = loan::seize_collateral(loan, final_seize_amount);
        let seized_coin = coin::from_balance(seized_balance, ctx);

        // 4. Swap on DeepBook (Sell SUI -> Buy USDC)
        // Adapater: swap_exact_base_for_quote(pool, base_in, min_quote, clock, ctx)
        // We require proceeds >= debt. (No bad debt support yet).
        let (remainder_sui, mut proceeds_usdc) = deepbook_adapter::swap_exact_base_for_quote(
            pool,
            seized_coin,
            debt, // Checks min output
            clock,
            ctx
        );

        // 5. Repay Debt
        let proceeds_val = coin::value(&proceeds_usdc);
        assert!(proceeds_val >= debt, errors::insufficient_payment());

        let repayment_coin = coin::split(&mut proceeds_usdc, debt, ctx);
        let repayment_balance = coin::into_balance(repayment_coin);

        loan::resolve_liquidation(loan, repayment_balance);

        // 6. Handle Surplus / Remainder
        let surplus_val = coin::value(&proceeds_usdc);
        
        // Give surplus (Liquidation Bonus) to Caller
        if (surplus_val > 0) {
            transfer::public_transfer(proceeds_usdc, tx_context::sender(ctx));
        } else {
            coin::destroy_zero(proceeds_usdc);
        };

        // Give remainder SUI (Dust from swap) to Caller (or back to borrower?)
        // Liquidator kept it in the seize calculation, so it's theirs.
        if (coin::value(&remainder_sui) > 0) {
            transfer::public_transfer(remainder_sui, tx_context::sender(ctx));
        } else {
            coin::destroy_zero(remainder_sui);
        };

        // Return remaining collateral (unseized) to borrower
        loan::return_remaining_collateral(loan, ctx);

        event::emit(LiquidationEvent {
            loan_id: object::id(loan),
            liquidator: tx_context::sender(ctx),
            debt_paid: debt,
            collateral_seized: final_seize_amount,
            surplus_usdc: surplus_val
        });
    }
}
