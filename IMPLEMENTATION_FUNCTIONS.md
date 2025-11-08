# Key Functions to Implement - Detailed Guide

## Overview

This document provides detailed function signatures, pseudocode, and implementation guidance for all functions needed to move from mock to real deployment.

---

## PRIORITY 1: CRITICAL FUNCTIONS (Required for MVP)

### 1. `compileContract(solidityCode: string): Promise<CompilationResult>`

**Purpose**: Compile Solidity source code to bytecode and ABI

**Location**: `src/utils/deploymentUtils.ts` (NEW FILE)

**Type Signature**:
```typescript
interface CompilationResult {
  success: boolean
  bytecode: string         // 0x-prefixed hex string
  abi: any[]              // JSON ABI
  error?: string          // Error message if compilation fails
}

export async function compileContract(
  solidityCode: string
): Promise<CompilationResult>
```

**Implementation Guide**:

```typescript
import solc from 'solc'

export async function compileContract(solidityCode: string): Promise<CompilationResult> {
  try {
    // Step 1: Prepare compiler input
    const input = {
      language: 'Solidity',
      sources: {
        'Contract.sol': {
          content: solidityCode
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.bytecode.object']
          }
        }
      }
    }

    // Step 2: Compile
    const compilationOutput = JSON.parse(
      solc.compile(JSON.stringify(input))
    )

    // Step 3: Check for compilation errors
    if (compilationOutput.errors && compilationOutput.errors.length > 0) {
      const errors = compilationOutput.errors
        .filter((e: any) => e.severity === 'error')
      
      if (errors.length > 0) {
        return {
          success: false,
          bytecode: '',
          abi: [],
          error: errors.map((e: any) => e.message).join('\n')
        }
      }
    }

    // Step 4: Extract contract data
    const contracts = compilationOutput.contracts['Contract.sol']
    if (!contracts) {
      return {
        success: false,
        bytecode: '',
        abi: [],
        error: 'No contracts found in compilation output'
      }
    }

    // Get first contract (main contract)
    const contractName = Object.keys(contracts)[0]
    const contract = contracts[contractName]
    
    if (!contract) {
      return {
        success: false,
        bytecode: '',
        abi: [],
        error: 'Contract compilation produced no output'
      }
    }

    // Step 5: Return results
    const bytecode = '0x' + contract.evm.bytecode.object

    return {
      success: true,
      bytecode,
      abi: contract.abi || [],
      error: undefined
    }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      bytecode: '',
      abi: [],
      error: `Compilation failed: ${errorMsg}`
    }
  }
}
```

**Installation Required**:
```bash
npm install solc
```

**Testing**:
```typescript
// Test with simple token contract
const code = `
pragma solidity ^0.8.28;
contract TestToken {
  string public name = "Test";
  mapping(address => uint256) public balances;
}
`

const result = await compileContract(code)
console.assert(result.success, 'Should compile successfully')
console.assert(result.bytecode.startsWith('0x'), 'Bytecode should be hex')
console.assert(result.abi.length > 0, 'Should have ABI')
```

---

### 2. `deployContractOnChain(api, account, bytecode, abi, gasLimit, signer): Promise<DeploymentResult>`

**Purpose**: Deploy compiled contract to Polkadot testnet

**Location**: `src/utils/deploymentUtils.ts`

**Type Signature**:
```typescript
interface DeploymentResult {
  success: boolean
  contractAddress?: string  // SS58 format address
  transactionHash?: string  // Extrinsic hash
  blockNumber?: number
  abi: any[]
  explorerUrl?: string
  error?: string
}

export async function deployContractOnChain(
  api: ApiPromise,
  account: WalletAccount,
  bytecode: string,
  abi: any[],
  gasLimit: string,
  signer: Signer
): Promise<DeploymentResult>
```

**Implementation Guide**:

```typescript
import { ApiPromise } from '@polkadot/api'
import { Signer } from '@polkadot/api/types'
import { WalletAccount } from '../types'
import { POLKADOT_CONFIG } from '../config/polkadot'

export async function deployContractOnChain(
  api: ApiPromise,
  account: WalletAccount,
  bytecode: string,
  abi: any[],
  gasLimit: string,
  signer: Signer
): Promise<DeploymentResult> {
  
  return new Promise((resolve) => {
    try {
      // Step 1: Create contract instantiation extrinsic
      // This is the transaction that will deploy the contract
      const contractCreationTx = api.tx.contracts.instantiate(
        0,                      // value: Don't transfer DOT to contract
        gasLimit,              // gasLimit: Gas allowed for instantiation
        null,                  // storageDepositLimit: Will be calculated
        bytecode,              // code: The compiled bytecode
        [],                    // data: Constructor parameters (empty for basic contracts)
        []                     // salt: For deterministic addresses (empty = random)
      )

      console.log('Contract creation transaction created')
      console.log('Gas limit:', gasLimit)
      console.log('Bytecode length:', bytecode.length)

      // Step 2: Track deployment state
      let contractAddress: string | null = null
      let transactionHash: string | null = null
      let blockNumber: number | null = null
      let deploymentError: string | null = null

      // Step 3: Sign and send transaction
      contractCreationTx.signAndSend(
        account.address,
        { signer },
        ({ status, events, dispatchError }) => {
          
          // Step 4: Monitor transaction status
          if (dispatchError) {
            console.error('Dispatch error:', dispatchError.toString())
            deploymentError = dispatchError.toString()
            return
          }

          if (status.isInBlock) {
            // Transaction included in block
            transactionHash = status.asInBlock.toString()
            console.log('Transaction in block:', transactionHash)

            // Step 5: Parse events for contract address
            events.forEach(({ event, phase }) => {
              console.log('Event:', event.method, 'Phase:', phase.toString())

              // Look for Instantiated event from contracts pallet
              if (api.events.contracts.Instantiated.is(event)) {
                const [codeHash, contractAddressValue] = event.data
                contractAddress = contractAddressValue.toString()
                console.log('Contract deployed at:', contractAddress)
              }

              // Also check for successful dispatch
              if (api.events.system.ExtrinsicSuccess.is(event)) {
                console.log('Extrinsic succeeded')
              }
            })
          }

          if (status.isFinalized) {
            // Transaction is finalized
            blockNumber = status.asFinalized.toString()
            console.log('Transaction finalized at block:', blockNumber)

            // Resolve with results
            if (contractAddress) {
              resolve({
                success: true,
                contractAddress,
                transactionHash: transactionHash || undefined,
                blockNumber: parseInt(blockNumber as any) || undefined,
                abi,
                explorerUrl: `${POLKADOT_CONFIG.network.explorerUrl}/address/${contractAddress}`,
                error: deploymentError || undefined
              })
            } else if (deploymentError) {
              resolve({
                success: false,
                abi,
                error: deploymentError
              })
            } else {
              resolve({
                success: false,
                abi,
                error: 'Deployment completed but contract address not found in events'
              })
            }
          }
        }
      ).catch((err) => {
        console.error('Error during deployment:', err)
        resolve({
          success: false,
          abi,
          error: err instanceof Error ? err.message : String(err)
        })
      })

    } catch (err) {
      console.error('Error creating deployment transaction:', err)
      resolve({
        success: false,
        abi,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  })
}
```

**Key Points**:
- The `api.tx.contracts.instantiate()` method is specific to Polkadot's contracts pallet
- Events are parsed to extract the deployed contract address
- Both `isInBlock` and `isFinalized` are monitored for best UX
- Error handling must catch dispatch errors and network timeouts

**Testing Considerations**:
- Requires real testnet (Paseo) or local node
- Needs testnet DOT for gas fees
- Takes 5-30 seconds per deployment
- Should test error cases (insufficient gas, network failure)

---

### 3. `estimateDeploymentGas(api, bytecode): Promise<string>`

**Purpose**: Get actual gas estimate from network instead of formula

**Location**: `src/utils/deploymentUtils.ts`

**Type Signature**:
```typescript
export async function estimateDeploymentGas(
  api: ApiPromise,
  bytecode: string
): Promise<string>
```

**Implementation Guide**:

```typescript
export async function estimateDeploymentGas(
  api: ApiPromise,
  bytecode: string
): Promise<string> {
  
  try {
    // The Polkadot contracts pallet provides gas estimation
    // However, the exact API varies by runtime version
    
    // Attempt 1: Use contractsApi.estimateGas if available
    if (api.call.contractsApi?.estimateGas) {
      try {
        const result = await api.call.contractsApi.estimateGas(
          'Alice', // This is overridden - doesn't matter
          {
            InstantiateWithCode: {
              code: bytecode,
              data: [],
              salt: []
            }
          },
          0,      // value
          null    // storageDepositLimit
        )
        
        return result.gasRequired?.toString() || '5000000'
      } catch (err) {
        console.warn('contractsApi.estimateGas failed:', err)
      }
    }

    // Attempt 2: Fallback calculation
    // Bytecode size impacts gas usage
    // General formula: 200k base + (bytecode_length * 100) + storage overhead
    const baseCost = 200000
    const bytecodeCost = bytecode.length * 100
    const storageCost = 1000000 // Storage deposit for contract state
    
    const estimated = baseCost + bytecodeCost + storageCost
    
    console.log('Using estimated gas:', estimated)
    return estimated.toString()

  } catch (err) {
    console.error('Error estimating gas:', err)
    // Return default safe value
    return '5000000'
  }
}
```

**Important Notes**:
- The `contractsApi` RPC method may not be available on all testnets
- Fallback calculation is approximate but safe
- Real deployment may use slightly different amounts
- Storage deposit is the main cost for contract instantiation

---

## PRIORITY 2: IMPORTANT FUNCTIONS (Enhanced UX & Reliability)

### 4. `verifyContractDeployment(api, contractAddress): Promise<boolean>`

**Purpose**: Confirm contract exists on chain after deployment

**Location**: `src/utils/deploymentUtils.ts`

**Type Signature**:
```typescript
export async function verifyContractDeployment(
  api: ApiPromise,
  contractAddress: string
): Promise<boolean>
```

**Implementation Guide**:

```typescript
export async function verifyContractDeployment(
  api: ApiPromise,
  contractAddress: string
): Promise<boolean> {
  
  try {
    // Query the contracts pallet for contract info
    const contractInfo = await api.query.contracts.contractInfoOf(contractAddress)
    
    // If contractInfo is Some (exists), return true
    return contractInfo.isSome
    
  } catch (err) {
    console.error('Error verifying contract:', err)
    return false
  }
}
```

**When to Use**:
- After deployment finalization
- To confirm contract address is correct
- To wait for finality before showing success UI

---

### 5. Enhanced `useTransaction()` Hook

**Location**: `src/hooks/usePolkadot.ts`

**Current Status**: Basic generic implementation

**Enhancements Needed**:

```typescript
interface UseTransactionReturn {
  isLoading: boolean
  error: string | null
  txHash: string | null
  contractAddress: string | null      // NEW
  blockNumber: number | null          // NEW
  sendContractDeploymentTransaction(
    api: ApiPromise,
    account: WalletAccount,
    bytecode: string,
    abi: any[],
    gasLimit: string
  ): Promise<DeploymentResult>        // NEW
  // Existing methods
  sendTransaction: (...) => Promise<any>
  reset: () => void
}

export const useTransaction = () => {
  // ... existing code ...
  
  // ADD: Contract-specific transaction handler
  const sendContractDeploymentTransaction = useCallback(async (
    api: ApiPromise,
    account: WalletAccount,
    bytecode: string,
    abi: any[],
    gasLimit: string
  ): Promise<DeploymentResult> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { web3FromSource } = await import('@polkadot/extension-dapp')
      const injector = await web3FromSource(account.meta.source)
      const signer = injector.signer
      
      // Use the new deployContractOnChain function
      const result = await deployContractOnChain(
        api,
        account,
        bytecode,
        abi,
        gasLimit,
        signer
      )
      
      if (result.contractAddress) {
        // Store in state
        // setContractAddress(result.contractAddress) - hypothetical state
      }
      
      setIsLoading(false)
      return result
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(errorMsg)
      setIsLoading(false)
      throw err
    }
  }, [])
  
  return {
    isLoading,
    error,
    txHash,
    contractAddress: null,           // TODO: Add state management
    blockNumber: null,               // TODO: Add state management
    sendTransaction,
    sendContractDeploymentTransaction, // NEW
    reset
  }
}
```

---

## PRIORITY 3: NICE-TO-HAVE FUNCTIONS

### 6. `getContractFromExplorer(contractAddress): Promise<ExplorerData>`

**Purpose**: Retrieve contract details from block explorer

**Location**: `src/utils/deploymentUtils.ts`

```typescript
interface ExplorerData {
  address: string
  name?: string
  symbol?: string
  abi?: any[]
  sourceCode?: string
  contractCreator?: string
  transactionHash?: string
}

export async function getContractFromExplorer(
  contractAddress: string
): Promise<ExplorerData | null> {
  
  const explorerUrl = 'https://blockscout-passet-hub.parity-testnet.parity.io/api'
  
  try {
    const response = await fetch(
      `${explorerUrl}?module=contract&action=getsourcecode&address=${contractAddress}`
    )
    
    const data = await response.json()
    
    if (data.status === '1' && data.result && data.result[0]) {
      const contract = data.result[0]
      
      return {
        address: contractAddress,
        name: contract.ContractName,
        sourceCode: contract.SourceCode,
        abi: contract.ABI ? JSON.parse(contract.ABI) : undefined,
        contractCreator: contract.Creator,
        transactionHash: contract.TransactionHash
      }
    }
    
    return null
    
  } catch (err) {
    console.error('Error fetching from explorer:', err)
    return null
  }
}
```

**Note**: This is optional as the dApp already generates explorer URLs.

---

### 7. `retryDeployment(deploymentFn, maxRetries = 3): Promise<DeploymentResult>`

**Purpose**: Implement retry logic for failed deployments

**Location**: `src/utils/deploymentUtils.ts`

```typescript
export async function retryDeployment(
  deploymentFn: () => Promise<DeploymentResult>,
  maxRetries: number = 3
): Promise<DeploymentResult> {
  
  let lastError: DeploymentResult | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Deployment attempt ${attempt}/${maxRetries}`)
      
      const result = await deploymentFn()
      
      if (result.success) {
        console.log('Deployment successful')
        return result
      }
      
      lastError = result
      console.warn(`Attempt ${attempt} failed:`, result.error)
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
    } catch (err) {
      console.error(`Attempt ${attempt} error:`, err)
      lastError = {
        success: false,
        abi: [],
        error: err instanceof Error ? err.message : String(err)
      }
    }
  }
  
  return lastError || {
    success: false,
    abi: [],
    error: 'All deployment attempts failed'
  }
}
```

---

## INTEGRATION CHECKLIST

### Step 1: Create New File
- [ ] Create `/src/utils/deploymentUtils.ts`
- [ ] Add all 7 functions above

### Step 2: Update Dependencies
- [ ] Run `npm install solc`
- [ ] Verify in package.json

### Step 3: Update DeploymentPanel Component

**Changes needed in `src/components/DeploymentPanel.tsx`**:

```typescript
// Add imports
import { usePolkadotApi, useTransaction } from '../hooks/usePolkadot'
import {
  compileContract,
  estimateDeploymentGas,
  verifyContractDeployment,
  retryDeployment
} from '../utils/deploymentUtils'

// In component:
const { api, isConnected: apiConnected } = usePolkadotApi()
const { sendContractDeploymentTransaction } = useTransaction()

// Replace deployContract() method with:
const deployContract = async (): Promise<boolean> => {
  if (!account || !api) return false
  
  try {
    // Step 1: Compile contract (was: validate code)
    setCurrentStep(1)
    const compilation = await compileContract(contractCode)
    if (!compilation.success) {
      setDeploymentError(`Compilation failed: ${compilation.error}`)
      return false
    }
    
    // Step 2: Estimate gas (now real, was: mock)
    setCurrentStep(2)
    const gasLimit = await estimateDeploymentGas(api, compilation.bytecode)
    setGasEstimate(gasLimit)
    
    // Step 3: Sign transaction (now real, was: simulated)
    setCurrentStep(3)
    // This happens in Step 4, signing is automatic
    
    // Step 4: Deploy to blockchain
    setCurrentStep(4)
    const result = await retryDeployment(async () => {
      return await sendContractDeploymentTransaction(
        api,
        account,
        compilation.bytecode,
        compilation.abi,
        gasLimit
      )
    })
    
    if (!result.success) {
      setDeploymentError(result.error || 'Deployment failed')
      return false
    }
    
    // Step 5: Verify deployment
    setCurrentStep(5)
    if (result.contractAddress) {
      const verified = await verifyContractDeployment(
        api,
        result.contractAddress
      )
      console.log('Contract verified:', verified)
    }
    
    return true
    
  } catch (err) {
    setDeploymentError(err instanceof Error ? err.message : String(err))
    return false
  }
}
```

### Step 4: Update Types
- [ ] Add `DeploymentResult` interface to `src/types/index.ts`
- [ ] Add `CompilationResult` interface

### Step 5: Test
- [ ] Test wallet connection
- [ ] Test contract compilation
- [ ] Test real deployment to testnet
- [ ] Test error scenarios
- [ ] Test retry logic

---

## DEPENDENCY INSTALLATION

```bash
# Install Solidity compiler
npm install solc

# Verify installation
npm list solc
```

---

## COMMON ERRORS & FIXES

### "solc is not defined"
**Cause**: Module not installed
**Fix**: `npm install solc`

### "api.tx.contracts is undefined"
**Cause**: Connected to wrong network or old Polkadot runtime
**Fix**: Verify WebSocket URL in config points to Paseo testnet

### "Contract address not found in events"
**Cause**: Event parsing failed or wrong event type
**Fix**: Check event structure from Polkadot.js documentation

### "Insufficient gas"
**Cause**: Gas estimate too low
**Fix**: Increase multiplier in estimateDeploymentGas fallback

### "User rejected transaction"
**Cause**: User clicked "Reject" in wallet popup
**Fix**: This is expected - show user-friendly retry UI

---

## TESTING EXAMPLES

```typescript
// Unit test template
import { compileContract } from '../src/utils/deploymentUtils'

describe('compileContract', () => {
  it('should compile valid Solidity code', async () => {
    const code = `
      pragma solidity ^0.8.28;
      contract Test {
        uint public x = 1;
      }
    `
    
    const result = await compileContract(code)
    
    expect(result.success).toBe(true)
    expect(result.bytecode).toMatch(/^0x[0-9a-f]+$/)
    expect(result.abi).toBeDefined()
  })
  
  it('should fail on invalid code', async () => {
    const code = 'invalid solidity'
    const result = await compileContract(code)
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```

---

**Implementation Guide Complete**

