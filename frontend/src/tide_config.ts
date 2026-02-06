export const TIDE_CONFIG = {
    PACKAGE_ID: "0x2b7ded2926ca0fb9c603a993642e51cf395c43eae693b59ee8c37ada6f222981",
    MARKET_ID: "0xd6fea2ca957518a4cd3b8ed56c278f370419cf854900d666299192d8b529312d",
    PAUSE_CAP_ID: "0xe616a0094d877bc8750b1711636c5d0d8642763a1b9ce77635af08e225255f71",
    ADMIN_CAP_ID: "0x261fa88d59bf5b1c18a090bfe8b4ed691c730e080c937050a5b04e97a8b46a83",
    REGISTRY_ID: "0x940531c1a8a96631f1cd72c7773d0bef3ed6d6d25ac351ee026633b15eb44903",
    
    // DeepBook V3 Testnet
    // IMPORTANT: This must match the package that created the pool!
    DEEPBOOK: {
        PACKAGE_ID: "0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982",
        REGISTRY: "0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1",
        // SUI/MOCK_USDC Pool - deployed and seeded with DEEP price point
        SUI_USDC_POOL: "0x25fa26d1d3125bc32c9665dae5505b96737c939d4ab79014b379ffee954684f4",
        // Testnet DEEP token for fee payments
        DEEP_TOKEN_TYPE: "0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP",
    },
    
    // Tokens
    COINS: {
        USDC: {
            TYPE: "0xef553a6b8a00ac9c00d7983a24e4ca9a9748dcad02f0ab31bb8c502583ab1d0a::mock_usdc::MOCK_USDC",
            DECIMALS: 6,
            ICON_URL: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
            TREASURY_CAP: "0x35b378e2bcb2231f22fc95a94005d38be19ec9ddb4963d327609d4ee6752a662"
        },

        SUI: {
            TYPE: "0x2::sui::SUI",
            DECIMALS: 9, 
            ICON_URL: "https://cryptologos.cc/logos/sui-sui-logo.png"
        }
    }
};
