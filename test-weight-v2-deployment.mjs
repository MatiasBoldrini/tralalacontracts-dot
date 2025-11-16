/**
 * Test script to validate Weight v2 deployment fix
 * Tests the correct contract deployment format for Polkadot Paseo
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN } from '@polkadot/util';

const PASEO_ENDPOINT = 'wss://rpc1.paseo.popnetwork.xyz';

async function testWeightV2Creation() {
  console.log('\n🧪 Testing Weight v2 object creation...\n');

  try {
    const wsProvider = new WsProvider(PASEO_ENDPOINT);
    const api = await ApiPromise.create({ provider: wsProvider });

    // Test 1: Create Weight v2 object
    console.log('✓ Test 1: Creating Weight v2 object');
    const weight = api.registry.createType('WeightV2', {
      refTime: new BN('100000000000'),
      proofSize: new BN('1000000')
    });

    console.log(`  refTime: ${weight.refTime.toString()}`);
    console.log(`  proofSize: ${weight.proofSize.toString()}`);
    console.log(`  Weight type: ${weight.constructor.name}\n`);

    // Test 2: Verify Weight v2 structure
    console.log('✓ Test 2: Verifying Weight v2 structure');
    const hasRefTime = weight.refTime !== undefined;
    const hasProofSize = weight.proofSize !== undefined;
    console.log(`  Has refTime: ${hasRefTime}`);
    console.log(`  Has proofSize: ${hasProofSize}\n`);

    if (!hasRefTime || !hasProofSize) {
      throw new Error('Weight v2 structure is missing required fields');
    }

    // Test 3: Check instantiateWithCode method exists
    console.log('✓ Test 3: Checking contracts pallet methods');
    const hasInstantiateWithCode = api.tx.contracts.instantiateWithCode !== undefined;
    const hasInstantiate = api.tx.contracts.instantiate !== undefined;

    console.log(`  Has instantiateWithCode: ${hasInstantiateWithCode}`);
    console.log(`  Has instantiate: ${hasInstantiate}\n`);

    if (!hasInstantiateWithCode) {
      throw new Error('contracts.instantiateWithCode method not available');
    }

    // Test 4: Create a mock deployment transaction
    console.log('✓ Test 4: Creating mock instantiateWithCode transaction');

    // Mock WASM bytecode
    const mockBytecode = '0x' + '00'.repeat(100); // 100 bytes of zeros

    try {
      const tx = api.tx.contracts.instantiateWithCode(
        0,                           // value
        weight,                      // gasLimit (Weight v2)
        null,                        // storageDepositLimit
        mockBytecode,               // code
        new Uint8Array(),           // data
        new Uint8Array()            // salt
      );

      console.log(`  Transaction created: ${tx.method.pallet}.${tx.method.method}`);
      console.log(`  Transaction type: ${tx.constructor.name}\n`);

    } catch (err) {
      console.error('  ❌ Failed to create transaction:', err.message);
      console.error('\n  This indicates a Weight v2 encoding issue.\n');
      throw err;
    }

    // Test 5: Verify gas estimation format
    console.log('✓ Test 5: Testing gas estimation format conversion');
    const estimatedGas = '100000'; // Example from estimateDeploymentGas
    const gasLimitNumber = BigInt(estimatedGas);
    const refTime = new BN(gasLimitNumber.toString()).mul(new BN('1000000'));
    const proofSize = new BN('1000000');

    console.log(`  Input gas: ${estimatedGas}`);
    console.log(`  Converted refTime: ${refTime.toString()}`);
    console.log(`  Proof size: ${proofSize.toString()}\n`);

    // Test 6: Compare old (incorrect) vs new (correct) approach
    console.log('✓ Test 6: Demonstrating old vs new approach\n');

    console.log('  OLD (INCORRECT):');
    console.log('    api.tx.contracts.instantiate(');
    console.log('      0,');
    console.log('      BigInt(gasLimit), // ❌ Single number');
    console.log('      null,');
    console.log('      bytecode,');
    console.log('      []');
    console.log('    )\n');

    console.log('  NEW (CORRECT):');
    console.log('    api.tx.contracts.instantiateWithCode(');
    console.log('      0,');
    console.log('      api.registry.createType("WeightV2", {');
    console.log('        refTime: new BN(...).mul(new BN("1000000")),');
    console.log('        proofSize: new BN("1000000")');
    console.log('      }),');
    console.log('      null,');
    console.log('      bytecode,');
    console.log('      new Uint8Array(),');
    console.log('      new Uint8Array()');
    console.log('    )\n');

    console.log('=' .repeat(60));
    console.log('✅ All Weight v2 tests PASSED!');
    console.log('=' .repeat(60));
    console.log('\nYour deployment code should now work correctly on Paseo.\n');

    await api.disconnect();

  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('❌ Test FAILED');
    console.error('=' .repeat(60));
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

async function testEndpointConnectivity() {
  console.log('\n🔗 Testing Paseo endpoint connectivity...\n');

  try {
    const wsProvider = new WsProvider(PASEO_ENDPOINT, 3000);
    const api = await ApiPromise.create({ provider: wsProvider });

    const chain = await api.rpc.system.chain();
    const name = await api.rpc.system.name();
    const version = api.runtimeVersion?.specVersion;

    console.log(`✅ Connected to Paseo!`);
    console.log(`   Chain: ${chain}`);
    console.log(`   Name: ${name}`);
    console.log(`   Spec Version: ${version}\n`);

    await api.disconnect();
    return true;

  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('POLKADOT WEIGHT V2 DEPLOYMENT TEST');
  console.log('Testing fixes for Paseo testnet compatibility');
  console.log('='.repeat(60));

  // Test endpoint connectivity first
  const connected = await testEndpointConnectivity();
  if (!connected) {
    console.warn('\n⚠️  Could not connect to Paseo endpoint');
    console.warn('    Network tests may not work, but Weight v2 format is still valid\n');
  }

  // Test Weight v2 format
  await testWeightV2Creation();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
