const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(cmd) {
    try {
        console.log(`> ${cmd}`);
        return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    } catch (e) {
        console.error(`Error running command: ${cmd}`);
        console.error(e.stderr || e.message);
        throw e;
    }
}

function main() {
    console.log("=== SETUP TESTNET ===");
    console.log("1. Publishing Package to Testnet...");
    
    // Check active address
    const activeAddress = runCommand('sui client active-address').trim();
    console.log(`Active Address: ${activeAddress}`);

    // Publish and get JSON output
    // Note: --gas-budget 500000000 (0.5 SUI) should be enough
    const publishJson = runCommand('sui client publish --gas-budget 500000000 --json');
    const publishResult = JSON.parse(publishJson);

    if (publishResult.effects.status.status !== 'success') {
        throw new Error('Publish failed');
    }

    const objectChanges = publishResult.objectChanges;
    
    // Extract Package ID
    const packageId = objectChanges.find(o => o.type === 'published').packageId;
    console.log(`Package ID: ${packageId}`);

    // Extract AdminCap (Owned)
    const adminCap = objectChanges.find(o => 
        o.objectType && o.objectType.includes('::market::AdminCap')
    );
    const adminCapId = adminCap.objectId;
    console.log(`AdminCap ID: ${adminCapId}`);

    // Extract TreasuryCaps (Shared)
    const treasuryCaps = objectChanges.filter(o => 
        o.objectType && o.objectType.includes('0x2::coin::TreasuryCap')
    );
    
    const usdcCap = treasuryCaps.find(o => o.objectType.includes('MOCK_USDC'));
    const btcCap = treasuryCaps.find(o => o.objectType.includes('MOCK_BTC'));
    const suiCap = treasuryCaps.find(o => o.objectType.includes('MOCK_SUI'));

    console.log(`USDC Cap: ${usdcCap.objectId}`);
    console.log(`BTC Cap: ${btcCap.objectId}`);
    console.log(`SUI Cap: ${suiCap.objectId}`);

    // 2. Mint Tokens (Initial Supply to Admin if needed, or just leave rely on Faucet)
    // We don't strictly need to mint to admin, but let's do small amount to verify
    console.log("\n2. Minting Initial Tokens...");
    // Mint 100 USDC
    runCommand(`sui client call --package 0x2 --module coin --function mint_and_transfer --type-args ${packageId}::mock_usdc::MOCK_USDC --args ${usdcCap.objectId} 100000000 ${activeAddress} --gas-budget 100000000`);
    
    // 3. Create Markets
    console.log("\n3. Creating Markets...");
    // USDC-BTC Market
    runCommand(`sui client call --package ${packageId} --module market --function create_market --type-args ${packageId}::mock_usdc::MOCK_USDC ${packageId}::mock_btc::MOCK_BTC --args ${adminCapId} --gas-budget 100000000`);
    
    // USDC-SUI Market
    runCommand(`sui client call --package ${packageId} --module market --function create_market --type-args ${packageId}::mock_usdc::MOCK_USDC ${packageId}::mock_sui::MOCK_SUI --args ${adminCapId} --gas-budget 100000000`);

    console.log("\nSetup Complete!");
    
    // Write config
    const config = {
        NETWORK: 'testnet',
        PACKAGE_ID: packageId,
        ADMIN_CAP_ID: adminCapId,
        USDC_CAP_ID: usdcCap.objectId,
        BTC_CAP_ID: btcCap.objectId,
        SUI_CAP_ID: suiCap.objectId,
        MOCK_USDC_TYPE: `${packageId}::mock_usdc::MOCK_USDC`,
        MOCK_BTC_TYPE: `${packageId}::mock_btc::MOCK_BTC`,
        MOCK_SUI_TYPE: `${packageId}::mock_sui::MOCK_SUI`
    };
    
    fs.writeFileSync('testnet_config.json', JSON.stringify(config, null, 2));
    console.log("Config saved to testnet_config.json");
}

main();
