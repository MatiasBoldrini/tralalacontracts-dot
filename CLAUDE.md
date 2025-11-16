# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tralala Contracts** is a visual platform for creating and deploying smart contracts on Polkadot without requiring programming experience. It uses Blockly for visual contract design and integrates with the Polkadot ecosystem for deployment and wallet management.

## Development Commands

### Installation & Setup
```bash
npm install
```

### Development
```bash
npm run dev          # Start Vite dev server on port 3000
npm run type-check   # Run TypeScript type checking
npm run lint         # Run type checking via lint
```

### Build & Preview
```bash
npm run build        # TypeScript compilation + Vite build → dist/
npm run preview      # Preview built application locally
```

### Testing
```bash
npm test             # Run unit tests with Vitest
npm run test:ui      # Run tests with UI dashboard
npm run test:e2e     # Run Playwright end-to-end tests
npm run test:e2e:ui  # Run E2E tests with UI
npm run test:e2e:debug # Debug E2E tests
```

## Architecture

### High-Level Structure

The application follows a feature-based structure:

- **`src/pages/`** - Main page components (HomePage is the entry point)
- **`src/components/`** - Feature components:
  - `ContractBuilder.tsx` - Blockly-based visual contract editor
  - `ContractWizard.tsx` - Guided contract creation workflow
  - `ContractVisualizer.tsx` - Displays deployed contract details
  - `DeploymentPanel.tsx` - Contract deployment and progress tracking
  - `WalletConnection.tsx` - Wallet connection and account selection
  - `SubWalletHelper.tsx` - SubWallet integration helpers
- **`src/hooks/`** - Custom React hooks for Polkadot integration:
  - `usePolkadot()` - Wallet extension connection and account management
  - `usePolkadotApi()` - API connection with endpoint fallback logic
  - `useTransaction()` - Transaction signing and submission
  - `useContractDeployment()` - Full contract deployment workflow
- **`src/utils/`** - Utility functions:
  - `deploymentUtils.ts` - Contract compilation, gas estimation, bytecode generation
  - `blocklyConfig.ts` - Blockly block definitions and configuration
  - `contractTemplates.ts` - Pre-built contract templates
  - `blocklyWizard.ts` - Blockly workspace helpers
- **`src/config/`** - Configuration:
  - `polkadot.ts` - Network config (Pop Network testnet), wallet definitions, messages
- **`src/types/`** - TypeScript interfaces for types like `WalletAccount`, `DeployedContract`, `GeneratedContract`
- **`src/shared/`** - Shared components (Header, Icons, etc.)

### Key Data Flows

**Wallet Connection:**
1. User clicks "Connect Wallet" → `WalletConnection` component
2. `usePolkadot()` hook initializes via `web3Enable()` (Polkadot extension-dapp)
3. Available accounts fetched and displayed
4. Selected account passed to deployment workflow

**Contract Deployment:**
1. User designs contract in Blockly (`ContractBuilder`)
2. Code generated from visual blocks
3. `useContractDeployment()` handles multi-step deployment:
   - Validation of Solidity code
   - Compilation to bytecode via `compileContract()`
   - Gas estimation via `estimateDeploymentGas()`
   - Transaction creation using Polkadot contracts pallet (`api.tx.contracts.instantiate()`)
   - Signing via wallet extension (`web3FromSource()`)
   - Status tracking through blockchain events
4. Result displayed in `ContractVisualizer`

**Network Configuration:**
- Primary endpoint: Pop Network Testnet (Polkadot contracts testnet on Paseo)
- Fallback endpoints configured in `POLKADOT_CONFIG.network.wsUrlFallbacks`
- `usePolkadotApi()` implements retry logic with 10-second timeout per endpoint
- Connection automatically attempted on app mount

### Important Type System

Key TypeScript interfaces in `src/types/index.ts`:
- `WalletAccount` - User wallet account from extension
- `GeneratedContract` - Smart contract with code, ABI, features
- `DeployedContract` - Deployed contract with blockchain metadata (address, tx hash, block info)
- `ContractFeature` - Feature category (token, NFT, DAO, DeFi, utility)
- `PolkadotNetwork` - Network configuration with RPC endpoints
- `CompilationMetadata` - Compilation output (bytecode, ABI, function list)

### UI Framework & Styling

- **React 19** with TypeScript
- **Material-UI (MUI 7)** for components and theming
- **Emotion** for CSS-in-JS styling
- **Framer Motion** for animations
- Custom Material-UI theme defined in `src/main.tsx` (indigo primary, pink secondary)
- Responsive design via MUI Grid/Box components

### Configuration & Constants

All user-facing strings, Polkadot network settings, and UI config centralized in `src/config/polkadot.ts`:
- `POLKADOT_CONFIG` - Network endpoints, wallet support, deployment settings
- `BLOCKLY_CONTRACT_CONFIG` - Block categories and code generation settings
- `APP_MESSAGES` - Error/success messages in Spanish
- `UI_CONFIG` - Theme colors and animation settings

### Polkadot Integration Details

**Extension Communication:**
- Uses `@polkadot/extension-dapp` for browser wallet integration
- Supports Talisman, Polkadot.js, SubWallet extensions
- Accounts accessed via `web3Accounts()`
- Signing via `web3FromSource()` returns signer interface

**API Connection:**
- `@polkadot/api` with `WsProvider` for WebSocket connections
- Contracts pallet used for deployment: `api.tx.contracts.instantiate()`
- Event subscriptions for transaction status tracking
- Automatic cleanup on unmount via `disconnect()`

**Contract Compilation:**
- Solidity validation (pragma, contract keyword, brace matching)
- Simulated bytecode generation (not a full compiler)
- Basic ABI generation from function/event extraction
- Real deployment uses generated bytecode with Polkadot contracts pallet

## Testing

Tests located in `src/utils/__tests__/`:
- `deploymentUtils.test.ts` - Unit tests for compilation and gas estimation
- `integration.test.ts` - Integration tests for deployment workflow

Run tests before committing significant changes.

## Common Development Tasks

### Adding a New Contract Feature/Block
1. Define block in `src/config/polkadot.ts` under `BLOCKLY_CONTRACT_CONFIG.categories`
2. Add code generation logic to `src/utils/blocklyWizard.ts`
3. Update contract templates if applicable in `src/utils/contractTemplates.ts`

### Debugging Wallet Connection Issues
1. Check browser console for extension-dapp errors
2. Verify extension is installed and wallet unlocked
3. Use `usePolkadot()` hook state (`error`, `isConnected`)
4. Common issue: Extension not exposed if page loads before extension initializes

### Adding Network Support
1. Update `POLKADOT_CONFIG.network` in `src/config/polkadot.ts`
2. Add fallback endpoints to `wsUrlFallbacks` array
3. Test connection via `usePolkadotApi()` which has retry logic built in
4. Update explorer URL for block explorer links

### Deployment Troubleshooting
- Check gas estimate in `estimateDeploymentGas()` is sufficient
- Monitor deployment progress via `DeploymentPanel` component
- Contract address in Polkadot is transaction hash (not EVM-style contract address)
- Explorer links point to Subscan with transaction hash

## Performance Notes

- **Blockly workspace** is heavy; consider lazy loading or code splitting if adding more features
- **Network requests** use timeout fallbacks to prevent hanging connections
- **API subscriptions** cleaned up in component unmount to avoid memory leaks
- Tests use `happy-dom` environment (lighter than jsdom) for faster test runs

## Known Limitations & Quirks

1. **Bytecode Generation** - Currently simulated, not using full Solidity compiler
2. **Contract Address** - Polkadot contracts are referenced by transaction hash, not EVM-style addresses
3. **Gas Estimation** - Simplified estimation based on code size; actual gas may vary
4. **Blockly** - Currently using Blockly for design, but generated code is Solidity (for EVM compatibility reference, though deployed to Polkadot)
5. **Network Dependency** - Relies on Pop Network testnet availability; fallback endpoints configured for redundancy

## Git Workflow

Commits follow conventional format. Use descriptive messages focusing on **why** changes were made, not just **what**.
