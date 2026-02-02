module tide::liquidation {
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::event;
    
    use tide::loan::{Self, Loan};
    use tide::oracle::{Self, PriceOracle};
    use tide::math;
    use tide::constants;
    use tide::errors;

    public struct LiquidationEvent has copy, drop {
        loan_id: ID,
        liquidator: address,
        debt_paid: u64,
        collateral_seized: u64
    }

    public fun liquidate<CoinType, CollateralType>(
        loan: &mut Loan<CoinType, CollateralType>,
        mut payment: Coin<CoinType>,
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
        
        // Check Health Factor
        let price = oracle::get_price(oracle, clock);
        let collateral_val = math::calculate_ltv(debt, (loan::collateral_balance(loan) as u64) * price); // This math might be tricky with decimals.
        // Wait, math::calculate_ltv takes (principal, collateral_value). 
        // collateral_value should be (amount * price).
        // Let's assume price is scaled to 1e9? 
        // We probably need a better math helper for Price * Amount -> Value.
        
        // Let's assume Price is 1:1 normalized for now or implement proper scaling later.
        // For HackMoney MVP, let's assume price is "amount of CoinType per CollateralType unit".
        
        let collateral_value = (loan::collateral_balance(loan) * price) / constants::basis_points(); // Determine normalization
        
        let current_ltv = math::calculate_ltv(debt, collateral_value);
        
        let is_unhealthy = current_ltv > loan::ltv_bps(loan);

        assert!(is_overdue || is_unhealthy, errors::not_liquidatable());

        // 2. Execution
        
        let payment_val = coin::value(&payment);
        assert!(payment_val >= debt, errors::insufficient_payment());

        // Take Debt
        let paid_coin = coin::split(&mut payment, debt, ctx);
        let paid_balance = coin::into_balance(paid_coin);
        
        // Calculate Seize Amount
        // seize_value = debt * (1 + bonus)
        let collateral_to_seize = math::calculate_collateral_to_seize(
            debt, 
            constants::liquidation_bonus_bps(), 
            price
        );
        
        // Cap at total collateral (Bad Debt logic)
        let total_collateral = loan::collateral_balance(loan);
        let final_seize_amount = if (collateral_to_seize > total_collateral) {
            total_collateral
        } else {
            collateral_to_seize
        };

        // Execute on Loan
        let seized_collateral = loan::execute_liquidation(
            loan,
            paid_balance,
            final_seize_amount
        );

        // Send check
        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, tx_context::sender(ctx));
        } else {
            coin::destroy_zero(payment);
        };
        
        // Send seized collateral to liquidator
        let seized_coin = coin::from_balance(seized_collateral, ctx);
        transfer::public_transfer(seized_coin, tx_context::sender(ctx));

        // Return remaining collateral to borrower
        loan::return_remaining_collateral(loan, ctx);

        event::emit(LiquidationEvent {
            loan_id: object::id(loan),
            liquidator: tx_context::sender(ctx),
            debt_paid: debt,
            collateral_seized: final_seize_amount
        });
    }
}
