const { execSync } = require('child_process');
const fs = require('fs');

try {
    const config = JSON.parse(fs.readFileSync('deployed_config.json', 'utf8'));

    // 1. Get current active address (Admin)
    const admin = execSync('sui client active-address', { encoding: 'utf8' }).trim();
    console.log(`Current Admin: ${admin}`);

    // 2. Create a fresh address
    const newAddress = execSync('sui client new-address ed25519', { encoding: 'utf8' }).trim().split(' ')[2];
    console.log(`New User: ${newAddress}`);

    // 3. Fund the new address for gas (Transfer from Admin)
    console.log("Funding new user...");
    execSync(`sui client pay-sui --recipients ${newAddress} --amounts 100000000 --gas-budget 10000000`, { stdio: 'inherit' });

    // 4. Switch to new user
    // Note: 'sui client switch' might be tricky in script if we want to restore later, 
    // but we can just pass --sender to the call command if supported? 
    // 'sui client call' doesn't easily support --sender without keystore config?
    // Actually, simpler: just execute the call. The CLI uses the active address.
    // Let's switch.
    console.log("Switching to new user...");
    execSync(`sui client switch --address ${newAddress}`, { stdio: 'inherit' });

    // 5. Try to mint USDC using the Shared TreasuryCap
    console.log("Attempting to mint USDC...");
    const cmd = `sui client call --package 0x2 --module coin --function mint_and_transfer --type-args ${config.MOCK_USDC_TYPE} --args ${config.USDC_CAP_ID} 500000 ${newAddress} --gas-budget 10000000`;
    execSync(cmd, { stdio: 'inherit' });

    console.log("SUCCESS: Minted from Shared Treasury Cap!");

    // Restore admin
    console.log("Restoring admin...");
    execSync(`sui client switch --address ${admin}`, { stdio: 'inherit' });

} catch (e) {
    console.error("TEST FAILED");
    // Try to restore admin if possible
    try {
        const admin = execSync('sui client active-address', { encoding: 'utf8' }).trim(); // This might be the new user
        // We probably can't easily recover the original without storing it appropriately
    } catch (err) {} 
    
    console.error(e.message);
}
