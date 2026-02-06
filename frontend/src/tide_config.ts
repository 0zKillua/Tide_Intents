export const TIDE_CONFIG = {
    PACKAGE_ID: "0x2b7ded2926ca0fb9c603a993642e51cf395c43eae693b59ee8c37ada6f222981",
    MARKET_ID: "0xd6fea2ca957518a4cd3b8ed56c278f370419cf854900d666299192d8b529312d",
    PAUSE_CAP_ID: "0xe616a0094d877bc8750b1711636c5d0d8642763a1b9ce77635af08e225255f71",
    ADMIN_CAP_ID: "0x261fa88d59bf5b1c18a090bfe8b4ed691c730e080c937050a5b04e97a8b46a83",
    REGISTRY_ID: "0x940531c1a8a96631f1cd72c7773d0bef3ed6d6d25ac351ee026633b15eb44903",
    
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
