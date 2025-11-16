import { ApiPromise, WsProvider } from '@polkadot/api';

const endpoints = [
  'wss://rococo-contracts-rpc.polkadot.io',
  'wss://contracts-rococo.api.onfinality.io/public-ws',
];

async function testRococoEndpoint(wsUrl) {
  try {
    console.log(`\n🔍 Probando: ${wsUrl}`);
    
    const provider = new WsProvider(wsUrl, 10000);
    const api = await ApiPromise.create({ provider });

    const chain = await api.rpc.system.chain();
    const name = await api.rpc.system.name();
    console.log(`✅ Conectado a: ${chain} (${name})`);

    // Verificar pallets disponibles
    console.log('\n📋 Pallets disponibles:');
    
    const hasContracts = api.tx.contracts !== undefined;
    const hasEvm = api.tx.evm !== undefined;
    const hasUtility = api.tx.utility !== undefined;
    
    console.log(`   contracts: ${hasContracts ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   evm: ${hasEvm ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   utility: ${hasUtility ? '✅ SÍ' : '❌ NO'}`);

    if (hasContracts) {
      console.log('\n   📦 Métodos del pallet contracts:');
      try {
        if (api.tx.contracts.instantiate) console.log('      - instantiate ✅');
        if (api.tx.contracts.call) console.log('      - call ✅');
        if (api.tx.contracts.putCode) console.log('      - putCode ✅');
      } catch (e) {
        console.log(`      Error: ${e.message}`);
      }
    }

    if (hasEvm) {
      console.log('\n   📦 Métodos del pallet EVM:');
      try {
        if (api.tx.evm.call) console.log('      - call ✅');
        if (api.tx.evm.create) console.log('      - create ✅');
        if (api.tx.evm.create2) console.log('      - create2 ✅');
      } catch (e) {
        console.log(`      Error: ${e.message}`);
      }
    }

    // Listar todos los pallets disponibles
    console.log('\n📚 Todos los pallets tx disponibles:');
    const txPallets = Object.keys(api.tx).sort();
    txPallets.forEach(pallet => {
      console.log(`   - ${pallet}`);
    });

    await api.disconnect();
    return { success: true, hasContracts, hasEvm, wsUrl };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message, wsUrl };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('TESTING ROCOCO CONTRACTS ENDPOINTS - CONTRACTS SUPPORT');
  console.log('='.repeat(70));

  const results = [];
  for (const endpoint of endpoints) {
    const result = await testRococoEndpoint(endpoint);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN:');
  console.log('='.repeat(70));
  
  const working = results.filter(r => r.success);
  const withContracts = results.filter(r => r.success && r.hasContracts);
  const withEvm = results.filter(r => r.success && r.hasEvm);

  console.log(`\n✅ Endpoints funcionando: ${working.length}/${endpoints.length}`);
  console.log(`📦 Con pallet contracts: ${withContracts.length}`);
  console.log(`🔷 Con pallet EVM: ${withEvm.length}`);

  if (withContracts.length > 0) {
    console.log('\n🎉 ¡Encontrados endpoints con soporte de contratos!');
    withContracts.forEach(r => console.log(`   - ${r.wsUrl}`));
  } else if (withEvm.length > 0) {
    console.log('\n🎉 ¡Encontrados endpoints con soporte EVM!');
    withEvm.forEach(r => console.log(`   - ${r.wsUrl}`));
  } else {
    console.log('\n⚠️  No se encontraron endpoints con soporte de contratos o EVM');
    console.log('   Rococo Contracts debería soportar contratos inteligentes nativos');
  }

  process.exit(0);
}

main().catch(console.error);

