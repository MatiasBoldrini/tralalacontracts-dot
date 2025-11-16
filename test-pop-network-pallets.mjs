import { ApiPromise, WsProvider } from '@polkadot/api';

const POP_NETWORK_ENDPOINTS = [
  'wss://rpc1.paseo.popnetwork.xyz',
  'wss://rpc2.paseo.popnetwork.xyz',
  'wss://rpc3.paseo.popnetwork.xyz',
];

async function testPopNetwork() {
  console.log('\n🔍 DIAGNOSTICANDO POP NETWORK EN PASEO\n');

  for (const endpoint of POP_NETWORK_ENDPOINTS) {
    console.log(`\n📡 Probando: ${endpoint}`);
    console.log('─'.repeat(60));

    try {
      const provider = new WsProvider(endpoint, 5000);
      const api = await ApiPromise.create({ provider });

      await api.isReady;

      console.log('✅ CONECTADO EXITOSAMENTE\n');

      // Información básica
      const chain = await api.rpc.system.chain();
      const version = await api.rpc.system.version();

      console.log(`📋 Chain: ${chain}`);
      console.log(`📦 Runtime: ${version}\n`);

      // Verificar pallets disponibles
      console.log('🔧 PALLETS DISPONIBLES:\n');

      const hasPallets = {
        contracts: !!api.tx.contracts,
        evm: !!api.tx.evm,
        ethereum: !!api.tx.ethereum,
        balances: !!api.tx.balances,
        assets: !!api.tx.assets,
      };

      Object.entries(hasPallets).forEach(([pallet, available]) => {
        const icon = available ? '✅' : '❌';
        console.log(`${icon} ${pallet}: ${available ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
      });

      // Si tiene contracts, mostrar métodos
      if (api.tx.contracts) {
        console.log('\n📝 Métodos del pallet CONTRACTS:');
        const methods = Object.keys(api.tx.contracts);
        methods.slice(0, 10).forEach(method => {
          console.log(`   - ${method}`);
        });
        if (methods.length > 10) {
          console.log(`   ... y ${methods.length - 10} más`);
        }
      }

      // Si tiene evm, mostrar métodos
      if (api.tx.evm) {
        console.log('\n📝 Métodos del pallet EVM:');
        const methods = Object.keys(api.tx.evm);
        methods.forEach(method => {
          console.log(`   - ${method}`);
        });
      }

      // Si tiene ethereum, mostrar métodos
      if (api.tx.ethereum) {
        console.log('\n📝 Métodos del pallet ETHEREUM:');
        const methods = Object.keys(api.tx.ethereum);
        methods.forEach(method => {
          console.log(`   - ${method}`);
        });
      }

      await api.disconnect();
      console.log('\n✅ Endpoint funciona perfectamente!\n');

      // Solo probar el primer endpoint que funcione
      break;

    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
}

testPopNetwork()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
