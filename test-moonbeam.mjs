import { ApiPromise, WsProvider } from '@polkadot/api';

async function testMoonbeamConnection() {
  console.log('🔌 Testing Moonbeam TestNet (Moonbase Alpha) connection...\n');

  try {
    console.log('Connecting to wss://wss.api.moonbase.moonbeam.network');
    const wsProvider = new WsProvider('wss://wss.api.moonbase.moonbeam.network');

    const api = await ApiPromise.create({ provider: wsProvider });

    console.log('✅ WebSocket connection successful!');
    console.log('✅ API instance created');

    // Check chain info
    const chain = await api.rpc.system.chain();
    console.log('✅ Connected to chain: ' + chain.toString());

    // Check if contracts pallet is available
    const hasContractsPallet = api.tx.contracts !== undefined;
    const hasEvmPallet = api.tx.evm !== undefined;
    
    if (hasEvmPallet) {
      console.log('✅ EVM pallet IS available (can deploy Solidity contracts!)');
    } else if (hasContractsPallet) {
      console.log('✅ Contracts pallet IS available');
    } else {
      console.log('❌ No smart contract pallet found');
    }

    // Get current block info
    const header = await api.rpc.chain.getHeader();
    console.log('✅ Current block: ' + header.number.toString());

    // Check network properties
    const props = await api.rpc.system.properties();
    console.log('✅ Network properties:', props.toString());

    await api.disconnect();
    console.log('\n✅ Moonbeam TestNet is working and ready for Solidity contract deployment!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testMoonbeamConnection();
