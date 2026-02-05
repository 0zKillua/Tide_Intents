#!/usr/bin/env node
/**
 * Tide Protocol - Automated Deploy & Configure Script
 * 
 * Usage:
 *   node scripts/deploy.js [network]
 * 
 * Examples:
 *   node scripts/deploy.js testnet
 *   node scripts/deploy.js local
 *   node scripts/deploy.js devnet
 * 
 * This script will:
 * 1. Publish the package to the specified network
 * 2. Extract all created objects (Package, AdminCap, TreasuryCaps, etc.)
 * 3. Optionally create a Market
 * 4. Update frontend/src/tide_config.ts automatically
 * 5. Save deployment info to deployed_config.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_CONFIG_PATH = path.join(__dirname, '..', '..', 'frontend', 'src', 'tide_config.ts');
const DEPLOYED_CONFIG_PATH = path.join(__dirname, '..', 'deployed_config.json');
const GAS_BUDGET = 500000000; // 0.5 SUI

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    console.log(`\n${colors.cyan}[${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

function runCommand(cmd, options = {}) {
    try {
        const result = execSync(cmd, { 
            encoding: 'utf-8', 
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options 
        });
        return options.silent ? result : null;
    } catch (e) {
        if (options.ignoreError) return null;
        console.error(`${colors.red}Error running command: ${cmd}${colors.reset}`);
        if (e.stderr) console.error(e.stderr);
        throw e;
    }
}

function runCommandJSON(cmd) {
    try {
        const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
        // Filter out warning lines that start with [warning]
        const lines = output.split('\n').filter(line => !line.startsWith('[warning]'));
        return JSON.parse(lines.join('\n'));
    } catch (e) {
        console.error(`${colors.red}Error running command: ${cmd}${colors.reset}`);
        if (e.stderr) console.error(e.stderr.toString());
        throw e;
    }
}

async function main() {
    const network = process.argv[2] || 'testnet';
    
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`  Tide Protocol - Automated Deployment`, 'bright');
    log(`  Network: ${network}`, 'yellow');
    log(`${'='.repeat(60)}\n`, 'cyan');

    // Step 1: Check active environment
    logStep('1/6', 'Checking Sui CLI configuration...');
    const activeEnv = runCommand('sui client active-env', { silent: true }).trim().split('\n').pop();
    const activeAddress = runCommand('sui client active-address', { silent: true }).trim().split('\n').pop();
    
    log(`  Active Environment: ${activeEnv}`, 'blue');
    log(`  Active Address: ${activeAddress}`, 'blue');
    
    if (activeEnv !== network) {
        log(`\n  ⚠️  Warning: Active env (${activeEnv}) doesn't match target (${network})`, 'yellow');
        log(`  Switching to ${network}...`, 'yellow');
        runCommand(`sui client switch --env ${network}`, { silent: true });
    }

    // Step 2: Publish Package
    logStep('2/6', 'Publishing package...');
    log('  This may take a minute...', 'yellow');
    
    const publishResult = runCommandJSON(`sui client publish --gas-budget ${GAS_BUDGET} --json`);
    
    if (publishResult.effects?.status?.status !== 'success') {
        log('  ❌ Publish failed!', 'red');
        console.error(publishResult.effects?.status);
        process.exit(1);
    }
    
    log('  ✅ Package published successfully!', 'green');

    // Step 3: Extract Objects
    logStep('3/6', 'Extracting deployed objects...');
    
    const objectChanges = publishResult.objectChanges || [];
    
    // Package ID
    const published = objectChanges.find(o => o.type === 'published');
    const packageId = published?.packageId;
    log(`  📦 Package ID: ${packageId}`, 'green');
    
    // AdminCap
    const adminCap = objectChanges.find(o => 
        o.objectType && o.objectType.includes('::market::AdminCap')
    );
    const adminCapId = adminCap?.objectId;
    log(`  🔑 AdminCap ID: ${adminCapId}`, 'green');
    
    // TreasuryCaps
    const treasuryCaps = objectChanges.filter(o => 
        o.objectType && o.objectType.includes('TreasuryCap')
    );
    
    const usdcCap = treasuryCaps.find(o => o.objectType.includes('mock_usdc'));
    const btcCap = treasuryCaps.find(o => o.objectType.includes('mock_btc'));
    const suiCap = treasuryCaps.find(o => o.objectType.includes('mock_sui'));
    
    log(`  💵 USDC TreasuryCap: ${usdcCap?.objectId}`, 'green');
    log(`  ₿  BTC TreasuryCap: ${btcCap?.objectId}`, 'green');
    if (suiCap) log(`  💧 SUI TreasuryCap: ${suiCap?.objectId}`, 'green');

    // Step 4: Create Market (Optional)
    logStep('4/6', 'Creating USDC/BTC Market...');
    
    let marketId = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    try {
        const marketResult = runCommandJSON(`sui client call \
            --package ${packageId} \
            --module market \
            --function create_market \
            --type-args ${packageId}::mock_usdc::MOCK_USDC ${packageId}::mock_btc::MOCK_BTC \
            --args ${adminCapId} \
            --gas-budget 100000000 \
            --json`);
        
        if (marketResult.effects?.status?.status === 'success') {
            const marketObj = marketResult.objectChanges?.find(o => 
                o.objectType && o.objectType.includes('::market::Market')
            );
            marketId = marketObj?.objectId || marketId;
            log(`  ✅ Market created: ${marketId}`, 'green');
        }
    } catch (e) {
        log(`  ⚠️  Market creation skipped (may already exist or error)`, 'yellow');
    }

    // Step 5: Save Configuration
    logStep('5/6', 'Saving configuration files...');
    
    const deployedConfig = {
        NETWORK: network,
        PACKAGE_ID: packageId,
        ADMIN_CAP_ID: adminCapId,
        MARKET_ID: marketId,
        USDC_CAP_ID: usdcCap?.objectId,
        BTC_CAP_ID: btcCap?.objectId,
        SUI_CAP_ID: suiCap?.objectId,
        MOCK_USDC_TYPE: `${packageId}::mock_usdc::MOCK_USDC`,
        MOCK_BTC_TYPE: `${packageId}::mock_btc::MOCK_BTC`,
        MOCK_SUI_TYPE: `${packageId}::mock_sui::MOCK_SUI`,
        DEPLOYED_AT: new Date().toISOString(),
        DEPLOY_TX: publishResult.digest,
    };
    
    fs.writeFileSync(DEPLOYED_CONFIG_PATH, JSON.stringify(deployedConfig, null, 2));
    log(`  📄 Saved: ${DEPLOYED_CONFIG_PATH}`, 'blue');

    // Step 6: Update Frontend Config
    logStep('6/6', 'Updating frontend configuration...');
    
    const frontendConfig = `// Auto-generated by deploy.js - ${new Date().toISOString()}
// Network: ${network}
// TX: ${publishResult.digest}

export const TIDE_CONFIG = {
    NETWORK: '${network}',
    PACKAGE_ID: '${packageId}',
    ADMIN_CAP_ID: '${adminCapId}',
    MARKET_ID: '${marketId}',
    
    COINS: {
        USDC: {
            TYPE: '${packageId}::mock_usdc::MOCK_USDC',
            TREASURY_CAP: '${usdcCap?.objectId}',
            DECIMALS: 6,
            SYMBOL: 'USDC'
        },
        BTC: {
            TYPE: '${packageId}::mock_btc::MOCK_BTC',
            TREASURY_CAP: '${btcCap?.objectId}',
            DECIMALS: 8,
            SYMBOL: 'BTC'
        }
    }
};
`;
    
    fs.writeFileSync(FRONTEND_CONFIG_PATH, frontendConfig);
    log(`  📄 Updated: ${FRONTEND_CONFIG_PATH}`, 'blue');

    // Summary
    log(`\n${'='.repeat(60)}`, 'green');
    log(`  ✅ Deployment Complete!`, 'bright');
    log(`${'='.repeat(60)}`, 'green');
    log(`\n  Network:     ${network}`, 'cyan');
    log(`  Package:     ${packageId}`, 'cyan');
    log(`  Market:      ${marketId}`, 'cyan');
    log(`  TX Digest:   ${publishResult.digest}`, 'cyan');
    log(`\n  Frontend config updated automatically.`);
    log(`  Just restart your dev server: ${colors.yellow}cd frontend && npm run dev${colors.reset}\n`);
}

main().catch(e => {
    console.error(`${colors.red}Deployment failed:${colors.reset}`, e.message);
    process.exit(1);
});
