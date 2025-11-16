# Polkadot Paseo Weight v2 Implementation Fix Guide

## Problem Summary

Your contract deployment was failing with this error:

```
failed on gas_limit: {"refTime":"Compact<u64>","proofSize":"Compact<u64>"}::
Struct: Cannot decode value "203000" (typeof bigint), expected an input object, map or array
```

This occurs because **modern Polkadot chains (including Paseo testnet) use Weight v2 format**, which requires both `refTime` and `proofSize` values, not a single gas number.

---

## Key Changes Made

### 1. Fixed `buildDeploymentTransaction` in `src/utils/deploymentUtils.ts`

**BEFORE (Incorrect):**
```typescript
const tx = api.tx.contracts.instantiate(
  0,                  // value
  BigInt(gasLimit),   // ❌ Single number - fails
  null,               // storage_deposit_limit
  bytecode,           // ❌ Wrong method for bytecode
  [],                 // data
)
```

**AFTER (Correct):**
```typescript
const { BN } = require('@polkadot/util')

// Create Weight v2 object
const weightV2 = api.registry.createType('WeightV2', {
  refTime: new BN(gasLimitNumber.toString()).mul(new BN('1000000')), // picoseconds
  proofSize: new BN('1000000') // 1 MB max storage
})

// Use instantiateWithCode for bytecode deployment
const tx = api.tx.contracts.instantiateWithCode(
  0,          // value
  weightV2,   // ✅ WeightV2 object with refTime + proofSize
  null,       // storage_deposit_limit
  bytecode,   // ✅ Bytecode in instantiateWithCode
  new Uint8Array(), // constructor data
  new Uint8Array()  // salt
)
```

### 2. Fixed `useContractDeployment` in `src/hooks/usePolkadot.ts`

Same Weight v2 fix applied in the deployment hook (lines 352-373).

---

## Understanding Weight v2

Weight v2 is Polkadot's 2D weight system:

```typescript
{
  refTime: BN,    // Reference time in picoseconds (computational cost)
  proofSize: BN   // Proof size in bytes (storage cost)
}
```

### Quick Reference Values

| Metric | Typical Value | Purpose |
|--------|--------------|---------|
| `refTime` | 100,000,000,000 (100B) | ~1-10 second execution |
| `proofSize` | 1,000,000 (1M) | ~1 MB storage read limit |

### Creating WeightV2

```typescript
// Method 1: Direct creation
const weight = api.registry.createType('WeightV2', {
  refTime: new BN('100000000000'),
  proofSize: new BN('1000000')
})

// Method 2: From system constants
const maxWeight = api.consts.system.blockWeights.maxBlock
const weight = api.registry.createType('WeightV2', {
  refTime: maxWeight.refTime.toBn(),
  proofSize: maxWeight.proofSize.toBn()
})

// Method 3: Unlimited (for dry-runs only)
const unlimitedWeight = api.registry.createType('WeightV2', {
  refTime: new BN(-1),
  proofSize: new BN(-1)
})
```

---

## Paseo Network Configuration

Your network config in `src/config/polkadot.ts` is correct:

```typescript
export const POLKADOT_CONFIG = {
  network: {
    name: 'Pop Network Testnet',
    wsUrl: 'wss://rpc1.paseo.popnetwork.xyz',
    wsUrlFallbacks: [
      'wss://rpc2.paseo.popnetwork.xyz',
      'wss://rpc1.paseo.popnetwork.xyz'
    ],
    nativeCurrency: {
      name: 'PAS',
      symbol: 'PAS',
      decimals: 12,  // ✅ Correct - 12 decimals for Paseo
    },
  },
}
```

---

## Testing Your Fix

### 1. Test Transaction Building

```typescript
import { buildDeploymentTransaction } from './utils/deploymentUtils'

const testTx = buildDeploymentTransaction(
  api,
  wasmBytecode,
  contractABI,
  '100000',  // gas limit
  '1'        // gas price (ignored in Polkadot)
)

// Should not throw Weight v2 encoding errors
```

### 2. Expected Behavior After Fix

When you deploy the NFT template:

1. ✅ Transaction builds without Weight v2 errors
2. ✅ Wallet extension prompts for signature
3. ✅ Transaction submits to Paseo testnet
4. ✅ Contract deployed at transaction hash
5. ✅ Explorer link: `https://paseo.subscan.io/tx/{txHash}`

---

## Gas/Weight Estimation Best Practices

### For Polkadot Contracts:

```typescript
// Instead of hardcoding gas like Ethereum:
// ❌ DON'T: api.tx.something(1000000) // gas in wei

// DO:
const weight = api.registry.createType('WeightV2', {
  refTime: new BN('100000000000'),    // ~100 billion picoseconds
  proofSize: new BN('1000000')        // ~1 MB storage
})

// For accurate estimation (best practice):
const { gasRequired } = await api.call.contractsApi.instantiate(
  account.address,
  0,                              // value
  { refTime: -1, proofSize: -1 }, // unlimited for dry-run
  null,
  { Upload: wasm },
  data,
  salt
)

// Use with 10-20% buffer:
const actualWeight = api.registry.createType('WeightV2', {
  refTime: gasRequired.refTime.muln(1.1),
  proofSize: gasRequired.proofSize.muln(1.1)
})
```

---

## Common Errors & Solutions

### Error: "Cannot decode value... expected an input object"

**Cause:** Passing `BigInt` instead of `WeightV2` object

**Solution:**
```typescript
// ❌ Wrong
BigInt(gasLimit)

// ✅ Correct
api.registry.createType('WeightV2', {
  refTime: new BN(gasLimit).mul(new BN('1000000')),
  proofSize: new BN('1000000')
})
```

### Error: "instantiate: Failed decoding contracts.instantiate"

**Cause:** Wrong parameter order or types

**Solution:** Use `instantiateWithCode` for bytecode:
```typescript
// ❌ Wrong parameter order
api.tx.contracts.instantiate(value, gasLimit, null, bytecode, [])

// ✅ Correct
api.tx.contracts.instantiateWithCode(
  value,              // Balance to transfer
  weightV2,           // WeightV2
  null,               // storageDepositLimit
  bytecode,           // WASM code
  new Uint8Array(),   // constructor data
  new Uint8Array()    // salt
)
```

### Error: "Invalid WASM bytecode"

**Cause:** Bytecode format wrong

**Solution:** Ensure bytecode is:
- Valid hex string starting with `0x`
- Valid WASM format (ink! or solc-compiled)
- Not base64 encoded

```typescript
// ✅ Valid bytecode format
const bytecode = '0x' + hexString
const isValid = /^0x[0-9a-f]*$/i.test(bytecode)
```

---

## Next Steps

1. **Test with NFT template** - Try deploying again with updated code
2. **Monitor logs** - Check browser console for any remaining Weight v2 errors
3. **Verify block explorer** - Once deployed, check `https://paseo.subscan.io`
4. **Get test tokens** - If needed: `https://onboard.popnetwork.xyz/`

---

## Reference Links

- **Polkadot Weight System**: https://wiki.polkadot.network/docs/learn-weight
- **Paseo Network**: https://paseo.popnetwork.xyz
- **Pop Network Docs**: https://pop.network
- **Polkadot.js API**: https://polkadot.js.org/docs/api/
- **Block Explorer**: https://paseo.subscan.io

---

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `src/utils/deploymentUtils.ts` | Changed `BigInt(gasLimit)` to `WeightV2` object | Paseo requires Weight v2 format |
| `src/utils/deploymentUtils.ts` | Changed `instantiate` to `instantiateWithCode` | Correct method for bytecode deployment |
| `src/hooks/usePolkadot.ts` | Same Weight v2 + method changes | Consistency across deployment code |

Your implementation now matches modern Polkadot (2024+) standards!
