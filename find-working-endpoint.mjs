import { ApiPromise, WsProvider } from '@polkadot/api';

const endpoints = [
  { name: 'Astar Official', url: 'wss://rpc.shibuya.astar.network' },
  { name: 'Dwellir', url: 'wss://shibuya-rpc.dwellir.com' },
  { name: 'Pinknode', url: 'wss://shibuya.pinknode.io' },
  { name: 'RadiumBlock', url: 'wss://shibuya.public.curie.radiumblock.co' },
  { name: 'Tokyo HTTP', url: 'https://evm.shibuya.astar.network' },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log(`❌ ${endpoint.name} - TIMEOUT (no response in 5s)`);
      resolve(false);
    }, 5000);

    (async () => {
      try {
        console.log(`🔄 ${endpoint.name} (${endpoint.url})`);
        const provider = new WsProvider(endpoint.url, 3000);
        const api = await ApiPromise.create({ provider });

        const chain = await api.rpc.system.chain();
        const hasContracts = api.tx.contracts !== undefined;

        clearTimeout(timeout);

        console.log(`✅ ${endpoint.name}`);
        console.log(`   Chain: ${chain}`);
        console.log(`   Has Contracts: ${hasContracts ? 'YES' : 'NO'}`);

        await api.disconnect();
        resolve(hasContracts);
      } catch (error) {
        clearTimeout(timeout);
        console.log(`❌ ${endpoint.name} - ${error.message}`);
        resolve(false);
      }
    })();
  });
}

(async () => {
  console.log('\nSearching for working Shibuya endpoint...\n');

  for (const endpoint of endpoints) {
    const works = await testEndpoint(endpoint);
    if (works) {
      console.log(`\n✅ USE THIS ENDPOINT: ${endpoint.url}`);
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 1000)); // Delay between tests
  }

  console.log('\n❌ No working endpoints found');
  process.exit(1);
})();
