import { ApiPromise, WsProvider } from '@polkadot/api';

const endpoints = [
  {
    name: 'dwellir.com HTTP',
    url: 'https://paseo-rpc.dwellir.com'
  },
  {
    name: 'dwellir.com WebSocket',
    url: 'wss://paseo-rpc.dwellir.com'
  },
  {
    name: 'lightclient-io',
    url: 'wss://rpc.paseo.lightclient-io.io'
  },
  {
    name: 'luckyfriday.io',
    url: 'wss://paseo.luckyfriday.io'
  },
  {
    name: 'radiumblock',
    url: 'wss://paseo.public.curie.radiumblock.co'
  },
];

async function testConnection(endpoint) {
  try {
    console.log(`\n🔄 Testando: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);

    const provider = new WsProvider(endpoint.url, 2000); // 2 second timeout
    const api = await ApiPromise.create({ provider });

    const chain = await api.rpc.system.chain();
    const name = await api.rpc.system.name();
    const version = await api.runtimeVersion.specVersion;

    console.log(`✅ CONECTADO!`);
    console.log(`   Chain: ${chain}`);
    console.log(`   Name: ${name}`);
    console.log(`   Version: ${version}`);

    // Verificar si tiene el pallet de contratos
    try {
      const hasContracts = api.tx.contracts !== undefined;
      console.log(`   Has Contracts Pallet: ${hasContracts ? '✓ YES' : '✗ NO'}`);
    } catch (e) {
      console.log(`   Has Contracts Pallet: ✗ NO`);
    }

    await api.disconnect();
    return true;
  } catch (error) {
    console.log(`❌ FALLÓ: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('TESTING PASEO ENDPOINTS');
  console.log('='.repeat(60));

  for (const endpoint of endpoints) {
    await testConnection(endpoint);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

main().catch(console.error);
