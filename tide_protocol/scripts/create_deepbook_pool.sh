#!/bin/bash
# Create DeepBook Pool for SUI / MOCK_USDC
# 
# Usage: ./create_deepbook_pool.sh <DEEP_COIN_ID>

DEEPBOOK_PACKAGE="0xbc331f09e5c737d45f074ad2d17c3038421b3b9018699e370d88d94938c53d28"
REGISTRY="0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1"

# Base: SUI (9 decimals)
# Quote: MOCK_USDC (6 decimals)
BASE_TYPE="0x2::sui::SUI"
QUOTE_TYPE="0xef553a6b8a00ac9c00d7983a24e4ca9a9748dcad02f0ab31bb8c502583ab1d0a::mock_usdc::MOCK_USDC"

# Pool parameters
# tick_size: 100 = 0.0001 USDC
# lot_size: 100000000 = 0.1 SUI
# min_size: 100000000 = 0.1 SUI
TICK_SIZE=100
LOT_SIZE=100000000
MIN_SIZE=100000000

# Pool creation fee: 500 DEEP
CREATION_FEE=500000000

if [ -z "$1" ]; then
    echo "Usage: ./create_deepbook_pool.sh <DEEP_COIN_ID>"
    echo "Find your DEEP coin with: sui client objects | grep DEEP"
    exit 1
fi

DEEP_COIN=$1

echo "Creating pool SUI/MOCK_USDC..."
echo "Deep Coin: $DEEP_COIN"

sui client ptb \
  --split-coins @$DEEP_COIN "[${CREATION_FEE}]" \
  --assign creation_fee \
  --move-call "${DEEPBOOK_PACKAGE}::pool::create_permissionless_pool<${BASE_TYPE},${QUOTE_TYPE}>" \
    @${REGISTRY} \
    ${TICK_SIZE} \
    ${LOT_SIZE} \
    ${MIN_SIZE} \
    creation_fee.0 \
  --gas-budget 300000000
