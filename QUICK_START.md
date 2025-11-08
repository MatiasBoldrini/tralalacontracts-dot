# 🚀 Quick Start - Tralala Contracts

## Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Opens automatically on http://localhost:3000/
```

## Using the Application

### Step 1: Connect Wallet
- Click "Conecta tu Wallet"
- Select from: Talisman, Polkadot.js, or SubWallet
- **Make sure Paseo testnet is configured in your wallet**

### Step 2: Create Contract
- Go to "Diseña tu Contrato"
- Choose a template: Token, NFT, DAO, Marketplace, Escrow, or Staking
- Customize using visual Blockly blocks
- View live Solidity code generation

### Step 3: Deploy
- Go to "Despliega tu Contrato"
- Review contract code and gas estimates
- Click "Desplegar en Testnet"
- Sign transaction in your wallet
- Monitor 8-step deployment process

### Step 4: Verify
- Check success dialog with:
  - Transaction hash
  - Block number
  - Gas used
  - Deployment time
- Click "Ver en Block Explorer" to verify on Paseo Subscan

## Network Configuration

**Current Network:** Paseo Testnet
**Chain ID:** 1024
**Native Token:** PAS (10 decimals)
**Block Explorer:** https://paseo.subscan.io
**Faucet:** https://faucet.polkadot.io

### RPC Endpoints

**Primary (WebSocket):** `wss://paseo.rpc.amforc.com`
**Secondary (HTTP):** `https://paseo.dotters.network`

All endpoints configured in: `src/config/polkadot.ts`

## Getting Testnet Tokens

1. Go to https://faucet.polkadot.io
2. Enter your Polkadot address
3. Receive free PAS tokens for Paseo testnet
4. Use for deployment gas fees

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Project Structure

```
src/
├── components/           # React UI components
│   ├── ContractBuilder.tsx      # Visual Blockly editor
│   ├── DeploymentPanel.tsx      # Deployment interface
│   ├── WalletConnection.tsx     # Wallet setup
│   └── ContractVisualizer.tsx   # View deployed contracts
├── hooks/               # React hooks
│   └── usePolkadot.ts           # Polkadot API & wallet hooks
├── utils/               # Utilities
│   ├── blocklyConfig.ts         # Blockly block definitions
│   ├── contractTemplates.ts     # 6 contract templates
│   └── deploymentUtils.ts       # Validation & bytecode
├── config/              # Configuration
│   └── polkadot.ts              # Network & app config
├── pages/               # Page components
│   └── HomePage.tsx             # Main 4-step workflow
└── main.tsx            # React entry point with MUI theme
```

## Contract Templates Available

1. **Token (ERC-20 compatible)**
   - Mint, burn, transfer functions
   - Total supply tracking
   - Balance management

2. **NFT (ERC-721 compatible)**
   - Token URI storage
   - Ownership tracking
   - Transfer functions

3. **DAO (Governance)**
   - Create proposals
   - Vote on decisions
   - Execute proposals

4. **Marketplace**
   - List items for sale
   - Buy/sell functionality
   - Price management

5. **Escrow**
   - Hold funds securely
   - Release conditions
   - Multi-signature support

6. **Staking**
   - Stake tokens
   - Earn rewards
   - Unstake functionality

## Troubleshooting

### "Conectando a la red..." takes too long
- **Solution:** Check RPC endpoint in `src/config/polkadot.ts`
- **Verify:** Try pinging the endpoint with: `curl https://paseo.dotters.network`

### Wallet not detected
- **Solution:** Install Polkadot.js extension or Talisman wallet
- **Links:**
  - Polkadot.js: https://polkadot.js.org/extension/
  - Talisman: https://talisman.xyz/

### Transaction fails to deploy
- **Solution:** Check that your wallet has PAS tokens for gas
- **Get tokens:** https://faucet.polkadot.io
- **Verify network:** Make sure wallet shows Paseo testnet

### Contract code won't generate
- **Solution:** Check browser console for errors
- **Try:** Use a different contract template
- **Validate:** Ensure all required fields are filled

## Deployment Monitoring

During deployment, the app shows 8 steps:

1. **Validar código** - Checking Solidity syntax
2. **Compilar contrato** - Generating bytecode and ABI
3. **Estimar gas** - Calculating gas requirements
4. **Preparar transacción** - Building deployment transaction
5. **Firma de transacción** - Waiting for wallet signature
6. **Enviar a blockchain** - Broadcasting to network
7. **Confirmar en blockchain** - Waiting for block inclusion
8. **Deployment completado** - Contract is live!

## Key Files for Customization

### Add New Contract Template
Edit: `src/utils/contractTemplates.ts`
- Add new generator function
- Update contract selection UI in `ContractBuilder.tsx`

### Change Network
Edit: `src/config/polkadot.ts`
- Update `POLKADOT_CONFIG.network`
- Change RPC endpoints and explorer

### Modify UI Theme
Edit: `src/main.tsx`
- Adjust colors in `theme` object
- MUI components use theme colors automatically

### Add Wallet Type
Edit: `src/config/polkadot.ts`
- Add to `supportedWallets` array
- Update wallet detection in `usePolkadot` hook

## Development Tips

### View Generated Code
```typescript
// In ContractBuilder.tsx
console.log('Generated Solidity:', solidityCode)
```

### Monitor Blockchain Events
```typescript
// In useContractDeployment hook
// Check deploymentProgress state for step-by-step updates
```

### Test Locally
```bash
# Dev server with hot reload
npm run dev

# Type check while developing
npm run type-check

# Build and test production
npm run build
npm run preview
```

## Support & Resources

- **Polkadot Docs:** https://docs.polkadot.com
- **ink! Contracts:** https://use.ink/
- **Polkadot.js API:** https://polkadot.js.org/docs
- **Paseo Testnet:** https://paseo.subscan.io
- **Hackathon Info:** Sub0 2024

## License

MIT License - See LICENSE file for details

---

**Last Updated:** November 3, 2025
**Status:** Production Ready
**Network:** Paseo Testnet
**Wallet Support:** Talisman, Polkadot.js, SubWallet
