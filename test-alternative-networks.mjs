import { ApiPromise, WsProvider } from '@polkadot/api';

const networks = [
  {
    name: 'Pop Network Testnet (Official)',
    url: 'wss://rpc1.paseo.popnetwork.xyz',
    type: 'Pop Network - Polkadot Testnet for Contracts'
  },
  {
    name: 'Pop Network Testnet (Alt)',
    url: 'wss://rpc2.paseo.popnetwork.xyz',
    type: 'Pop Network - Polkadot Testnet for Contracts'
  },
  {
    name: 'Moonbase Alpha (Official)',
    url: 'wss://wss.api.moonbase.moonbeam.network',
    type: 'Moonbeam Testnet - EVM Compatible'
  },
  {
    name: 'Aleph Zero Testnet',
    url: 'wss://ws.test.azero.dev',
    type: 'Aleph Zero Testnet - ink! Contracts'
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
    const hasEthereum = api.tx.ethereum !== undefined;

    console.log(`\n📦 PALLET SUPPORT:`);
    console.log(`   contracts (ink!): ${hasContracts ? '✅ YES' : '❌ NO'}`);
    console.log(`   evm: ${hasEvm ? '✅ YES' : '❌ NO'}`);
    console.log(`   ethereum: ${hasEthereum ? '✅ YES' : '❌ NO'}`);

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

    if (hasEthereum) {
      console.log(`\n🔷 ETHEREUM PALLET AVAILABLE!`);
      console.log(`   This network supports Ethereum-compatible contracts`);
    }

    await api.disconnect();
    return {
      success: true,
      hasContracts,
      hasEvm,
      hasEthereum,
      network: network.name,
      url: network.url,
      chain: chain.toString(),
      type: network.type
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
  console.log('TESTING ALTERNATIVE TESTNETS FOR SMART CONTRACT SUPPORT (2025)');
  console.log('='.repeat(70));

  const results = [];
  for (const network of networks) {
    const result = await testNetwork(network);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('FINAL SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(70));

  const working = results.filter(r => r.success);
  const withContracts = results.filter(r => r.success && r.hasContracts);
  const withEvm = results.filter(r => r.success && (r.hasEvm || r.hasEthereum));

  console.log(`\n📊 STATISTICS:`);
  console.log(`   Total tested: ${networks.length}`);
  console.log(`   Working: ${working.length}`);
  console.log(`   With contracts pallet (ink!): ${withContracts.length}`);
  console.log(`   With EVM/Ethereum pallet: ${withEvm.length}`);

  if (withContracts.length > 0) {
    console.log(`\n✅ BEST OPTION - ink! CONTRACTS PALLET:`);
    withContracts.forEach(r => {
      console.log(`\n   🎯 ${r.network}`);
      console.log(`      Type: ${r.type}`);
      console.log(`      URL: ${r.url}`);
      console.log(`      Chain: ${r.chain}`);
      console.log(`      ✅ This is ideal for Polkadot native contracts`);
    });
  }

  if (withEvm.length > 0) {
    console.log(`\n${withContracts.length === 0 ? '✅' : '⚠️'}  ${withContracts.length === 0 ? 'ALTERNATIVE' : 'ALSO AVAILABLE'} - EVM CONTRACTS:`);
    withEvm.forEach(r => {
      console.log(`\n   🔷 ${r.network}`);
      console.log(`      Type: ${r.type}`);
      console.log(`      URL: ${r.url}`);
      console.log(`      Chain: ${r.chain}`);
      if (withContracts.length === 0) {
        console.log(`      ⚠️  EVM only - requires Solidity contracts deployed via Ethereum tools`);
      }
    });
  }

  if (working.length === 0) {
    console.log(`\n❌ NO WORKING ENDPOINTS FOUND`);
    console.log(`   All tested endpoints failed to connect.`);
    console.log(`   This might be a temporary network issue.`);
  } else if (withContracts.length === 0 && withEvm.length === 0) {
    console.log(`\n⚠️  NO CONTRACT SUPPORT FOUND`);
    console.log(`   Working endpoints don't have contracts or EVM pallets.`);
    console.log(`   You may need to check with the hackathon organizers.`);
  }

  if (withContracts.length > 0) {
    console.log(`\n📝 NEXT STEPS:`);
    console.log(`   1. Update src/config/polkadot.ts with the recommended endpoint above`);
    console.log(`   2. Ensure your wallet has testnet tokens (use faucet)`);
    console.log(`   3. Deploy your contract using the updated configuration`);
  }

  process.exit(0);
}

main().catch(console.error);
