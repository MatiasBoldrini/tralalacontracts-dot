# Complete Fix Summary: Polkadot Weight v2 + Code Generation

## Issues Found & Fixed

### Issue 1: Weight v2 Format Error ❌→✅
**Problem:** Contract deployment failed with error:
```
Cannot decode value "203000" (typeof bigint), expected an input object, map or array
```

**Root Cause:** Using single `BigInt` for gas instead of Weight v2 format with `refTime` and `proofSize`.

**Files Fixed:**
- `src/utils/deploymentUtils.ts` - Line 260-311
- `src/hooks/usePolkadot.ts` - Line 351-373

**Changes:**
```typescript
// BEFORE (WRONG)
const tx = api.tx.contracts.instantiate(
  0,
  BigInt(gasLimit),  // ❌ Single number
  null,
  bytecode,
  []
)

// AFTER (CORRECT)
const weightV2 = api.registry.createType('WeightV2', {
  refTime: new BN(gasLimit).mul(new BN('1000000')),
  proofSize: new BN('1000000')
})

const tx = api.tx.contracts.instantiateWithCode(
  0,
  weightV2,  // ✅ WeightV2 object
  null,
  bytecode,
  new Uint8Array(),
  new Uint8Array()
)
```

---

### Issue 2: Code Not Generating from Templates ❌→✅
**Problem:** When clicking NFT or other templates, the Solidity code was blank, preventing deployment.

**Root Cause:** Two issues:
1. Template ID mapping was incomplete - wizard template IDs weren't directly recognized
2. Code generation only triggered from Blockly workspace changes, not from template selection

**Files Fixed:**
- `src/components/ContractBuilder.tsx` - Line 369-457 and 239-305

**Changes:**

#### Fix 1: Direct Template ID Recognition (Line 380-416)
```typescript
// BEFORE: Only tried feature-to-template mapping
// AFTER: Check if ID is already a wizard template first
const isWizardTemplateId = WIZARD_TEMPLATES.some(t => t.id === featureId)
if (isWizardTemplateId) {
  solidityCode = generateContractByType(featureId, config)  // Use directly
} else {
  // Try feature-to-template mapping
}
```

#### Fix 2: Generate Code When Template Loads (Line 239-305)
```typescript
// BEFORE: Template loaded but no code generation triggered
// AFTER: Generate code immediately after template loads
try {
  const code = generateSolidityCode(workspace.current, template.name)
  onCodeGenerated(code)  // Pass to parent component
} catch (blocklyError) {
  // Fallback: Use template generator directly
  const fallbackCode = generateContractByType(template.id, config)
  onCodeGenerated(fallbackCode)
}
```

---

## Test Checklist

### ✅ Step 1: Connect Wallet
- [x] Open app at http://localhost:3001
- [x] Click "Conectar Wallet"
- [x] Select wallet account
- Expected: Account shows as connected

### ✅ Step 2: Generate Contract Code
**Option A: Using Templates (Recommended)**
1. Click on **NFT Collection** 🖼️ card
2. Switch to "⚙️ Editor Visual" tab
3. **Expected:** See Solidity code in the code preview panel
4. If you see code → ✅ **Code generation is working!**

**Option B: Using Features**
1. Click "Omitir Asistente" (Skip Wizard)
2. Select a feature (NFT, Token, etc.)
3. Drag blocks into the workspace
4. **Expected:** Code auto-generates
5. If you see code → ✅ **Code generation is working!**

### ✅ Step 3: Deploy Contract
1. Click **"Siguiente"** button
2. Deploy button should now be **ENABLED** (not greyed out)
3. Click **"Desplegar en Testnet"**
4. Sign transaction in wallet
5. Monitor progress steps
6. **Expected:** Success dialog with transaction hash

### ✅ Step 4: Verify Deployment
1. In success dialog, click "Ver en Block Explorer"
2. Should open Paseo explorer at `https://paseo.subscan.io/tx/{txHash}`
3. Look for:
   - Status: **Finalized** or **In Block** ✅
   - Events: **Instantiated** event
   - No Weight v2 decoding errors ✅

---

## Files Modified

| File | Change | Why |
|------|--------|-----|
| `src/utils/deploymentUtils.ts` | WeightV2 + instantiateWithCode | Fix Paseo weight format |
| `src/hooks/usePolkadot.ts` | WeightV2 in deployment | Same fix in hook |
| `src/components/ContractBuilder.tsx` | Template code generation + direct ID check | Fix code not generating |

---

## How to Debug If Issues Persist

### Check Console Logs (F12 → Console)

**Should see:**
- ✅ `web3Accounts: Found 1 address`
- ✅ `✅ Conectado exitosamente a: wss://rpc1.paseo.popnetwork.xyz...`
- ✅ `Plantilla "NFT Collection" cargada exitosamente`
- ✅ `✅ Código generado para plantilla "NFT Collection"`

**Should NOT see:**
- ❌ `Cannot decode value...` (Weight v2 error)
- ❌ `Error generando código...` (except warning about Blockly fallback)

### If code still blank:
1. Check console for errors
2. Try manual feature selection + drag blocks
3. If manual works but templates don't, issue is in template loading

### If deploy button still disabled:
Check all conditions:
- `account` exists? (wallet connected)
- `contractCode` exists? (code generated)
- `isApiConnected` true? (connected to Paseo)
- `isDeploying` false? (not already deploying)

Run in console:
```javascript
// Check what's disabling the button
const disabledConditions = {
  isDeploying: false,  // Should be false
  noAccount: !account,  // Should be true (account exists)
  noCode: !contractCode,  // Should be true (code exists)
  notApiConnected: !isApiConnected  // Should be true (connected)
}
console.log('Deploy button disabled because:', disabledConditions)
```

---

## Key Technical Details

### Weight v2 Format
Polkadot Paseo requires:
```typescript
{
  refTime: BN,     // Picoseconds (10^-12 seconds)
  proofSize: BN    // Bytes (storage)
}
```

**Conversion:**
- Gas limit in millions → multiply by 1M for picoseconds
- Example: 100000 gas → 100000 * 1000000 = 100B picoseconds

### Contract Deployment Methods
- `instantiate` - Deploy from code hash (upload separately)
- `instantiateWithCode` - Upload + deploy in one (what we use) ✅

### Network Details
- **Chain:** Pop Network Testnet (on Paseo relay)
- **Endpoint:** wss://rpc1.paseo.popnetwork.xyz
- **Block explorer:** https://paseo.subscan.io
- **Faucet:** https://onboard.popnetwork.xyz
- **Native token:** PAS (12 decimals)
- **Spec version:** 504 (as of 2025-11-15)

---

## Success Indicators

✅ **Working** if you see:
1. Wallet connected with account address
2. API connected to Paseo RPC
3. Code generated when selecting template
4. Deploy button enabled
5. Transaction signed via wallet
6. Success message with tx hash
7. Tx visible on Paseo explorer

---

## Next Steps After Successful Deploy

1. **View Contract:** Use the Block Explorer link
2. **Interact:** Contract functions callable via Polkadot.js Extrinsics
3. **Customize:** Edit the generated code before deploying
4. **Deploy Again:** Try different contract types/templates

---

Generated: 2025-11-15
