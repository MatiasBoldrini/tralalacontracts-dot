import { ApiPromise, WsProvider } from '@polkadot/api';

const config = {
  name: 'Shibuya Testnet (Astar)',
  wsUrl: 'wss://shibuya-rpc.dwellir.com',
};

async function testShibuyaConnection() {
  console.log('\n' + '='.repeat(70));
  console.log('TESTING SHIBUYA CONNECTION');
  console.log('='.repeat(70));

  console.log(`\n🔄 Conectando a ${config.name}...`);
  console.log(`   WebSocket: ${config.wsUrl}`);

  try {
    const provider = new WsProvider(config.wsUrl, 5000);
    const api = await ApiPromise.create({ provider });

    console.log('\n✅ CONEXIÓN EXITOSA');

    // Get chain info
    const chain = await api.rpc.system.chain();
    console.log(`   Chain: ${chain}`);

    const name = await api.rpc.system.name();
    console.log(`   Name: ${name}`);

    const version = await api.runtimeVersion.specVersion;
    console.log(`   Runtime Version: ${version}`);

    // Check for contracts pallet
    const hasContracts = api.tx.contracts !== undefined;
    console.log(`   Has Contracts Pallet: ${hasContracts ? '✅ YES' : '❌ NO'}`);

    if (hasContracts) {
      console.log('\n✅ CONTRACTS PALLET DISPONIBLE!');
      console.log('   Funciones disponibles:');

      // Try to access contract methods
      try {
        if (api.tx.contracts.instantiate) {
          console.log('     - instantiate() ✓');
        }
        if (api.tx.contracts.call) {
          console.log('     - call() ✓');
        }
        if (api.tx.contracts.putCode) {
          console.log('     - putCode() ✓');
        }
      } catch (e) {
        console.log(`     Error listing methods: ${e.message}`);
      }
    } else {
      throw new Error('Contracts pallet is NOT available on this network!');
    }

    // Get account balance for demo
    try {
      const accountId = '1REAJ39FiGj7Dn3gyVF7j3XkXkqe7aKQCnqYhUMawV4cd9X';
      const account = await api.query.system.account(accountId);
      const balance = account.data.free;
      console.log(`\n📊 Sample Account Balance: ${balance.toHuman()}`);
    } catch (e) {
      console.log(`\n(Balance check skipped: ${e.message})`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED - SHIBUYA IS READY FOR DEPLOYMENT');
    console.log('='.repeat(70));

    await api.disconnect();
    return true;
  } catch (error) {
    console.log(`\n❌ CONNECTION FAILED`);
    console.log(`   Error: ${error.message}`);
    console.log('\n' + '='.repeat(70));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(70));
    return false;
  }
}

testShibuyaConnection().then(success => {
  process.exit(success ? 0 : 1);
});
