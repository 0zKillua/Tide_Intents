module tide_tokens::mock_usdc {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::TxContext;

    public struct MOCK_USDC has drop {}

    fun init(otw: MOCK_USDC, ctx: &mut TxContext) {
        let (cap, metadata) = coin::create_currency(
            otw, 
            6, 
            b"USDC", 
            b"Mock USDC", 
            b"Mock USD Coin for Tide Protocol", 
            option::none(), 
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_share_object(cap); // Shared Faucet for easy testing
    }
}
