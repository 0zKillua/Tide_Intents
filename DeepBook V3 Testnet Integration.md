# DeepBook V3 Testnet Integration

We will maintain this technical document with the latest information for all testnet integrations. The FAQ section may be filled in over time with questions that we receive. The current latest deployment uses the main branch.

**Note: This is for testnet integration. For mainnet, please use [this doc](https://docs.google.com/document/d/1uK4MNqYa0LdhVqBD4KqOcWG1N1nNNe3JwbeUZc1kH1I/edit?userstoinvite=sabrebar@gmail.com&sharingaction=manageaccess&role=writer&tab=t.0).** 

All testnet tokens are available upon request. Point of contact:  
Aslan Tashtanov TG: @aslantash  
Tony Lee TG: @tonylee08

# Material

```
Last contract deployment: Redeployment at Sep-26-2024
VERSION: 1 (ORIGINAL_DEEPBOOK_PACKAGE_ID = 0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982)
Note: This will be the package ID for original events

Contract upgrade: Upgrade at Feb-25-2025
VERSION: 2 (0x984757fc7c0e6dd5f15c2c66e881dd6e5aca98b725f3dbd83c445e057ebb790a)
Note: This will be the package ID for new events made available in Deepbook 3.1

Contract upgrade: Upgrade at Apr-28-2025
VERSION: 3 (0x9592ac923593f37f4fed15ee15f760ebd4c39729f53ee3e8c214de7a17157769)
Note: This includes minor improvements included in the Deepbook 3.1 upgrade

Contract upgrade: Upgrade at Jun-11-2025
VERSION: 4 (0xa3886aaa8aa831572dd39549242ca004a438c3a55967af9f0387ad2b01595068)
Note: This includes a minor bug fix in the Deepbook 3.1 upgrade

Contract upgrade: Upgrade at Sep-26-2025
VERSION: 5 (0x5da5bbf6fb097d108eaf2c2306f88beae4014c90a44b95c7e76a6bfccec5f5ee)
Note: This includes core updates including penalty taker fees and trading referrals

Contract upgrade: Upgrade at Sep-26-2025
VERSION: 6 (0xc483dba510597205749f2e8410c23f19be31a710aef251f353bc1b97755efd4d)
Note: Minor addition of events

Contract upgrade: Upgrade at Sep-29-2025
VERSION: 7 (0x16c4e050b9b19b25ce1365b96861bc50eb7e58383348a39ea8a8e1d063cfef73)
Note: Added swap exact functions using existing manager

Contract upgrade: Upgrade at Oct-21-2025
VERSION: 8 (0xcd40faffa91c00ce019bfe4a4b46f8d623e20bf331eb28990ee0305e9b9f3e3c)
Note: Added new event

Contract upgrade: Upgrade at Oct-31-2025
VERSION: 9 (0x5d520a3e3059b68530b2ef4080126dbb5d234e0afd66561d0d9bd48127a06044)
Note: Referral_id function is public

Contract upgrade: Upgrade at Oct-31-2025
VERSION: 10 (0x467e34e75debeea8b89d03aea15755373afc39a7c96c9959549c7f5f689843cf)
Note: New EWMA events
VERSION: 11 (0xa0936c6ea82fbfc0356eedc2e740e260dedaaa9f909a0715b1cc31e9a8283719)

Contract upgrade: Upgrade at Dec-5-2025
VERSION: 12 (0x926c446869fa175ec3b0dbf6c4f14604d86a415c1fccd8c8f823cfc46a29baed)
Note: Quantity in functions and other helpers

Contract upgrade: Upgrade at Dec-15-2025
VERSION: 13 (0x9ae1cbfb7475f6a4c2d4d3273335459f8f9d265874c4d161c1966cdcbd4e9ebc)
Note: Improved referral system

Contract upgrade: Upgrade at Dec-19-2025
VERSION: 14 (0xb48d47cb5f56d0f489f48f186d06672df59d64bd2f514b2f0ba40cbb8c8fd487)
Note: Small bug fix in swap with manager functions

Contract upgrade: Upgrade at Dec-29-2025
VERSION: 15 (0xbc331f09e5c737d45f074ad2d17c3038421b3b9018699e370d88d94938c53d28)
Note: Bug fixes for read only functions

DEEPBOOK_PACKAGE_ID = 0xbc331f09e5c737d45f074ad2d17c3038421b3b9018699e370d88d94938c53d28
REGISTRY_ID = 0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1

Please reach out to @tonylee08 on TG for test DBUSDC and DBUSDT

// Coins
DEEP_ID = 0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8
DEEP_TYPE = 0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP
DEEP_DECIMALS = 6

SUI_ID = 0x0000000000000000000000000000000000000000000000000000000000000002
SUI_TYPE = 0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI
SUI_DECIMALS = 9

DBUSDC_ID = 0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7DBUSDC_TYPE = 0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDCDBUSDC_DECIMALS = 6

DBUSDT_ID = 0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7DBUSDT_TYPE = 0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDT::DBUSDTDBUSDT_DECIMALS = 6

WAL_ID = 0x9ef7676a9f81937a52ae4b2af8d511a28a0b080477c0c2db40b0ab8882240d76WAL_TYPE = 0x9ef7676a9f81937a52ae4b2af8d511a28a0b080477c0c2db40b0ab8882240d76::wal::WALWAL_DECIMALS = 9

DBTC_ID = 0x6502dae813dbe5e42643c119a6450a518481f03063febc7e20238e43b6ea9e86
DBTC_TYPE = 0x6502dae813dbe5e42643c119a6450a518481f03063febc7e20238e43b6ea9e86::dbtc::DBTC
DBTC_DECIMALS = 8

// Pools
DEEP_SUI = 0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f
INITIAL_VERSION = 390631965TICK_SIZE = 10000000 = 0.00001LOT_SIZE = 1000000 = 1 DEEP
MIN_SIZE = 10000000 = 10 DEEP
INITIAL_TAKER_FEE = 0 bps
INITIAL_MAKER_FEE = 0 bps

SUI_DBUSDC = 0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5
INITIAL_VERSION = 390631966
TICK_SIZE = 10 = 0.00001
LOT_SIZE = 100000000 = 0.1 SUI
MIN_SIZE = 1000000000 = 1 SUI
INITIAL_TAKER_FEE = 10 bps
INITIAL_MAKER_FEE = 5 bps

DEEP_DBUSDC = 0xe86b991f8632217505fd859445f9803967ac84a9d4a1219065bf191fcb74b622
INITIAL_VERSION = 390631967
TICK_SIZE = 1000000 = 0.00001LOT_SIZE = 1000000 = 1 DEEP
MIN_SIZE = 10000000 = 10 DEEP
INITIAL_TAKER_FEE = 0 bps
INITIAL_MAKER_FEE = 0 bps

DBUSDT_DBUSDC = 0x83970bb02e3636efdff8c141ab06af5e3c9a22e2f74d7f02a9c3430d0d10c1ca
INITIAL_VERSION = 390631968
TICK_SIZE = 1000000 = 0.001
LOT_SIZE = 100000 = 0.1 DBUSDTMIN_SIZE = 1000000 = 1 DBUSDT
INITIAL_TAKER_FEE = 1 bps
INITIAL_MAKER_FEE = 0.5 bps

WAL_DBUSDC = 0xeb524b6aea0ec4b494878582e0b78924208339d360b62aec4a8ecd4031520dbb
INITIAL_VERSION = 390978151
TICK_SIZE = 1 = 0.000001
LOT_SIZE = 100000000 = 0.1 WALMIN_SIZE = 1000000000 = 1 WAL
INITIAL_TAKER_FEE = 10 bps
INITIAL_MAKER_FEE = 5 bps

WAL_SUI = 0x8c1c1b186c4fddab1ebd53e0895a36c1d1b3b9a77cd34e607bef49a38af0150a
INITIAL_VERSION = 390978151
TICK_SIZE = 1000 = 0.000001
LOT_SIZE = 100000000 = 0.1 WALMIN_SIZE = 1000000000 = 1 WAL
INITIAL_TAKER_FEE = 10 bps
INITIAL_MAKER_FEE = 5 bps

DBTC_DBUSDC = 0x0dce0aa771074eb83d1f4a29d48be8248d4d2190976a5241f66b43ec18fa34de
INITIAL_VERSION = 685751597
TICK_SIZE = 10000000 = 1
LOT_SIZE = 1000 = 0.00001 DBTCMIN_SIZE = 1000 = 0.00001 DBTC
INITIAL_TAKER_FEE = 10 bps
INITIAL_MAKER_FEE = 5 bps
```

[Whitepaper](https://cdn.prod.website-files.com/65fdccb65290aeb1c597b611/66059b44041261e3fe4a330d_deepbook_whitepaper.pdf)  
[Repository](https://github.com/MystenLabs/deepbookv3) \- Current deployment is the “testnet” branch.  
[Documentation](https://docs.sui.io/standards/deepbookv3)  
[Typescript SDK](https://github.com/MystenLabs/sui/tree/tlee/sdk/sdk/deepbook-v3) \- published, latest version seen here [https://www.npmjs.com/package/@mysten/deepbook-v3](https://www.npmjs.com/package/@mysten/deepbook-v3)   
[Typescript SDK Docs](https://docs.sui.io/standards/deepbookv3-sdk)  
Testnet RPC URL \- [https://fullnode.testnet.sui.io:443](https://fullnode.testnet.sui.io:443)

# For Market Makers

For the DEEP/SUI pool on testnet, use an anchor price of 1 (1 SUI per DEEP). DEEP/DBUSDC pool can be priced according to SUI price.

# Things to Know

To trade on DBv3, users must be familiar with two shared objects: Pool and BalanceManager. A Pool represents one market, for example SUI/USDC. DBv3 does not allow for duplicate markets, and each unique pair will have an independent Pool shared object. A BalanceManager represents the funds that a user holds. Users will load the BalanceManager with the appropriate funds and pass it in, along with a pool, to interact with DBv3. A single BalanceManager can be used to place orders in all pools, allowing for users to share their capital between pools.

The DEEP token is an integral part of the protocol. For the initial launch, it will be required to pay for all fees. The subsequent upgrade will allow users to use an input token to pay for fees, but there will be an incentive to continue using DEEP for trading fees, including discounted taker fees and maker rebates. Default taker/maker fees are 10/5 bps for volatile and 1/0.5 bps for stable pools. All pools with DEEP as the base or quote asset are whitelisted, which means 0 maker and takers fees to trade in those pools.

A BalanceManager must be loaded with the tokens that the user wants to trade, along with enough DEEP to pay for fees. If the BalanceManager does not have sufficient DEEP, or runs out of DEEP after executing some number of trades, then the user will not be able to place trades anymore. This can be problematic when sending raw transactions. The typescript SDK will handle these requirements appropriately and allow for users to trade in more flexible ways. 

All taker orders are atomic \- traded balances are moved into your BalanceManager by the end of the transaction. Maker orders are not atomic \- if your maker order is filled, your balances will remain in the pool. All interactions automatically settle any remaining balances, so if a user places another order, then their previously settled balances will be moved into their BalanceManager. Additionally, an explicit `withdraw_settled_amounts` function is available, which withdraws funds from the pools back into a user’s BalanceManager.

Tick math: when placing orders, the quantity is the absolute base quantity of the asset being traded. The price is the ratio of quote per base. To accommodate floating point math, the user must multiply their desired price by 10^(9 \+ quote\_decimals \- base\_decimals). 

- For example, when placing a buy order in the DEEP/DBUSDC pool of 1 DEEP @ 1 DBUSDC/DEEP (buy 1 DEEP @ $1), the quantity of the order would be 1\_000\_000 (1 \* 10^base\_decimals) and the price would be 1 \* 10^(9 \+ 6 \- 6\) \= 1\_000\_000\_000. In this case, DEEP and USDC both have 6 decimal places.  
- Another example, when placing a buy order in the DEEP/SUI pool of 15 DEEP @ 0.1 SUI/DEEP (buy 15 DEEP @ 0.1 SUI), the quantity of the order would be 15\_000\_000 (15 \* 10^base\_decimals) and the price would be 0.1 \* 10^(9 \+ 9 \- 6\) \= 100\_000\_000\_000. In this case, DEEP has 6 decimal places and SUI has 9 decimal places.

Swap exact: DBv3 exposes [swap\_exact\_base\_for\_quote](https://github.com/MystenLabs/deepbookv3/blob/post-audit/packages/deepbook/sources/pool.move#L142), [swap\_exact\_quote\_for\_base](https://github.com/MystenLabs/deepbookv3/blob/post-audit/packages/deepbook/sources/pool.move#L166), and [swap\_exact\_quantity](https://github.com/MystenLabs/deepbookv3/blob/post-audit/packages/deepbook/sources/pool.move#L187) for AMM-like swapping. Inputs take any base/quote quantity, does not require a BalanceManager, a price, and does not check for lot\_size restrictions. It will swap the maximum amount and refund any leftover Coins. 

Along with swaps, [get\_quote\_quantity\_out](https://github.com/MystenLabs/deepbookv3/blob/post-audit/packages/deepbook/sources/pool.move#L602), [get\_base\_quantity\_out](https://github.com/MystenLabs/deepbookv3/blob/post-audit/packages/deepbook/sources/pool.move#L611), and [get\_quantity\_out](https://github.com/MystenLabs/deepbookv3/blob/post-audit/packages/deepbook/sources/pool.move#L622) are read endpoints that compute the results of swap\_exact functions, returning the output quantities as well as the quantity of DEEP tokens that the swap would require.  

# FAQ

* Wrapping the balance manager [example](https://github.com/MystenLabs/deepbookv3/blob/at/wrapped-balance-manager-example/packages/deepbook/sources/wrapped_balance_manager.move)  
* Sponsored DEEP pool [example](https://github.com/MystenLabs/deepbookv3/tree/at/wrapped-balance-manager-example/packages/sponsored_deep)