#!/bin/bash
# Seed DeepBook Pool (SUI / MOCK_USDC)
# Use a single PTB to:
# 1. Create BalanceManager
# 2. Deposit USDC
# 3. Place Bid
# 4. Share BalanceManager (optional, but good practice)

DEEPBOOK_PACKAGE="0xbc331f09e5c737d45f074ad2d17c3038421b3b9018699e370d88d94938c53d28"
POOL_ID="0x25fa26d1d3125bc32c9665dae5505b96737c939d4ab79014b379ffee954684f4"

# Quote Coin: MOCK_USDC
QUOTE_COIN="0xdfa017bf333cd38d9f27018dd3f095144a11ddefd1bcd0ddea939a0ce424e5a3"

# Types
BASE_TYPE="0x2::sui::SUI"
QUOTE_TYPE="0xef553a6b8a00ac9c00d7983a24e4ca9a9748dcad02f0ab31bb8c502583ab1d0a::mock_usdc::MOCK_USDC"

# Params
PRICE_TICKS=10000     # 1.0 USDC
QUANTITY_LOTS=50      # 5 SUI (Consumes ~5 MOCK_USDC, not SUI)
CLIENT_ORDER_ID=1
IS_BID="true"
EXPIRE_TIMESTAMP=1999999999999 # Far future
RESTRICTION=0 # None

echo "Seeding Pool with PTB..."
echo "Coin: $QUOTE_COIN"

# PTB Logic:
# 1. create_account() -> BalanceManager
# 2. deposit(manager, coin)
# 3. generate_proof(manager) -> TradeProof
# 4. place_limit_order(pool, manager, proof, ...)
# 5. share_object(manager)

sui client ptb \
  --move-call "${DEEPBOOK_PACKAGE}::balance_manager::new" \
  --assign manager \
  --move-call "${DEEPBOOK_PACKAGE}::balance_manager::deposit<${QUOTE_TYPE}>" manager.0 @${QUOTE_COIN} \
  --move-call "${DEEPBOOK_PACKAGE}::balance_manager::generate_proof_as_owner" manager.0 \
  --assign proof \
  --move-call "${DEEPBOOK_PACKAGE}::pool::place_limit_order<${BASE_TYPE},${QUOTE_TYPE}>" \
    @${POOL_ID} \
    manager.0 \
    proof.0 \
    ${CLIENT_ORDER_ID} \
    0 \
    0 \
    ${PRICE_TICKS} \
    ${QUANTITY_LOTS} \
    ${IS_BID} \
    false \
    ${EXPIRE_TIMESTAMP} \
    @0x6 \
  --move-call "0x2::transfer::public_share_object<${DEEPBOOK_PACKAGE}::balance_manager::BalanceManager>" manager.0 \
  --gas-budget 300000000

