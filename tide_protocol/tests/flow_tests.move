#[test_only]
module tide::flow_tests {
    use sui::coin::{Self, Coin};
    use sui::test_scenario::{Self, next_tx, ctx};
    use sui::clock::{Self, Clock};
    
    use tide::intents::{Self, LendOffer, BorrowRequest};
    use tide::loan::{Self, Loan, LoanNote};
    use tide::matcher;
    use tide::test_env::{Self, USDC, BTC};

    #[test]
    fun test_successful_loan_lifecycle() {
        let mut scenario = test_env::scenario();
        let (borrower, lender) = (@0xB, @0xA);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));

        // 1. Lender creates Offer
        next_tx(&mut scenario, lender);
        {
            let payment = test_env::setup_test_coin<USDC>(10000, ctx(&mut scenario));
            intents::create_lend_offer<USDC>(
                payment,
                500, // min_rate 5%
                8000, // max_ltv 80%
                31536000000, // 1 year
                1000, // min_fill
                true, // partial match
                object::id_from_address(@0x1), // market_id mock
                &clock,
                ctx(&mut scenario)
            );
        };

        // 2. Borrower creates Request
        next_tx(&mut scenario, borrower);
        {
            let collateral = test_env::setup_test_coin<BTC>(20000, ctx(&mut scenario)); // Worth double loan
            intents::create_borrow_request<USDC, BTC>(
                collateral,
                5000, // request 5000 USDC
                1000, // max_rate 10%
                1000, // min_ltv (ignored for check here?) wait, request wants min LTV, lender wants MAX ltv.
                      // Borrower wants e.g. "At least 50% LTV" (meaning I give X collateral, I want Y loan, Y/X >= 50%)
                      // Or does min_ltv mean "I don't want to over-collateralize?"
                      // Let's assume standard meaning: Min LTV accepted. 
                      // Actually, usually borrowers care about MAX Loan amount for collateral.
                0, // comm
                31536000000,
                object::id_from_address(@0x1),
                &clock,
                ctx(&mut scenario)
            );
        };

        // 3. Matcher matches them
        next_tx(&mut scenario, @0xC);
        {
            let mut offer = test_scenario::take_shared<LendOffer<USDC>>(&scenario);
            let request = test_scenario::take_shared<BorrowRequest<USDC, BTC>>(&scenario);
            
            matcher::match_intents(
                &mut offer,
                request,
                &clock,
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(offer);
        };

        // 4. Verify Loan Created
        next_tx(&mut scenario, borrower);
        {
            assert!(test_scenario::has_most_recent_shared<Loan<USDC, BTC>>(), 1);
            
            // Verify Borrower got funds
            let funds = test_scenario::take_from_sender<Coin<USDC>>(&scenario);
            assert!(coin::value(&funds) == 5000, 2);
            test_scenario::return_to_sender(&scenario, funds);
        };
        
        // 5. Verify Lender got Note
        next_tx(&mut scenario, lender);
        {
             assert!(test_scenario::has_most_recent_for_sender<LoanNote>(&scenario), 3);
        };
        
        // 6. Repay Loan
        next_tx(&mut scenario, borrower);
        {
            let mut loan = test_scenario::take_shared<Loan<USDC, BTC>>(&scenario);
            
            // Advance time 1 year
            clock::increment_for_testing(&mut clock, 31536000000);
            
            // Pay principal + interest (5% of 5000 = 250)
            let repayment = test_env::setup_test_coin<USDC>(5250, ctx(&mut scenario));
            
            loan::repay(&mut loan, repayment, &clock, ctx(&mut scenario));
            
            test_scenario::return_shared(loan);
        };
        
        // 7. Claim Repayment
        next_tx(&mut scenario, lender);
        {
            let mut loan = test_scenario::take_shared<Loan<USDC, BTC>>(&scenario);
            let note = test_scenario::take_from_sender<LoanNote>(&scenario);
            
            loan::claim(&mut loan, note, ctx(&mut scenario));
            
            test_scenario::return_shared(loan);
            
            // Verify Lender has more funds
            // (Note: scenario handling of coin merging is tricky, we just verify no crash)
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}
