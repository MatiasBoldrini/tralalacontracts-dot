# Quick Test Guide - NFT Deployment on Paseo

## 🚀 Super Quick Start (5 minutes)

### 1️⃣ Start the Dev Server
```bash
npm run dev
# Opens at http://localhost:3001 (or 3000/3002 if port taken)
```

### 2️⃣ Connect Your Wallet
- Click **"Conectar Wallet"**
- Select your Polkadot account
- See: ✅ Connected account address

### 3️⃣ Load NFT Template
- You should see **4 template cards** (Token, NFT, DAO, Marketplace)
- Click **"NFT Collection"** 🖼️
- Wait 2 seconds for Blockly to load

### 4️⃣ Check Code Generated
- Click **"⚙️ Editor Visual"** tab
- Scroll down to see the Solidity code
- **Expected:** Full contract code starting with `pragma solidity ^0.8.28`

#### ✅ Success Indicators:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NFTCollection {
    string public name = "NFT Collection";
    string public symbol = "NFT";

    function mint(address to, string memory _tokenURI) public onlyOwner returns (uint256) {
        // ...
    }
    // More functions...
}
```

### 5️⃣ Deploy to Testnet
- Click **"Siguiente"** (Next button)
- Verify: Deploy button is **NOT greyed out** ✅
- Click **"Desplegar en Testnet"**
- Your wallet will prompt for signature
- Sign the transaction

### 6️⃣ Wait for Success
- Monitor the **6-step progress bar**
- Each step should complete:
  1. ✅ Validar código
  2. ✅ Compilar contrato
  3. ✅ Estimar gas
  4. ✅ Firmar transacción
  5. ✅ Enviar a blockchain
  6. ✅ Confirmar deployment

### 7️⃣ Verify on Explorer
- Success dialog appears with transaction hash
- Click **"Ver en Block Explorer"**
- Should open: `https://paseo.subscan.io/tx/{txHash}`
- Look for:
  - Status: **Finalized** ✅
  - Events: **Instantiated**
  - No errors ✅

---

## 🐛 Troubleshooting

### Problem: No code appears in Editor Visual tab
**Solutions:**
1. Hard refresh: `Ctrl+Shift+R` (Cmd+Shift+R on Mac)
2. Check browser console: `F12` → `Console` tab
3. Look for errors starting with "Error generating code"
4. If you see "Blockly fallback", it's using template generator ✅ (still works)

### Problem: Deploy button is greyed out
**Check these in browser console:**
```javascript
// One of these must be true:
- Account connected? ✅
- Code generated? ✅
- API connected to Paseo? ✅
- Not already deploying? ✅
```

### Problem: Weight v2 Error in Console
**Old error (should be fixed):**
```
Cannot decode value "203000" (typeof bigint),
expected an input object, map or array
```
**If you see this:**
- Hard refresh the page
- Rebuild: `npm run build`
- Restart dev server: `npm run dev`

### Problem: Transaction fails with "Code hash not found"
**This is OK** - It means you need the contract code uploaded first. The fix handles this:
- Using `instantiateWithCode` (upload + deploy in one) ✅
- Not `instantiate` (which requires pre-uploaded code)

---

## 📊 What's Actually Happening

```
1. Select NFT Template
        ↓
2. Blockly loads with NFT blocks
        ↓
3. Code Generator (contractTemplates.ts) creates Solidity
   OR if Blockly fails, uses template fallback
        ↓
4. Code passed to onCodeGenerated callback
        ↓
5. Parent component (HomePage) receives code
        ↓
6. Deploy button enables when code + wallet + API all present
        ↓
7. Click Deploy → buildDeploymentTransaction creates WeightV2
        ↓
8. api.tx.contracts.instantiateWithCode(
     value: 0,
     gasLimit: WeightV2 { refTime, proofSize },  ← FIX: Was BigInt
     storageDepositLimit: null,
     code: bytecode,
     data: Uint8Array(),
     salt: Uint8Array()
   )
        ↓
9. Wallet signs, blockchain validates Weight v2 ✅
        ↓
10. Contract deployed on Paseo!
```

---

## 🧪 Test Different Templates

After NFT works, try:
- **Token** 💰 - Create ERC20-like token
- **DAO** 🗳️ - Governance with voting
- **Marketplace** 🛍️ - Buy/sell system

Each should follow the same flow:
1. Click template
2. See code in Editor
3. Deploy to testnet
4. Verify on explorer

---

## 💡 Pro Tips

### Get Test Tokens
If you need more PAS tokens:
```
1. Visit: https://onboard.popnetwork.xyz
2. Click "Get Some PASs"
3. Sign with your wallet
4. Tokens sent instantly
```

### Check Deployment History
Your deployed contracts show in block explorer:
```
https://paseo.subscan.io/account/{yourAddress}
```

### Customize Before Deploy
Before clicking deploy, you can:
1. Edit the generated code
2. Change contract name
3. Add custom functions
4. Modify gas limit

### Monitor Gas Usage
The gas estimate is shown before signing:
- Base gas: ~100,000
- Per function: ~50,000
- Per event: ~10,000

Actual on-chain may vary slightly due to state changes.

---

## ✅ Completion Checklist

- [ ] Dev server running on localhost:3001
- [ ] Wallet connected with 1+ account
- [ ] API connected to Paseo (console shows checkmark)
- [ ] NFT template shows code in Editor
- [ ] Deploy button is enabled (not greyed)
- [ ] Transaction signed in wallet
- [ ] Success dialog shows tx hash
- [ ] Paseo explorer confirms deployment
- [ ] No Weight v2 encoding errors

**If all ✅ = You're done! 🎉**

---

## Questions?

Check these files:
- **Weight v2 details:** `POLKADOT_PASEO_FIX_GUIDE.md`
- **All changes made:** `FINAL_FIXES_SUMMARY.md`
- **Architecture overview:** `CLAUDE.md`

Generated: 2025-11-15
