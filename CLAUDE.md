# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tralala Contracts** is a visual platform for creating smart contracts on Polkadot using a Blockly-based interface. Developed for LATIN HACK 2024, it enables users to create Solidity smart contracts without writing code by dragging and connecting visual blocks.

### Key Features
- Visual contract builder using Blockly
- Real-time Solidity code generation
- Polkadot testnet (Paseo) deployment
- Support for multiple wallet types (Talisman, Polkadot.js, SubWallet)
- Contract testing interface at `/test` route
- Pre-built contract templates (Token, NFT, DAO, Marketplace)

## Development Commands

```bash
# Development server (runs on http://localhost:3000 with auto-open)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type checking (TypeScript)
npm run type-check
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI) with custom theme
- **Visual Builder**: Blockly 12.3.1
- **Blockchain**: Polkadot.js API
- **Build Tool**: Vite
- **Styling**: Emotion (CSS-in-JS) + Material-UI

### High-Level Structure

```
src/
├── components/          # React UI components
│   ├── ContractBuilder.tsx       # Main Blockly workspace component
│   ├── ContractVisualizer.tsx    # View deployed contracts
│   ├── DeploymentPanel.tsx       # Contract deployment interface
│   ├── TestPage.tsx              # Contract testing page (required by hackathon)
│   ├── WalletConnection.tsx      # Wallet connection UI
│   └── SubWalletHelper.tsx       # SubWallet integration helper
├── hooks/              # React hooks
│   └── usePolkadot.ts            # Wallet and API connection hooks
├── pages/              # Page-level components
│   └── HomePage.tsx              # Main entry point with step navigation
├── config/             # Application configuration
│   └── polkadot.ts               # Network, wallet, and app config
├── utils/              # Utility functions
│   ├── blocklyConfig.ts          # Blockly block definitions and toolbox
│   └── contractTemplates.ts      # Pre-built contract templates
├── shared/             # Reusable components
│   ├── Header.tsx                # App header with branding
│   ├── VideoHeader.tsx           # Video background component
│   └── TralalaIcon.tsx           # Custom icon component
├── types/              # TypeScript type definitions
└── main.tsx            # React entry point with MUI theme setup
```

### Core Data Flow

1. **Wallet Connection**: `usePolkadot()` hook → manages wallet connection via Polkadot extension
2. **Step Navigation**: `HomePage` component controls 4-step flow:
   - Step 1: Wallet connection (WalletConnection)
   - Step 2: Contract design (ContractBuilder with Blockly)
   - Step 3: Deployment (DeploymentPanel)
   - Step 4: Visualization (ContractVisualizer)
3. **Code Generation**: Blockly blocks → Solidity code (real-time in ContractBuilder)
4. **Deployment**: Generated contract → signed transaction via wallet → Polkadot testnet

### Key Components

#### usePolkadot Hook (`src/hooks/usePolkadot.ts`)
Three related hooks:
- `usePolkadot()`: Manages wallet extension connection and account selection
- `usePolkadotApi()`: Connects to Polkadot Hub TestNet node
- `useTransaction()`: Handles transaction signing and sending

#### ContractBuilder (`src/components/ContractBuilder.tsx`)
- Integrates Blockly workspace with custom contract blocks
- Generates Solidity code from block configuration
- Supports template-based contract scaffolding

#### Configuration (`src/config/polkadot.ts`)
- Network config: Polkadot Hub TestNet (chain ID: 420420422)
- RPC: `https://testnet-passet-hub-eth-rpc.polkadot.io`
- WebSocket: `wss://testnet-passet-hub-rpc.polkadot.io`
- Explorer: Blockscout integration for verification
- Supported wallets: Talisman, Polkadot.js, SubWallet
- Blockly block categories: Token, NFT, Voting, Marketplace, Logic, Math, Text, Control

### Theme & Styling

**Theme defined in `src/main.tsx`**:
- Primary: Indigo (#6366f1)
- Secondary: Pink (#ec4899)
- Custom MUI component overrides for buttons and cards
- Inter font family with custom typography scale

Material-UI theme is applied globally via `ThemeProvider` in `main.tsx`.

## Important Implementation Notes

### Blockly Integration
- Blockly blocks are defined in `src/utils/blocklyConfig.ts`
- Custom block types for contract features (tokens, NFTs, DAO, marketplace)
- Code generation from blocks uses Blockly's built-in code generation
- Block toolbox organized by category with color coding

### Wallet Integration
- Uses Polkadot extension dapp library for wallet communication
- Lazy imports of `@polkadot/extension-dapp` to avoid blocking app load
- Automatic account detection on component mount
- Error handling for missing wallets or accounts

### Solidity Code Generation
- Templates stored in `src/utils/contractTemplates.ts`
- Version: ^0.8.28 (SPDX-License-Identifier: MIT)
- Generated contracts include standard patterns (Token=ERC20, NFT=ERC721 style)

### Deployment Flow
- Uses `@polkadot/api` for blockchain communication
- Transactions signed client-side by wallet
- Block explorer URLs automatically generated for deployed contracts
- Gas settings: limit 5M, price 1 Gwei (configurable in `POLKADOT_CONFIG`)

## File Modification Guidelines

### When Adding New Features

**New Blockly Block Types**:
1. Define block in `src/utils/blocklyConfig.ts` (add to CUSTOM_BLOCKS)
2. Add category to toolbox in blockly config if needed
3. Implement code generator if not using existing Blockly blocks

**New Contract Template**:
1. Add template to `src/utils/contractTemplates.ts`
2. Add feature definition to `src/types/index.ts` if needed
3. Update BLOCKLY_CONTRACT_CONFIG categories if applicable

**New Page/Route**:
1. Create component in `src/pages/`
2. Update step navigation in `HomePage.tsx` to include new step
3. Update APP_MESSAGES in `src/config/polkadot.ts` with UI text

**New Hook**:
1. Add to `src/hooks/usePolkadot.ts` or create new file if significant
2. Follow existing pattern of returning state, handlers, and error states
3. Use TypeScript types from `src/types/index.ts`

### Network Configuration Changes
All network configs in `src/config/polkadot.ts`:
- Change `POLKADOT_CONFIG.network` to switch networks
- Update RPC/WebSocket URLs
- Adjust gas settings in `deployment` object

### UI/Theme Changes
- Colors in `main.tsx` ThemeProvider theme object
- Layout config in `UI_CONFIG` at bottom of `src/config/polkadot.ts`
- Component-specific styling uses Material-UI's sx prop or Emotion

## Hackathon Requirements (LATIN HACK 2024)

✅ **Network**: Polkadot Paseo testnet deployment
✅ **Language**: Solidity ^0.8.28
✅ **Testing Page**: Available at `/test` (ContractVisualizer component shows test interface)
✅ **Smart Contracts**: Core functionality - visual builder generates and deploys real contracts
✅ **Step Navigation**: Clickable steppers between 4 main workflow steps
✅ **Visual Design**: Full Blockly integration for contract creation

## Build Output

- **Output Directory**: `dist/`
- **Source Maps**: Enabled in production build
- **Vite Config**: `vite.config.ts` (port 3000 for dev)

## Polkadot Skills & Resources

This project includes comprehensive Polkadot-focused skills and documentation to ensure Claude always uses the latest information from official sources. **Always reference these skills when working with Polkadot** to avoid using outdated documentation.

### 📚 Available Skills

#### 1. **polkadot-documentation** (Primary Resource Index)
**Use when**: You need to find where something is documented in Polkadot ecosystem
- Central hub linking to all official documentation
- Organized by category and use case
- Ensures you find authoritative sources first
- Access: `Skill → polkadot-documentation`

#### 2. **polkadot-smart-contracts** (Contract Development)
**Use when**: Creating or modifying smart contracts, implementing token standards
- ink! (Rust) contract development
- Solidity contract development
- PSP Standards (PSP-20, PSP-34, PSP-37)
- Best practices and security patterns
- Access: `Skill → polkadot-smart-contracts`

#### 3. **polkadot-testnet-deployment** (Deployment & Testing)
**Use when**: Deploying contracts, configuring testnets, getting testnet tokens
- Testnet configuration (Paseo, Rococo, Polkadot Hub TestNet)
- Deployment process and verification
- Gas configuration and limits
- Transaction monitoring and troubleshooting
- Access: `Skill → polkadot-testnet-deployment`

#### 4. **polkadot-wallet-integration** (Wallet Connectivity)
**Use when**: Adding wallet support, fixing connection issues, implementing account management
- Polkadot.js Extension integration
- Multi-wallet support (Talisman, SubWallet, Ledger, Nova)
- Transaction signing and message signing
- Account management and validation
- Access: `Skill → polkadot-wallet-integration`

#### 5. **polkadot-performance-optimization** (Performance & Cost Reduction)
**Use when**: Optimizing contracts, reducing gas costs, improving dApp responsiveness
- Smart contract gas optimization
- dApp API call optimization
- Caching and batching strategies
- Performance monitoring and metrics
- Access: `Skill → polkadot-performance-optimization`

### 📖 Central Resources File

**File**: `.claude/POLKADOT_RESOURCES.md`
- Complete reference with all network configs
- Link to all official documentation
- Token standards specifications (PSP-20, PSP-34, PSP-37)
- Wallet download links and specifications
- Faucet information
- Block explorer URLs
- Quick links organized by use case

### 🎯 When to Use Skills vs Direct Development

**Use Polkadot Skills when**:
- ❓ You need to find information about Polkadot
- 🔧 You're working with wallet integration
- 📝 You're creating smart contracts
- 🚀 You're deploying to testnet
- ⚡ You're optimizing performance or gas

**Direct Development when**:
- ✏️ You're writing application code (not Polkadot-specific)
- 🎨 You're working with React/UI components
- 🏗️ You're modifying project architecture
- 📦 You're managing dependencies

### Example Workflow

When implementing wallet connection:
```
1. Read the wallet integration code → src/hooks/usePolkadot.ts
2. Check Polkadot Wallet Integration skill for latest patterns
3. Reference polkadot-documentation for official sources
4. Update/fix the implementation
5. Verify against POLKADOT_RESOURCES.md for URLs and configs
```

### Key Features of the Skill System

✅ **Always Uses Latest Documentation**: Skills link to official sources dated 2024
✅ **Organized by Category**: Different skills for different concerns
✅ **Complete Network Info**: All testnet configs in one place
✅ **Standard References**: PSP token standards included
✅ **Best Practices**: Security, optimization, and performance patterns
✅ **Community Links**: Discord, forums, GitHub for additional help

### Network Configuration Reference

Current testnet configuration uses **Polkadot Hub TestNet**:
- Chain ID: 420420422
- RPC HTTP: https://testnet-passet-hub-eth-rpc.polkadot.io
- Gas Limit: 5,000,000
- See `.claude/POLKADOT_RESOURCES.md` for alternatives

### Important Notes

- 🎯 **Before answering Polkadot questions**, check if a skill covers it
- 📚 **For authoritative information**, always follow skill links to official docs
- 🔄 **Updates**: Skills are maintained with latest Polkadot developments
- ⚠️ **Never assume network details** - reference POLKADOT_RESOURCES.md
- 🌐 **Always verify on official wiki** (wiki.polkadot.network) for definitive answers
