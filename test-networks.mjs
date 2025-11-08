import { ApiPromise, WsProvider } from '@polkadot/api';

const networks = [
  { name: 'Rococo (current)', ws: 'wss://rococo-rpc.polkadot.io' },
  { name: 'Westend', ws: 'wss://westend-rpc.polkadot.io' },
];

async function testNetwork(name, wsUrl) {
  try {
    console.log('\n🔌 Testing ' + name);
    console.log('   URL: ' + wsUrl);

    const wsProvider = new WsProvider(wsUrl);
    const api = await ApiPromise.create({ provider: wsProvider });

    const chain = await api.rpc.system.chain();
    console.log('   ✅ Connected to: ' + chain.toString());

    const hasContractsPallet = api.tx.contracts !== undefined;
    const hasEvmPallet = api.tx.evm !== undefined;

    if (hasContractsPallet) {
      console.log('   ✅ Has contracts pallet');
    } else if (hasEvmPallet) {
      console.log('   ✅ Has EVM pallet');
    } else {
      console.log('   ❌ No smart contract pallet');
    }

    await api.disconnect();
  } catch (error) {
    console.log('   ❌ Connection failed: ' + error.message);
  }
}

async function main() {
  console.log('Testing Polkadot network options...');
  for (const network of networks) {
    await testNetwork(network.name, network.ws);
  }
  console.log('\nNote: For EVM contracts on Polkadot, consider using:');
  console.log('- Local development node with contracts pallet');
  console.log('- Alternative: Deploy to Moonbeam (Polkadot parachain with full EVM support)');
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
