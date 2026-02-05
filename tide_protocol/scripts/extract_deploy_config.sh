#!/bin/bash
# Usage: sui client publish --gas-budget 500000000 --json 2>/dev/null | ./scripts/extract_deploy_config.sh

# Read JSON from stdin
JSON=$(cat)

echo "=== Deployment Configuration ==="
echo ""

# Extract Package ID
PACKAGE_ID=$(echo "$JSON" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
echo "PACKAGE_ID: $PACKAGE_ID"

# Extract AdminCap
ADMIN_CAP=$(echo "$JSON" | jq -r '.objectChanges[] | select(.objectType != null and (.objectType | contains("::market::AdminCap"))) | .objectId')
echo "ADMIN_CAP_ID: $ADMIN_CAP"

# Extract TreasuryCaps
echo ""
echo "=== TreasuryCaps ==="
echo "$JSON" | jq -r '.objectChanges[] | select(.objectType != null and (.objectType | contains("TreasuryCap"))) | "\(.objectType): \(.objectId)"'

# Extract Markets (if any created)
echo ""
echo "=== Markets ==="
echo "$JSON" | jq -r '.objectChanges[] | select(.objectType != null and (.objectType | contains("::market::Market"))) | "\(.objectType): \(.objectId)"'

echo ""
echo "=== Frontend Config (tide_config.ts) ==="
USDC_CAP=$(echo "$JSON" | jq -r '.objectChanges[] | select(.objectType != null and (.objectType | contains("mock_usdc::MOCK_USDC"))) | .objectId')
BTC_CAP=$(echo "$JSON" | jq -r '.objectChanges[] | select(.objectType != null and (.objectType | contains("mock_btc::MOCK_BTC"))) | .objectId')

cat << EOF
export const TIDE_CONFIG = {
    NETWORK: 'testnet',
    PACKAGE_ID: '$PACKAGE_ID',
    ADMIN_CAP_ID: '$ADMIN_CAP',
    MARKET_ID: '0x0000000000000000000000000000000000000000000000000000000000000000', // Update after creating market
    
    COINS: {
        USDC: {
            TYPE: '${PACKAGE_ID}::mock_usdc::MOCK_USDC',
            TREASURY_CAP: '$USDC_CAP',
            DECIMALS: 6,
            SYMBOL: 'USDC'
        },
        BTC: {
            TYPE: '${PACKAGE_ID}::mock_btc::MOCK_BTC',
            TREASURY_CAP: '$BTC_CAP',
            DECIMALS: 8,
            SYMBOL: 'BTC'
        }
    }
};
EOF
