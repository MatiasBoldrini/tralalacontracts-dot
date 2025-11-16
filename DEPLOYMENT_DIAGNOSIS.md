# Diagnóstico de Deployment en Paseo Testnet

## 🔴 Problema Identificado

**Paseo Testnet NO soporta el pallet de contratos (`pallet-contracts`)**

Paseo es la relay chain testnet de Polkadot, y las relay chains **no ejecutan smart contracts directamente**.

---

## 📊 Flujo de Deployment Actual (y dónde falla)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario diseña contrato en Blockly                          │
│    ✅ ÉXITO                                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Código Solidity generado                                    │
│    ✅ ÉXITO                                                     │
│    - src/utils/blocklyConfig.ts genera código                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Compilación local (simulada)                                │
│    ✅ ÉXITO                                                     │
│    - deploymentUtils.ts → compileContract()                    │
│    - Genera bytecode y ABI                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Conexión a Paseo Testnet                                    │
│    ⚠️  PARCIAL                                                  │
│    - Endpoint primario falla: Dwellir                          │
│    - Fallback exitoso: wss://paseo.rpc.amforc.com:443         │
│    - usePolkadotApi() conecta correctamente                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Intento de deployment con pallet de contratos               │
│    ❌ FALLA AQUÍ                                                │
│                                                                 │
│    Código en useContractDeployment() línea 354:                │
│    api.tx.contracts.instantiate(...)                           │
│                                                                 │
│    ERROR: "Pallet de contratos no disponible en esta red"      │
│                                                                 │
│    RAZÓN: Paseo NO tiene api.tx.contracts                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                        💥 FIN
```

---

## 🧩 Arquitectura de Polkadot (explicación simple)

```
┌──────────────────────────────────────────────────────────────────┐
│                    ECOSISTEMA POLKADOT                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         RELAY CHAIN (Polkadot/Paseo)                   │    │
│  │                                                         │    │
│  │  - Coordina seguridad                                  │    │
│  │  - NO ejecuta smart contracts                          │    │
│  │  - Solo maneja staking, governance, XCM                │    │
│  │                                                         │    │
│  │  🔴 Paseo está AQUÍ (relay chain testnet)              │    │
│  │  🔴 NO tiene api.tx.contracts                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│              ┌───────────────┴───────────────┐                  │
│              │                               │                  │
│  ┌───────────▼──────────┐      ┌────────────▼──────────┐       │
│  │    PARACHAIN 1       │      │    PARACHAIN 2        │       │
│  │  (Astar/Shibuya)     │      │  (Contracts Chain)    │       │
│  │                      │      │                       │       │
│  │  ✅ SOPORTA          │      │  ✅ SOPORTA           │       │
│  │  api.tx.contracts    │      │  api.tx.contracts     │       │
│  │                      │      │                       │       │
│  │  Aquí SÍ puedes      │      │  Testnet específica   │       │
│  │  desplegar contratos │      │  para contratos       │       │
│  └──────────────────────┘      └───────────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Código Donde Ocurre el Error

### Ubicación: `src/hooks/usePolkadot.ts:354`

```typescript
// Este código FALLA en Paseo
const deployTx = api.tx.contracts.instantiate(
  0,                              // value
  gasLimitBigInt,                 // gas_limit
  null,                           // storage_deposit_limit
  compilationResult.bytecode,     // code
  [],                             // constructor args
  []                              // salt
)
```

**¿Por qué falla?**
- `api.tx.contracts` no existe en Paseo
- Paseo relay chain no tiene el pallet `pallet-contracts` instalado
- Solo las parachains con soporte de contratos tienen este pallet

### Verificación en el código: `src/components/DeploymentPanel.tsx:115`

```typescript
// Esta validación detecta el problema
if (!api.tx.contracts) {
  throw new Error('❌ Pallet de contratos no disponible en esta red')
}
```

---

## ✅ Soluciones Posibles

### Opción 1: Usar Rococo Contracts Parachain (Recomendado)

**Testnet oficial para contratos en Polkadot**

```typescript
// src/config/polkadot.ts - CAMBIAR A:

export const POLKADOT_CONFIG = {
  network: {
    name: 'Contracts on Rococo',
    chainId: '0',
    wsUrl: 'wss://rococo-contracts-rpc.polkadot.io',
    wsUrlFallbacks: [
      'wss://contracts-rococo.api.onfinality.io/public-ws',
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
  // ... resto de config
}
```

**Ventajas:**
- ✅ Testnet oficial de Polkadot
- ✅ Diseñada específicamente para contratos
- ✅ Tiene `api.tx.contracts` disponible
- ✅ Faucet oficial para tokens de prueba

---

### Opción 2: Usar Shibuya (Astar Testnet)

**Testnet de la parachain Astar (multi-VM: EVM + WASM)**

```typescript
export const POLKADOT_CONFIG = {
  network: {
    name: 'Shibuya Testnet',
    chainId: '81',
    wsUrl: 'wss://shibuya-rpc.dwellir.com',
    wsUrlFallbacks: [
      'wss://shibuya.public.blastapi.io',
      'wss://rpc.shibuya.astar.network',
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
}
```

**Ventajas:**
- ✅ Soporta contratos WASM (ink!) y EVM
- ✅ Red más estable que Rococo
- ✅ Preparada para producción
- ✅ Documentación extensa

---

### Opción 3: Dual Network Support

Mantener compatibilidad con múltiples redes:

```typescript
// src/config/polkadot.ts

export const SUPPORTED_NETWORKS = {
  rococo_contracts: {
    name: 'Contracts on Rococo',
    wsUrl: 'wss://rococo-contracts-rpc.polkadot.io',
    hasContractsPallet: true,
  },
  shibuya: {
    name: 'Shibuya (Astar)',
    wsUrl: 'wss://shibuya-rpc.dwellir.com',
    hasContractsPallet: true,
  },
  paseo: {
    name: 'Paseo Testnet',
    wsUrl: 'wss://paseo.rpc.amforc.com:443',
    hasContractsPallet: false, // ⚠️ NO soporta contratos
  },
}

// Permitir al usuario seleccionar la red
export const DEFAULT_NETWORK = 'rococo_contracts'
```

---

## 📝 Checklist para Implementar la Solución

### [ ] 1. Actualizar configuración de red
- Archivo: `src/config/polkadot.ts`
- Cambiar de Paseo a Rococo Contracts o Shibuya
- Actualizar URLs de RPC, explorador y faucet

### [ ] 2. Verificar pallet de contratos
- Añadir validación en `usePolkadotApi()`
- Mostrar advertencia si la red no soporta contratos

### [ ] 3. Actualizar UI
- `WalletConnection.tsx` - Mostrar red actual
- `DeploymentPanel.tsx` - Validar antes de deployment
- Mensajes de error más claros

### [ ] 4. Testing
- Probar conexión a nueva red
- Verificar `api.tx.contracts` disponible
- Desplegar contrato de prueba

### [ ] 5. Documentación
- Actualizar `CLAUDE.md` con nueva red
- Documentar por qué no usar Paseo
- Añadir guía de faucet para nueva red

---

## 🎯 Recomendación Final

**USAR ROCOCO CONTRACTS PARACHAIN** como red por defecto porque:

1. ✅ Es la testnet oficial de Polkadot para contratos
2. ✅ Tiene `pallet-contracts` habilitado
3. ✅ Documentación oficial completa
4. ✅ Faucet gratuito y accesible
5. ✅ Compatible con ink! (smart contracts nativos de Polkadot)

---

## 🐛 Debugging: Cómo Verificar si una Red Soporta Contratos

```javascript
// Ejecutar en consola del navegador cuando la app esté conectada:

// 1. Verificar si el pallet existe
console.log('Contratos disponible?', !!window.api?.tx?.contracts)

// 2. Listar todos los pallets disponibles
console.log('Pallets:', Object.keys(window.api?.tx || {}))

// 3. Ver métodos del pallet de contratos (si existe)
console.log('Métodos:', Object.keys(window.api?.tx?.contracts || {}))
```

Si `api.tx.contracts` es `undefined`, la red NO soporta contratos.

---

## 📚 Referencias Útiles

- [Polkadot Wiki - Parachains](https://wiki.polkadot.network/docs/learn-parachains)
- [Substrate Contracts Pallet Docs](https://docs.substrate.io/reference/frame-pallets/#contracts)
- [ink! Documentation](https://use.ink/)
- [Rococo Contracts Network Info](https://contracts-rococo.subscan.io/)
- [Astar/Shibuya Docs](https://docs.astar.network/)
