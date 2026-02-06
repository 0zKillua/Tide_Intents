#!/bin/bash
# Create DeepBook Pool for MOCK_BTC / MOCK_USDC
# 
# Prerequisites:
# 1. You need 500 DEEP tokens for pool creation fee
# 2. sui client must be configured for testnet
#
# Usage: ./create_deepbook_pool.sh

# DeepBook V3 Testnet addresses
DEEPBOOK_PACKAGE="0xbc331f09e5c737d45f074ad2d17c3038421b3b9018699e370d88d94938c53d28"
REGISTRY="0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1"

# Tide Protocol token types
TIDE_PACKAGE="0x6aacd5634c33eb11d6eceef58f7cafb6444cabb4ad8b7fbff15aa3d359c2bf4d"
MOCK_BTC_TYPE="${TIDE_PACKAGE}::mock_btc::MOCK_BTC"
MOCK_USDC_TYPE="${TIDE_PACKAGE}::mock_usdc::MOCK_USDC"

# DEEP token type (testnet)
DEEP_TYPE="0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP"

# Pool parameters
# tick_size: 1_000_000 = $1 precision (USDC 6 decimals)
# lot_size: 1000 = 0.00001 BTC min lot (BTC 8 decimals)  
# min_size: 10000 = 0.0001 BTC min order
TICK_SIZE=1000000
LOT_SIZE=1000
MIN_SIZE=10000

# Pool creation fee: 500 DEEP (6 decimals)
CREATION_FEE=500000000

echo "=== DeepBook Pool Creation ==="
echo "Base Asset: MOCK_BTC"
echo "Quote Asset: MOCK_USDC" 
echo "Tick Size: $TICK_SIZE (1 USDC)"
echo "Lot Size: $LOT_SIZE (0.00001 BTC)"
echo "Min Size: $MIN_SIZE (0.0001 BTC)"
echo "Creation Fee: 500 DEEP"
echo ""

# Check DEEP balance
echo "Checking DEEP token balance..."
sui client gas --json 2>/dev/null | head -20

echo ""
echo "To create the pool, run the following PTB command:"
echo ""
echo "sui client ptb \\"
echo "  --split-coins @<DEEP_COIN_ID> [${CREATION_FEE}] \\"
echo "  --assign creation_fee \\"
echo "  --move-call ${DEEPBOOK_PACKAGE}::pool::create_permissionless_pool<${MOCK_BTC_TYPE},${MOCK_USDC_TYPE}> \\"
echo "    @${REGISTRY} \\"
echo "    ${TICK_SIZE} \\"
echo "    ${LOT_SIZE} \\"
echo "    ${MIN_SIZE} \\"
echo "    creation_fee.0 \\"
echo "  --gas-budget 100000000"
echo ""
echo "Replace <DEEP_COIN_ID> with your DEEP token object ID"
echo ""
echo "To get your DEEP coins:"
echo "sui client objects --json | jq '.[] | select(.type | contains(\"deep::DEEP\"))'"
