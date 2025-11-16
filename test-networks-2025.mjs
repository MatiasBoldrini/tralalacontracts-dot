import { ApiPromise, WsProvider } from '@polkadot/api';

const networks = [
  {
    name: 'Westend Asset Hub (Official)',
    url: 'wss://westend-asset-hub-rpc.polkadot.io',
    type: 'Polkadot Testnet'
  },
  {
    name: 'Westend Asset Hub (Dwellir)',
    url: 'wss://asset-hub-westend-rpc.n.dwellir.com',
    type: 'Polkadot Testnet'
  },
  {
    name: 'Shibuya (Astar Testnet - Dwellir)',
    url: 'wss://shibuya-rpc.dwellir.com',
    type: 'Astar Parachain Testnet'
  },
  {
    name: 'Shibuya (Astar Testnet - BlastAPI)',
    url: 'wss://shibuya.public.blastapi.io',
    type: 'Astar Parachain Testnet'
  },
  {
    name: 'Shibuya (Astar Testnet - Official)',
    url: 'wss://rpc.shibuya.astar.network',
    type: 'Astar Parachain Testnet'
  }
];

async function testNetwork(network) {
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 Testing: ${network.name}`);
    console.log(`   Type: ${network.type}`);
    console.log(`   URL: ${network.url}`);
    console.log(`${'='.repeat(70)}`);

    const provider = new WsProvider(network.url, 15000);
    const api = await Promise.race([
      ApiPromise.create({ provider }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
      )
    ]);

    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version()
    ]);

    console.log(`✅ CONNECTION SUCCESS!`);
    console.log(`   Chain: ${chain}`);
    console.log(`   Node: ${nodeName} ${nodeVersion}`);

    // Check for contracts pallet
    const hasContracts = api.tx.contracts !== undefined;
    const hasEvm = api.tx.evm !== undefined;

    console.log(`\n📦 PALLET SUPPORT:`);
    console.log(`   contracts (ink!): ${hasContracts ? '✅ YES' : '❌ NO'}`);
    console.log(`   evm: ${hasEvm ? '✅ YES' : '❌ NO'}`);

    if (hasContracts) {
      console.log(`\n🎉 CONTRACTS PALLET AVAILABLE!`);
      console.log(`   Methods:`);
      const methods = Object.keys(api.tx.contracts);
      methods.slice(0, 10).forEach(m => console.log(`      - ${m}`));
      if (methods.length > 10) console.log(`      ... and ${methods.length - 10} more`);
    }

    if (hasEvm) {
      console.log(`\n🔷 EVM PALLET AVAILABLE!`);
      console.log(`   Methods:`);
      const methods = Object.keys(api.tx.evm);
      methods.forEach(m => console.log(`      - ${m}`));
    }

    await api.disconnect();
    return {
      success: true,
      hasContracts,
      hasEvm,
      network: network.name,
      url: network.url,
      chain: chain.toString()
    };
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return {
      success: false,
      error: error.message,
      network: network.name,
      url: network.url
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('TESTING POLKADOT TESTNETS FOR SMART CONTRACT SUPPORT (2025)');
  console.log('='.repeat(70));

  const results = [];
  for (const network of networks) {
    const result = await testNetwork(network);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(70));

  const working = results.filter(r => r.success);
  const withContracts = results.filter(r => r.success && r.hasContracts);
  const withEvm = results.filter(r => r.success && r.hasEvm);

  console.log(`\n📊 STATISTICS:`);
  console.log(`   Total tested: ${networks.length}`);
  console.log(`   Working: ${working.length}`);
  console.log(`   With contracts pallet: ${withContracts.length}`);
  console.log(`   With EVM pallet: ${withEvm.length}`);

  if (withContracts.length > 0) {
    console.log(`\n✅ RECOMMENDED FOR DEPLOYMENT (contracts pallet):`);
    withContracts.forEach(r => {
      console.log(`   🎯 ${r.network}`);
      console.log(`      URL: ${r.url}`);
      console.log(`      Chain: ${r.chain}`);
      console.log('');
    });
  }

  if (withEvm.length > 0 && withContracts.length === 0) {
    console.log(`\n⚠️  ALTERNATIVE OPTION (EVM pallet):`);
    withEvm.forEach(r => {
      console.log(`   🔷 ${r.network}`);
      console.log(`      URL: ${r.url}`);
      console.log(`      Chain: ${r.chain}`);
      console.log('');
    });
  }

  if (working.length === 0) {
    console.log(`\n❌ NO WORKING ENDPOINTS FOUND`);
    console.log(`   All tested endpoints failed to connect.`);
  } else if (withContracts.length === 0 && withEvm.length === 0) {
    console.log(`\n⚠️  NO CONTRACT SUPPORT FOUND`);
    console.log(`   Working endpoints don't have contracts or EVM pallets.`);
  }

  process.exit(0);
}

main().catch(console.error);
