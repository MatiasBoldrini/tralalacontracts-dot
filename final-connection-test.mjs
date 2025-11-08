import { ApiPromise, WsProvider } from '@polkadot/api';

console.log('\n' + '='.repeat(70));
console.log('FINAL CONNECTION TEST - SHIBUYA');
console.log('='.repeat(70));

const wsUrl = 'wss://rpc.shibuya.astar.network';
console.log(`\n🔄 Connecting to: ${wsUrl}`);

try {
  const provider = new WsProvider(wsUrl, 5000);
  const api = await ApiPromise.create({ provider });

  console.log('\n✅ CONNECTION SUCCESSFUL');

  const chain = await api.rpc.system.chain();
  const name = await api.rpc.system.name();
  const version = await api.runtimeVersion.specVersion;
  const hasContracts = api.tx.contracts !== undefined;

  console.log(`   Chain: ${chain}`);
  console.log(`   Name: ${name}`);
  console.log(`   Runtime Version: ${version}`);
  console.log(`   Has Contracts Pallet: ${hasContracts ? '✅ YES' : '❌ NO'}`);

  if (hasContracts) {
    console.log('\n✅ READY FOR DEPLOYMENT!');
    console.log('   Contract functions available:');
    console.log('   - instantiate()');
    console.log('   - call()');
    console.log('   - putCode()');
  } else {
    throw new Error('Contracts pallet NOT available!');
  }

  await api.disconnect();

  console.log('\n' + '='.repeat(70));
  console.log('✅ ALL CHECKS PASSED - SHIBUYA IS READY');
  console.log('='.repeat(70) + '\n');

  process.exit(0);
} catch (error) {
  console.log(`\n❌ ERROR: ${error.message}\n`);
  process.exit(1);
}
