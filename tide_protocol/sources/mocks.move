module tide::mock_usdc {
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
        transfer::public_share_object(cap); // Shared Faucet
    }
}

module tide::mock_btc {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::TxContext;

    public struct MOCK_BTC has drop {}

    fun init(otw: MOCK_BTC, ctx: &mut TxContext) {
        let (cap, metadata) = coin::create_currency(
            otw, 
            8, 
            b"BTC", 
            b"Mock BTC", 
            b"Mock Bitcoin for Tide Protocol", 
            option::none(), 
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_share_object(cap); // Shared Faucet
    }
}

module tide::mock_sui {
    use std::option;
    use sui::coin;
    use sui::transfer;
    use sui::tx_context::TxContext;

    public struct MOCK_SUI has drop {}

    fun init(otw: MOCK_SUI, ctx: &mut TxContext) {
        let (cap, metadata) = coin::create_currency(
            otw, 
            9, 
            b"mSUI", 
            b"Mock SUI", 
            b"Mock SUI for Tide Protocol", 
            option::none(), 
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_share_object(cap); // Shared Faucet
    }
}
