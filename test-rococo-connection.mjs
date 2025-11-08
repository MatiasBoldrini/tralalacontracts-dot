import { ApiPromise, WsProvider } from '@polkadot/api';

async function testRococoConnection() {
  console.log('🔌 Testing Rococo TestNet connection...\n');

  try {
    console.log('Connecting to wss://rococo-rpc.polkadot.io');
    const wsProvider = new WsProvider('wss://rococo-rpc.polkadot.io');

    const api = await ApiPromise.create({ provider: wsProvider });

    console.log('✅ WebSocket connection successful!');
    console.log('✅ API instance created');

    // Check chain info
    const chain = await api.rpc.system.chain();
    console.log('✅ Connected to chain: ' + chain.toString());

    // Check if contracts pallet is available
    const hasContractsPallet = api.tx.contracts !== undefined;
    if (hasContractsPallet) {
      console.log('✅ Contracts pallet IS available');
    } else {
      console.log('❌ Contracts pallet NOT available');
    }

    // Get current block info
    const header = await api.rpc.chain.getHeader();
    console.log('✅ Current block: ' + header.number.toString());

    // Check network properties
    const props = await api.rpc.system.properties();
    console.log('✅ Network properties:', props.toString());

    await api.disconnect();
    console.log('\n✅ All tests passed! Rococo testnet is working.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testRococoConnection();
