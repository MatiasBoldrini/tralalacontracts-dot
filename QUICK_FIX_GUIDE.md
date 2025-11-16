# 🚀 Guía Rápida: Solución al Error de Deployment

## El Problema en 3 Líneas

1. **Paseo = Relay Chain** → NO ejecuta smart contracts
2. **Tu código busca** `api.tx.contracts` → NO existe en Paseo
3. **Necesitas una Parachain** → SÍ ejecuta contratos (Rococo Contracts o Shibuya)

---

## 🎯 Solución Rápida (5 minutos)

### Paso 1: Edita `src/config/polkadot.ts`

**REEMPLAZA** las líneas 2-28 con:

```typescript
export const POLKADOT_CONFIG = {
  network: {
    name: 'Contracts on Rococo',
    chainId: '0',
    // Endpoint principal - Rococo Contracts (parachain oficial de Polkadot)
    rpcUrl: 'https://rococo-contracts-rpc.polkadot.io',
    wsUrl: 'wss://rococo-contracts-rpc.polkadot.io',
    // Endpoints alternativos para fallback
    wsUrlFallbacks: [
      'wss://contracts-rococo.api.onfinality.io/public-ws',
      'wss://rococo-contracts.w3node.com',
    ],
    rpcUrlFallbacks: [
      'https://contracts-rococo.api.onfinality.io/public',
    ],
    explorerUrl: 'https://rococo.subscan.io',
    faucetUrl: 'https://faucet.polkadot.io/',
    isTestnet: true,
    nativeCurrency: {
      name: 'ROC',
      symbol: 'ROC',
      decimals: 12,
    },
  },
```

### Paso 2: Reinicia el servidor de desarrollo

```bash
# Detén el servidor (Ctrl+C)
# Inicia nuevamente
npm run dev
```

### Paso 3: Prueba el deployment

1. Abre `http://localhost:3000`
2. Conecta tu wallet
3. Diseña tu contrato
4. ¡Despliega!

---

## 🧪 Verificación: ¿Cómo Saber si Funcionó?

Después de cambiar la red, abre la consola del navegador (F12) y deberías ver:

```
✅ Conectado exitosamente a: wss://rococo-contracts-rpc.polkadot.io...
```

En lugar de:

```
❌ Pallet de contratos no disponible en esta red
```

---

## 💰 Conseguir Tokens de Prueba

Para desplegar contratos en Rococo necesitas tokens ROC gratuitos:

1. Ve a https://faucet.polkadot.io/
2. Selecciona **"Contracts on Rococo"**
3. Pega tu dirección de wallet
4. Haz clic en "Submit"
5. Espera ~30 segundos para recibir tokens

---

## 📊 Comparación Visual

```
❌ ANTES (Paseo - Relay Chain)
┌──────────────────────────┐
│   Paseo Relay Chain      │
│                          │
│   ❌ NO ejecuta          │
│      smart contracts     │
│                          │
│   ❌ api.tx.contracts    │
│      = undefined         │
└──────────────────────────┘


✅ DESPUÉS (Rococo Contracts - Parachain)
┌──────────────────────────┐
│  Rococo Contracts        │
│  (Parachain)             │
│                          │
│  ✅ Ejecuta contratos    │
│     WASM (ink!)          │
│                          │
│  ✅ api.tx.contracts     │
│     disponible           │
└──────────────────────────┘
```

---

## 🔧 Alternativa: Usar Shibuya (Astar)

Si prefieres una red más estable y con más características:

```typescript
export const POLKADOT_CONFIG = {
  network: {
    name: 'Shibuya Testnet (Astar)',
    chainId: '81',
    rpcUrl: 'https://evm.shibuya.astar.network',
    wsUrl: 'wss://shibuya-rpc.dwellir.com',
    wsUrlFallbacks: [
      'wss://shibuya.public.blastapi.io',
      'wss://rpc.shibuya.astar.network',
    ],
    rpcUrlFallbacks: [
      'https://shibuya.public.blastapi.io',
    ],
    explorerUrl: 'https://shibuya.subscan.io',
    faucetUrl: 'https://portal.astar.network/#/shibuya-testnet/assets',
    isTestnet: true,
    nativeCurrency: {
      name: 'SBY',
      symbol: 'SBY',
      decimals: 18,
    },
  },
```

**Ventajas de Shibuya:**
- ✅ Más estable que Rococo
- ✅ Soporta EVM + WASM
- ✅ Mayor documentación
- ✅ Faucet siempre disponible

---

## ❓ FAQ

### ¿Por qué Paseo no funciona?
Paseo es una **relay chain**, no una **parachain**. Las relay chains coordinan seguridad pero NO ejecutan contratos. Solo las parachains pueden ejecutar lógica de aplicación como smart contracts.

### ¿Qué cambia en mi código?
**Nada.** Solo cambias la configuración de red. El resto del código (`useContractDeployment`, `DeploymentPanel`, etc.) funciona igual.

### ¿Puedo soportar múltiples redes?
Sí, pero necesitarías:
1. Un selector de red en la UI
2. Validación de qué redes soportan contratos
3. Mensajes de error claros

### ¿Esto funcionará en producción (mainnet)?
Para mainnet necesitarías usar:
- **Astar** (parachain principal con contratos)
- **Moonbeam** (EVM-compatible)
- Otras parachains con `pallet-contracts`

---

## 🎓 Conceptos Clave

### Relay Chain vs Parachain

| Característica | Relay Chain | Parachain |
|---|---|---|
| Ejecuta contratos | ❌ No | ✅ Sí |
| Ejemplo testnet | Paseo | Rococo Contracts, Shibuya |
| `api.tx.contracts` | ❌ Undefined | ✅ Disponible |
| Propósito | Coordinar seguridad | Ejecutar apps/contratos |

### Dónde Está el Error en el Código

**Archivo:** `src/components/DeploymentPanel.tsx:114-117`

```typescript
if (!api.tx || !api.tx.contracts) {
  console.error('❌ Pallet de contratos no disponible en esta red')
  return // 👈 SE DETIENE AQUÍ CON PASEO
}
```

Esta validación **funciona correctamente**. El problema no es el código, es la **red seleccionada**.

---

## ✅ Checklist Post-Solución

Después de aplicar el fix, verifica:

- [ ] Consola muestra: "Conectado exitosamente a wss://rococo-contracts..."
- [ ] No hay error: "Pallet de contratos no disponible"
- [ ] Puedes ver tu wallet conectada
- [ ] El botón "Deploy" está habilitado
- [ ] Tienes tokens ROC en tu wallet (usa el faucet)
- [ ] El deployment se completa exitosamente

---

## 📞 Siguiente Paso

Si después de cambiar a Rococo Contracts **todavía tienes problemas**:

1. Verifica que tu wallet tenga tokens ROC
2. Revisa la consola del navegador para errores
3. Asegúrate de que el endpoint de Rococo Contracts esté disponible
4. Prueba con uno de los endpoints de fallback

---

## 🎉 Resumen

| Problema | Solución |
|---|---|
| Red actual | Paseo (relay chain sin contratos) |
| Red correcta | Rococo Contracts (parachain con contratos) |
| Cambio necesario | `src/config/polkadot.ts` líneas 2-28 |
| Tiempo estimado | 5 minutos |
| Cambios en código | Solo configuración, 0 cambios en lógica |
