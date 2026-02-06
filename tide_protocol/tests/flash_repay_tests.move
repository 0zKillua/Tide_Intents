#[test_only]
module tide::flash_repay_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin;
    use sui::clock;
    
    use tide::loan::{Self, Loan};
    use tide::mock_swap;

    // Test coin types
    public struct USDC has drop {}
    public struct SUI_COLLATERAL has drop {}

    // Helper to create a test loan
    fun setup_loan(scenario: &mut Scenario): (ID, ID) {
        let borrower = @0x1111;
        let lender = @0x2222;
        
        ts::next_tx(scenario, lender);
        {
            let clock = clock::create_for_testing(ts::ctx(scenario));
            
            // Create collateral balance (100 units)
            let collateral = coin::mint_for_testing<SUI_COLLATERAL>(100_000_000_000, ts::ctx(scenario));
            let collateral_balance = coin::into_balance(collateral);
            
            let (loan_id, note_id) = loan::create_loan<USDC, SUI_COLLATERAL>(
                borrower,
                lender,
                50_000_000, // 50 USDC principal
                collateral_balance,
                500, // 5% APR
                7000, // 70% LTV
                86400000, // 1 day duration
                &clock,
                ts::ctx(scenario)
            );
            
            clock::destroy_for_testing(clock);
            (loan_id, note_id)
        }
    }

    #[test]
    fun test_flash_repay_success() {
        let mut scenario = ts::begin(@0x0);
        let (_loan_id, _note_id) = setup_loan(&mut scenario);
        
        let borrower = @0x1111;
        
        // Borrower initiates flash repay
        ts::next_tx(&mut scenario, borrower);
        {
            let mut loan = ts::take_shared<Loan<USDC, SUI_COLLATERAL>>(&scenario);
            
            // Start collateral repayment - withdraw 60 units for swap
            let (collateral_coin, receipt) = loan::start_collateral_repayment(
                &mut loan,
                60_000_000_000, // 60 units
                ts::ctx(&mut scenario)
            );
            
            // Simulate swap: Collateral -> USDC (1:1 for testing)
            let usdc_coin = mock_swap::swap<SUI_COLLATERAL, USDC>(collateral_coin, ts::ctx(&mut scenario));
            
            // Finish repayment
            loan::finish_collateral_repayment(
                &mut loan,
                receipt,
                usdc_coin,
                ts::ctx(&mut scenario)
            );
            
            // Verify loan is repaid (state = 1)
            assert!(loan::state(&loan) == 1, 0);
            
            ts::return_shared(loan);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 9, location = tide::loan)] // EInsufficientPayment = 9
    fun test_flash_repay_insufficient_payment() {
        let mut scenario = ts::begin(@0x0);
        let (_loan_id, _note_id) = setup_loan(&mut scenario);
        
        let borrower = @0x1111;
        
        ts::next_tx(&mut scenario, borrower);
        {
            let mut loan = ts::take_shared<Loan<USDC, SUI_COLLATERAL>>(&scenario);
            
            // Withdraw only a small amount of collateral
            let (collateral_coin, receipt) = loan::start_collateral_repayment(
                &mut loan,
                10_000_000, // 10 units - not enough to cover 50 USDC debt
                ts::ctx(&mut scenario)
            );
            
            // Swap gives us only ~10 USDC (insufficient)
            let usdc_coin = mock_swap::swap<SUI_COLLATERAL, USDC>(collateral_coin, ts::ctx(&mut scenario));
            
            // This should fail - insufficient payment
            // The abort happens inside finish_collateral_repayment
            loan::finish_collateral_repayment(
                &mut loan,
                receipt,
                usdc_coin,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(loan);
        };
        
        ts::end(scenario);
    }
}
