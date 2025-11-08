# Tralala Contracts - Architecture Diagrams & Data Flow

## 1. WALLET INTEGRATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER BROWSER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────┐                            │
│  │   Tralala Contracts Web App      │                            │
│  │   (React + TypeScript)           │                            │
│  └──────────────┬───────────────────┘                            │
│                 │                                                 │
│    ┌────────────┴──────────────────────────────────┐             │
│    │                                               │             │
│    v                                               v             │
│  ┌─────────────────────┐            ┌──────────────────────┐    │
│  │  usePolkadot()      │            │  usePolkadotApi()    │    │
│  │                     │            │                      │    │
│  │ - Detect wallets    │            │ - Connect to RPC     │    │
│  │ - List accounts     │            │ - Create ApiPromise  │    │
│  │ - Manage selection  │            │ - Monitor state      │    │
│  └──────────┬──────────┘            └──────────┬───────────┘    │
│             │                                   │                │
│             │ web3Enable()                      │                │
│             │ web3Accounts()                    │                │
│             │ web3FromSource()                  │ WsProvider     │
│             │                                   │                │
└─────────────┼───────────────────────────────────┼────────────────┘
              │                                   │
              │                                   │
              v                                   v
        ┌────────────────┐              ┌──────────────────┐
        │ Wallet Ext.    │              │  Polkadot Node   │
        │ (Talisman /    │              │  (Testnet)       │
        │  Polkadot.js / │              │                  │
        │  SubWallet)    │              │  RPC/WSS Port    │
        └────────────────┘              └──────────────────┘
        
USER AUTHORIZES IN WALLET POPUP ↔ API METHODS CALLED VIA IPC
```

### Account Discovery Flow
```
Tralala App Start
       ↓
[Auto-check] web3Accounts() → No accounts → Show "Connect Wallet" UI
       ↓
[User clicks] "Connect Wallet"
       ↓
web3Enable('Tralala Contracts') → Wallet popup (user approves)
       ↓
web3Accounts() → Returns: [WalletAccount, WalletAccount, ...]
       ↓
Display account list with: address, name, wallet source
       ↓
[User selects account]
       ↓
State: isConnected = true, account = selected account
```

---

## 2. CURRENT DEPLOYMENT ARCHITECTURE (MOCK)

```
┌─────────────────────────────────────────────────────────────────┐
│              DEPLOYMENT PANEL (Current - Mock Only)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Step 1: Validate Code                          ✅ WORKS │    │
│  │ - Check pragma solidity                                 │    │
│  │ - Check contract keyword                                │    │
│  │ - Simulate 1s delay                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Step 2: Estimate Gas                      ⚠️ MOCK ONLY  │    │
│  │ - Formula: Math.max(200k, lines*1k + funcs*50k)         │    │
│  │ - NOT using real RPC estimation                         │    │
│  │ - Simulate 1.5s delay                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Step 3: Sign Transaction               ⚠️ INCOMPLETE     │    │
│  │ - Simulate 1s delay (no actual signing)                 │    │
│  │ - MISSING: useTransaction() integration                 │    │
│  │ - MISSING: Contract creation TX construction            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Step 4: Deploy Contract                 ❌ NOT WORKING   │    │
│  │ - MISSING: Solidity → Bytecode compilation              │    │
│  │ - MISSING: Contract creation extrinsic                  │    │
│  │ - MISSING: Transaction submission                       │    │
│  │ - MISSING: Receipt parsing                              │    │
│  │ - Shows error message: "Deployment requires..."         │    │
│  └─────────────────────────────────────────────────────────���    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Step 5: Verify Deployment              ❌ NOT WORKING   │    │
│  │ - MISSING: Contract existence check                     │    │
│  │ - MISSING: Blockscout verification                      │    │
│  │ - MISSING: ABI storage                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. REQUIRED DEPLOYMENT ARCHITECTURE (Real)

```
┌─────────────────────────────────────────────────────────────────┐
│             DEPLOYMENT FLOW (After Implementation)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  INPUT: Solidity Code from ContractBuilder                       │
│    ↓                                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. COMPILATION (NEW - Priority 1)         ✅ TO DO      │   │
│  │                                                          │   │
│  │   solidityCode                                          │   │
│  │       ↓                                                 │   │
│  │   compileContract(code)  ← solc integration            │   │
│  │       ↓                                                 │   │
│  │   { bytecode: 0x..., abi: [...] }                      │   │
│  │                                                          │   │
│  └───────────────────────┬──────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐   │
│  │ 2. GAS ESTIMATION (Update - Priority 2)  ✅ TO DO       │   │
│  │                                                          │   │
│  │   bytecode                                              │   │
│  │       ↓                                                 │   │
│  │   api.call.contractsApi.estimateGas()                  │   │
│  │       ↓                                                 │   │
│  │   gasLimit: string (e.g., "5000000")                   │   │
│  │                                                          │   │
│  └───────────────────────┬──────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐   │
│  │ 3. BUILD TX (NEW - Priority 1)            ✅ TO DO       │   │
│  │                                                          │   │
│  │   Inputs: bytecode, gasLimit, account, signer          │   │
│  │       ↓                                                 │   │
│  │   contractCreationTx = api.tx.contracts.instantiate(   │   │
│  │     value: 0,                                           │   │
│  │     gasLimit: gasLimit,                                 │   │
│  │     storageDepositLimit: null,                          │   │
│  │     code: bytecode,                                     │   │
│  │     data: [],                                           │   │
│  │     salt: []                                            │   │
│  │   )                                                     │   │
│  │       ↓                                                 │   │
│  │   Extrinsic (unsigned transaction)                      │   │
│  │                                                          │   │
│  └───────────────────────┬──────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐   │
│  │ 4. SIGN & SEND (Enhance - Priority 1)    ✅ TO DO       │   │
│  │                                                          │   │
│  │   Inputs: contractCreationTx, signer, account.address   │   │
│  │       ↓                                                 │   │
│  │   contractCreationTx.signAndSend(address, {signer},    │   │
│  │     callback: ({ status, events, txHash })             │   │
│  │       ↓                                                 │   │
│  │   MONITOR EVENTS:                                       │   │
│  │   - status.isInBlock → Transaction in block            │   │
│  │   - Parse events for contracts.Instantiated event      │   │
│  │   - Extract contractAddress from event                 │   │
│  │   - Finalization event → Mark complete                 │   │
│  │       ↓                                                 │   │
│  │   { txHash, contractAddress, blockNumber }             │   │
│  │                                                          │   │
│  └───────────────────────┬──────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐   │
│  │ 5. VERIFICATION (NEW - Priority 2)       ✅ TO DO       │   │
│  │                                                          │   │
│  │   Inputs: contractAddress, api, blockNumber             │   │
│  │       ↓                                                 │   │
│  │   api.query.contracts.contractInfoOf(address)          │   │
│  │       ↓                                                 │   │
│  │   Returns contract info (or null if not found)          │   │
│  │       ↓                                                 │   │
│  │   { verified: true/false, explorerUrl: "..." }         │   │
│  │                                                          │   │
│  └───────��───────────────┬──────────────────────────────────┘   │
│                          │                                       │
│  OUTPUT: DeployedContract                                        │
│  {                                                               │
│    address: "...",                                              │
│    txHash: "0x...",                                             │
│    blockNumber: 12345,                                          │
│    abi: [...],                                                  │
│    explorerUrl: "https://blockscout-passet..."                 │
│  }                                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. DATA FLOW - COMPLETE USER JOURNEY

```
┌──────────────────────────────────────────────────────────┐
│                   USER JOURNEY                            │
└──────────────────────────────────────────────────────────┘

┌─ STEP 1: WALLET CONNECTION ───────────────────────────┐
│                                                        │
│  User opens app                                       │
│  ↓                                                    │
│  Auto-detect: web3Accounts()                         │
│  ├─ Accounts found? → Show selection                 │
│  └─ No accounts? → Show "Download Wallet" UI         │
│  ↓                                                    │
│  User clicks wallet option                           │
│  ↓                                                    │
│  web3Enable() → Wallet popup → User approves         │
│  ↓                                                    │
│  usePolkadot() state updates                         │
│  ↓                                                    │
│  ✅ Wallet Connected                                  │
│                                                        │
└────────────────────────────────────────────────────────┘

┌─ STEP 2: CONTRACT DESIGN ─────────────────────────────┐
│                                                        │
│  User sees Contract Builder                          │
│  ↓                                                    │
│  User selects template or features                   │
│  ↓                                                    │
│  Blockly workspace initializes                       │
│  ↓                                                    │
│  User drag-drops blocks                              │
│  ↓                                                    │
│  Real-time code generation:                          │
│  - Blockly blocks → Solidity code                    │
│  - Displayed in "Código Generado" tab                │
│  ↓                                                    │
│  User clicks "Continuar al Despliegue"               │
│  ↓                                                    │
│  ✅ Code Ready for Deployment                         │
│                                                        │
└────────────────────────────────────────────────────────┘

┌─ STEP 3: DEPLOYMENT ──────────────────────────────────┐
│                                                        │
│  DeploymentPanel receives Solidity code              │
│  ↓                                                    │
│  Display contract info & gas estimate               │
│  ↓                                                    │
│  User clicks "Desplegar Contrato"                    │
│  ↓                                                    │
│  ┌─ STEP 3.1: Validate Code                         │
│  │ validateCode() → parse & check syntax             │
│  │                                                   │
│  ├─ STEP 3.2: Estimate Gas                          │
│  │ compileContract() → bytecode [NEW]               │
│  │ api.call.contractsApi.estimateGas() [UPDATE]     │
│  │                                                   │
│  ├─ STEP 3.3: Sign Transaction                      │
│  │ contractCreationTx = api.tx.contracts.instantiate │
│  │ web3FromSource() → injector.signer [UPDATE]      │
│  │                                                   │
│  ├─ STEP 3.4: Deploy to Network                     │
│  │ contractCreationTx.signAndSend() [UPDATE]        │
│  │ Monitor: isInBlock event                         │
│  │ Extract: contractAddress from event              │
│  │                                                   │
│  └─ STEP 3.5: Verify on Chain                       │
│    api.query.contracts.contractInfoOf() [NEW]       │
│    Confirm contract exists                          │
│                                                     │
│  ↓                                                    │
│  ✅ Contract Deployed                                 │
│  Returns: address, txHash, explorerUrl              │
│                                                        │
└────────────────────────────────────────────────────────┘

┌─ STEP 4: VISUALIZATION ───────────────────────────────┐
│                                                        │
│  Show deployed contract details:                      │
│  - Address                                           │
│  - Transaction hash (linked to explorer)             │
│  - ABI (if stored)                                   │
│  - Interaction options                               │
│  ↓                                                    │
│  ✅ Journey Complete                                  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 5. COMPONENT DEPENDENCY GRAPH

```
                        HomePage
                         /   \
                        /     \
                   Step 1      Step 2         Step 3          Step 4
                       |         |              |               |
              WalletConnection  ContractBuilder DeploymentPanel ContractVisualizer
                       |              |              |               |
              usePolkadot()  [Blockly]      usePolkadotApi()    usePolkadot()
                  |                   |         useTransaction()    |
              web3Enable()     createCustomBlocks()  |         web3FromSource()
              web3Accounts()   generateSolidityCode()compileContract() [NEW]
              web3FromSource() loadWizardTemplate()  deployContractOnChain() [NEW]
                                generateContractByType()  |
                                                   estimateDeploymentGas() [NEW]
                                                   verifyContractDeployment() [NEW]
```

---

## 6. STATE MANAGEMENT FLOW

```
┌──────────────────────────────────┐
│    GLOBAL APP STATE              │
├──────────────────────────────────┤
│                                  │
│  Wallet Connection State         │
│  ├─ isConnected: boolean         │
│  ├─ account: WalletAccount       │
│  ├─ accounts: WalletAccount[]    │
│  └─ error: string | null         │
│                                  │
│  Blockchain Connection State     │
│  ├─ api: ApiPromise              │
│  ├─ isConnected: boolean         │
│  └─ error: string | null         │
│                                  │
│  Contract Code State             │
│  ├─ solidityCode: string         │
│  ├─ contractName: string         │
│  └─ selectedFeatures: string[]   │
│                                  │
│  Deployment State                │
│  ├─ isDeploying: boolean         │
│  ├─ currentStep: number          │
│  ├─ gasEstimate: string          │
│  ├─ txHash: string | null        │
│  └─ deploymentError: string | null │
│                                  │
│  Deployed Contract State         │
│  ├─ address: string              │
│  ├─ abi: any[]                   │
│  ├─ blockNumber: number          │
│  └─ explorerUrl: string          │
│                                  │
└──────────────────────────────────┘
```

---

## 7. ERROR HANDLING FLOW

```
┌─ Wallet Connection Errors ──────────────┐
│                                         │
│  No extensions found                   │
│  → Show: "Download Wallet" UI          │
│  → Provide download links              │
│                                         │
│  No accounts in wallet                 │
│  → Show: "Import account" instructions │
│                                         │
│  Connection timeout                    │
│  → Retry with exponential backoff      │
│                                         │
└─────────────────────────────────────────┘

┌─ Compilation Errors ────────────────────┐
│                                         │
│  Syntax error in Solidity              │
│  → Show error message with line number │
│  → Suggest fix in code editor          │
│                                         │
│  Missing pragma/contract declaration   │
│  → Show checklist of requirements      │
│                                         │
│  Compiler crash                        │
│  → Fallback to hardcoded template      │
│                                         │
└─────────────────────────────────────────┘

┌─ Deployment Errors ─────────────────────┐
│                                         │
│  Insufficient gas                      │
│  → Suggest increasing gas limit        │
│  → Show cost estimate                  │
│                                         │
│  Network timeout                       │
│  → Retry logic (3 attempts default)    │
│  → Show transaction monitoring link    │
│                                         │
│  User rejects transaction              │
│  → Show friendly message               │
│  → Option to retry                     │
│                                         │
│  Contract already exists               │
│  → Show existing address               │
│  → Ask if user wants new deployment    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 8. FILE DEPENDENCY TREE (Current Implementation)

```
src/
├── main.tsx
│   └─ ThemeProvider (MUI config)
│
├── App.tsx
│
├── pages/
│   └─ HomePage.tsx
│       ├─ usePolkadot()
│       ├─ usePolkadotApi()
│       └─ Step 1-4 navigation
│
├── components/
│   ├─ WalletConnection.tsx
│   │   └─ usePolkadot()
│   │
│   ├─ ContractBuilder.tsx
│   │   ├─ Blockly integration
│   │   ├─ createCustomBlocks()
│   │   ├─ generateSolidityCode()
│   │   └─ generateContractByType()
│   │
│   ├─ DeploymentPanel.tsx
│   │   ├─ validateCode()
│   │   ├─ estimateGas() [MOCK]
│   │   └─ deployContract() [MOCK]
│   │
│   └─ ContractVisualizer.tsx
│
├── hooks/
│   └─ usePolkadot.ts (3 hooks)
│       ├─ usePolkadot()
│       ├─ usePolkadotApi()
│       └─ useTransaction()
│
├── config/
│   └─ polkadot.ts
│       ├─ POLKADOT_CONFIG
│       ├─ BLOCKLY_CONTRACT_CONFIG
│       ├─ APP_MESSAGES
│       └─ UI_CONFIG
│
├── utils/
│   ├─ blocklyConfig.ts
│   │   ├─ createCustomBlocks()
│   │   └─ generateSolidityCode()
│   │
│   ├─ contractTemplates.ts
│   │   ├─ generateTokenContract()
│   │   ├─ generateNFTContract()
│   │   ├─ generateDAOContract()
│   │   └─ generateMarketplaceContract()
│   │
│   ├─ blocklyWizard.ts
│   │   ├─ loadWizardTemplate()
│   │   └─ WIZARD_TEMPLATES[]
│   │
│   └─ deploymentUtils.ts [NEW NEEDED]
│       ├─ compileContract()
│       ├─ deployContractOnChain()
│       ├─ estimateDeploymentGas()
│       ├─ verifyContractDeployment()
│       └─ getContractFromExplorer()
│
└── types/
    └─ index.ts
        ├─ WalletAccount
        ├─ GeneratedContract
        ├─ DeployedContract
        └─ ContractTemplate
```

---

## 9. NETWORK INTERACTION DIAGRAM

```
                   USER'S BROWSER
                        |
        ┌───────────────┼───────────────┐
        |               |               |
        v               v               v
   
  ┌──────────┐   ┌──────────────┐   ┌─────────────┐
  │ Talisman │   │ Polkadot.js  │   │  SubWallet  │
  │ Extension│   │ Extension    │   │ Extension   │
  └────┬─────┘   └──────┬───────┘   └────┬────────┘
       |                |                 |
       └────────────────┼─────────────────┘
                        |
                   [IPC Bridge]
                        |
        ┌───────────────┼───────────────┐
        |               |               |
        v               v               v
        
  ┌────────────────────────────────────────┐
  │  Tralala Contracts dApp                 │
  │  (usePolkadot, usePolkadotApi)         │
  └────────┬─────────────────────┬─────────┘
           |                     |
    [web3 methods]      [Polkadot.js API]
           |                     |
   ┌───────┴──────┐         ┌────┴─────────┐
   │              │         │              │
   v              v         v              v
   
 web3Enable  web3FromSource WsProvider ApiPromise
 web3Accounts web3SignRaw   (WSS)      (Runtime API)
   │              │         │              │
   └──────────────┼─────────┼──────────────┘
                  │         │
        ┌─────────┴─────────┴─────────┐
        │                             │
        v                             v
   
  ┌──────────────────┐    ┌──────────────────────────┐
  │ Chain Data       │    │ Contract Deployment      │
  │ - Accounts       │    │ - Instantiate contract   │
  │ - Metadata       │    │ - Sign transaction       │
  │ - State queries  │    │ - Monitor events         │
  │ - Block info     │    │ - Extract contract addr  │
  └────────┬─────────┘    └────────┬─────────────────┘
           │                       │
           └───────────┬───────────┘
                       |
           ┌───────────v────────────┐
           │  Polkadot Hub TestNet  │
           │  (Paseo Testnet Node)  │
           │                        │
           │  Chain ID: 420420422   │
           │  RPC: 5000             │
           │  WSS: 443              │
           └───────────┬────────────┘
                       |
           ┌───────────v────────────┐
           │  Block Explorer        │
           │  (Blockscout)          │
           │                        │
           │  Verify contracts      │
           │  View transactions     │
           │  Query contract state  │
           └────────────────────────┘
```

---

## 10. TESTING COVERAGE MAP

```
┌─────────────────────────────────────────────────────────┐
│                  TEST COVERAGE                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Unit Tests (needed)                                   │
│  ├─ compileContract() - Solidity compilation           │
│  ├─ estimateDeploymentGas() - Gas calculation          │
│  ├─ verifyContractDeployment() - Chain queries         │
│  └─ Error handling - All edge cases                    │
│                                                          │
│  Integration Tests (needed)                            │
│  ├─ Wallet connection → code generation               │
│  ├─ Code generation → deployment                       │
│  ├─ Deployment → contract verification                │
│  └─ Error recovery flows                               │
│                                                          │
│  E2E Tests (Playwright - basic setup exists)           │
│  ├─ Complete user journey with mock deployment         │
│  ├─ Wallet connection → visualization                  │
│  └─ Error scenarios                                    │
│                                                          │
│  Manual Testing Checklist                              │
│  ├─ Talisman wallet integration                        │
│  ├─ Polkadot.js extension integration                  │
│  ├─ SubWallet integration                              │
│  ├─ Real contract deployment to Paseo                  │
│  ├─ Multiple deployments in sequence                   │
│  ├─ Network failure recovery                           │
│  └─ User rejection scenarios                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**This document provides a comprehensive visual reference for understanding the Tralala Contracts architecture and data flows.**

