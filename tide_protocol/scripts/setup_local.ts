import { execSync } from 'child_process';
import fs from 'fs';

function runCommand(cmd: string) {
    try {
        return execSync(cmd, { encoding: 'utf-8' });
    } catch (e) {
        console.error(`Error running command: ${cmd}`, e);
        throw e;
    }
}

function main() {
    console.log("1. Publishing Package to Localnet...");
    // Publish and get JSON output
    const publishJson = runCommand('sui client publish --gas-budget 1000000000 --json');
    const publishResult = JSON.parse(publishJson);

    if (publishResult.effects.status.status !== 'success') {
        throw new Error('Publish failed');
    }

    const objectChanges = publishResult.objectChanges;
    
    // Extract Package ID
    const packageId = objectChanges.find((o: any) => o.type === 'published').packageId;
    console.log(`Package ID: ${packageId}`);

    // Extract AdminCap (Owned)
    const adminCap = objectChanges.find((o: any) => 
        o.objectType && o.objectType.includes('::market::AdminCap')
    );
    const adminCapId = adminCap.objectId;
    console.log(`AdminCap ID: ${adminCapId}`);

    // Extract TreasuryCaps (Shared)
    // Note: They are created as shared, so looking for 'created' objects with TreasuryCap type.
    const treasuryCaps = objectChanges.filter((o: any) => 
        o.objectType && o.objectType.includes('0x2::coin::TreasuryCap')
    );
    
    // We need to distinguish them by generic type
    const usdcCap = treasuryCaps.find((o: any) => o.objectType.includes('MOCK_USDC'));
    const btcCap = treasuryCaps.find((o: any) => o.objectType.includes('MOCK_BTC'));
    const suiCap = treasuryCaps.find((o: any) => o.objectType.includes('MOCK_SUI'));

    console.log(`USDC Cap: ${usdcCap.objectId}`);
    console.log(`BTC Cap: ${btcCap.objectId}`);
    console.log(`SUI Cap: ${suiCap.objectId}`);

    // Extract Active Address
    const activeAddress = runCommand('sui client active-address').trim();
    console.log(`Active Address: ${activeAddress}`);

    // 2. Mint Tokens
    console.log("\n2. Minting Tokens...");
    // Mint 10000 USDC
    runCommand(`sui client call --package 0x2 --module coin --function mint_and_transfer --type-args ${packageId}::mock_usdc::MOCK_USDC --args ${usdcCap.objectId} 10000000000 ${activeAddress} --gas-budget 100000000`);
    // Mint 10 BTC
    runCommand(`sui client call --package 0x2 --module coin --function mint_and_transfer --type-args ${packageId}::mock_btc::MOCK_BTC --args ${btcCap.objectId} 1000000000 ${activeAddress} --gas-budget 100000000`);
    
    // 3. Create Markets
    console.log("\n3. Creating Markets...");
    // USDC-BTC Market
    runCommand(`sui client call --package ${packageId} --module market --function create_market --type-args ${packageId}::mock_usdc::MOCK_USDC ${packageId}::mock_btc::MOCK_BTC --args ${adminCapId} --gas-budget 100000000`);
    
    // USDC-SUI Market
    runCommand(`sui client call --package ${packageId} --module market --function create_market --type-args ${packageId}::mock_usdc::MOCK_USDC ${packageId}::mock_sui::MOCK_SUI --args ${adminCapId} --gas-budget 100000000`);

    console.log("\nSetup Complete!");
    
    // Write config for E2E script
    const config = {
        PACKAGE_ID: packageId,
        ADMIN_CAP_ID: adminCapId,
        USDC_CAP_ID: usdcCap.objectId,
        BTC_CAP_ID: btcCap.objectId,
        SUI_CAP_ID: suiCap.objectId,
        MOCK_USDC_TYPE: `${packageId}::mock_usdc::MOCK_USDC`,
        MOCK_BTC_TYPE: `${packageId}::mock_btc::MOCK_BTC`,
        MOCK_SUI_TYPE: `${packageId}::mock_sui::MOCK_SUI`
    };
    
    fs.writeFileSync('deployed_config.json', JSON.stringify(config, null, 2));
    console.log("Config saved to deployed_config.json");
}

main();
