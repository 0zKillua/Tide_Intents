const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_CONFIG_PATH = path.join(__dirname, '..', '..', 'frontend', 'src', 'tide_config.ts');
const DEPLOYED_CONFIG_PATH = path.join(__dirname, '..', 'deployed_config.json');
const GAS_BUDGET = 500000000; // 0.5 SUI

// Token Package (Previously Deployed)
// If you redeploy tide_tokens, update this!
const TIDE_TOKENS_PACKAGE_ID = "0xef553a6b8a00ac9c00d7983a24e4ca9a9748dcad02f0ab31bb8c502583ab1d0a"; 
const MOCK_USDC_TYPE = `${TIDE_TOKENS_PACKAGE_ID}::mock_usdc::MOCK_USDC`;

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
    
    // We only publish tide_protocol here, assuming tide_tokens is already set in Move.toml
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

    // PauseCap
    const pauseCap = objectChanges.find(o => 
        o.objectType && o.objectType.includes('::market::PauseCap')
    );
    log(`  ⏸️  PauseCap ID: ${pauseCap?.objectId}`, 'green');
    
    // Registry (ProtocolInfo)
    const registry = objectChanges.find(o => 
        o.objectType && o.objectType.includes('::tide::ProtocolInfo')
    );
    log(`  📋 Registry ID: ${registry?.objectId}`, 'green');

    // Step 4: Create Market (MOCK_USDC / SUI)
    logStep('4/6', 'Creating MOCK_USDC / SUI Market...');
    
    let marketId = '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    try {
        const marketResult = runCommandJSON(`sui client call \
            --package ${packageId} \
            --module market \
            --function create_market \
            --type-args ${MOCK_USDC_TYPE} 0x2::sui::SUI \
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
        PAUSE_CAP_ID: pauseCap?.objectId,
        REGISTRY_ID: registry?.objectId,
        
        // Tokens
        MOCK_USDC_TYPE: MOCK_USDC_TYPE,
        MOCK_SUI_TYPE: "0x2::sui::SUI",
        
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
    PACKAGE_ID: "${packageId}",
    MARKET_ID: "${marketId}",
    PAUSE_CAP_ID: "${pauseCap?.objectId}",
    ADMIN_CAP_ID: "${adminCapId}",
    REGISTRY_ID: "${registry?.objectId}",
    
    // Tokens
    COINS: {
        USDC: {
            TYPE: "${MOCK_USDC_TYPE}",
            DECIMALS: 6,
            ICON_URL: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
        },
        SUI: {
            TYPE: "0x2::sui::SUI",
            DECIMALS: 9, 
            ICON_URL: "https://cryptologos.cc/logos/sui-sui-logo.png"
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
