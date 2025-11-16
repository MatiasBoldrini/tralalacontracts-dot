import { ApiPromise, WsProvider } from '@polkadot/api';

async function testAssetHub() {
  console.log('\n🏦 PROBANDO ASSET HUB EN PASEO\n');

  const endpoint = 'wss://paseo-asset-hub-rpc.polkadot.io';
  console.log(`📡 Endpoint: ${endpoint}\n`);

  try {
    const provider = new WsProvider(endpoint, 10000);
    const api = await ApiPromise.create({ provider });
    await api.isReady;

    console.log('✅ CONECTADO EXITOSAMENTE\n');

    const chain = await api.rpc.system.chain();
    const version = await api.rpc.system.version();

    console.log(`📋 Chain: ${chain}`);
    console.log(`📦 Runtime: ${version}\n`);

    // Verificar pallets críticos
    console.log('🔧 PALLETS DISPONIBLES:\n');

    const pallets = {
      'assets (tokens/NFTs)': !!api.tx.assets,
      'utility (batch)': !!api.tx.utility,
      'balances': !!api.tx.balances,
      'system': !!api.tx.system,
      'contracts (smart contracts)': !!api.tx.contracts,
    };

    Object.entries(pallets).forEach(([name, available]) => {
      console.log(`${available ? '✅' : '❌'} ${name}`);
    });

    if (api.tx.assets) {
      console.log('\n✅ Asset Hub soporta creación de tokens/assets!');
      console.log('\n📝 Métodos disponibles en pallet assets:');
      const methods = Object.keys(api.tx.assets);
      methods.slice(0, 15).forEach(m => console.log(`   - ${m}`));
      if (methods.length > 15) console.log(`   ... y ${methods.length - 15} más`);
    }

    await api.disconnect();
    console.log('\n✅ Asset Hub está listo para usar!\n');
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

testAssetHub();
