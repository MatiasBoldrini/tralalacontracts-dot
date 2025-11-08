# 🎵 Tralala Contracts

Una plataforma visual e intuitiva para crear contratos inteligentes en la red de Polkadot usando bloques tipo Blockly. Desarrollado para el hackathon LATIN HACK 2024.

## ✅ Cumple con las Reglas del Hackathon

- **Red**: Despliegue en testnet Paseo de Polkadot
- **Lenguaje**: Solidity ^0.8.28
- **Página /test**: Interfaz obligatoria para probar contratos
- **Integración completa**: Smart contracts como parte central de la solución
- **Steppers clickeables**: Navegación intuitiva entre pasos
- **Diseño visual con Blockly**: Creación de contratos arrastrando bloques

## 🚀 Características Principales

### 🧩 Diseño Visual con Blockly
- **Workspace interactivo**: Arrastra y conecta bloques para crear contratos
- **Bloques especializados**: Tokens, NFTs, Votación, Marketplace
- **Generación automática**: Código Solidity generado en tiempo real
- **Plantillas predefinidas**: Contratos listos para usar

### 🔗 Integración Polkadot Completa
- **Testnet Paseo**: Despliegue directo en la red de prueba
- **Wallets soportados**: Talisman, Polkadot.js, SubWallet
- **Configuración automática**: Red configurada correctamente
- **Explorer integrado**: Enlaces directos al block explorer

### 📱 Interfaz Moderna
- **Steppers clickeables**: Navegación intuitiva entre pasos
- **Diseño responsivo**: Funciona en desktop y móvil
- **Animaciones suaves**: Experiencia de usuario fluida
- **Tema personalizado**: Colores y estilos únicos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **UI**: Material-UI + Framer Motion
- **Blockchain**: Polkadot.js + Blockly
- **Build**: Vite
- **Styling**: Emotion (CSS-in-JS)

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd tralalacontracts-dot

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu clave privada

# Ejecutar en desarrollo
npm run dev
```

## 🎯 Uso

### 1. Conectar Wallet
- Selecciona tu wallet preferido (Talisman recomendado)
- Conecta tu cuenta de la testnet Paseo
- Verifica que estés en la red correcta

### 2. Diseñar Contrato
- **Selección de funcionalidades**: Elige entre Token, NFT, Votación, Marketplace
- **Workspace visual**: Arrastra bloques para crear la lógica
- **Código generado**: Ve el código Solidity en tiempo real
- **Vista previa**: Revisa tu contrato antes del deploy

### 3. Desplegar
- **Configuración automática**: Red y gas configurados
- **Deploy seguro**: Transacciones firmadas con tu wallet
- **Verificación**: Contrato verificado en el explorer

### 4. Probar (Página /test)
- **Funciones de escritura**: Ejecuta funciones que modifican el estado
- **Visualización de lectura**: Ve datos actuales del contrato
- **Transacciones**: Hash de transacciones y eventos
- **Enlaces útiles**: Block explorer y documentación

## 🌐 Configuración de Red

### Testnet Paseo (Polkadot Hub)
- **Nombre**: Polkadot Hub TestNet
- **Chain ID**: 420420422 (0x1911f0a6)
- **RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io
- **WebSocket**: wss://testnet-passet-hub-rpc.polkadot.io
- **Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io
- **Faucet**: https://faucet.polkadot.io/?parachain=1111

## 📋 Plantillas de Contratos

### Token ERC20
- Funciones estándar: transfer, approve, mint, burn
- Control de acceso: onlyOwner modifier
- Eventos: Transfer, Approval
- Cumple estándar ERC20

### NFT Collection
- Minting de NFTs únicos
- Transferencia entre usuarios
- Metadata personalizable
- Estructura básica ERC721

### Sistema de Votación
- Creación de propuestas
- Votación por miembros
- Ejecución de propuestas
- Control de acceso

### Marketplace
- Listado de items
- Compra/venta segura
- Comisiones de plataforma
- Gestión de inventario

## 🔧 Desarrollo

### Estructura del Proyecto
```
src/
├── components/          # Componentes React
│   ├── ContractBuilder.tsx    # Constructor visual con Blockly
│   ├── TestPage.tsx           # Página de pruebas obligatoria
│   ├── WalletConnection.tsx   # Conexión de wallet
│   ├── DeploymentPanel.tsx    # Panel de despliegue
│   ├── ContractVisualizer.tsx # Visualizador de contratos
│   └── ...
├── utils/              # Utilidades
│   ├── blocklyConfig.ts       # Configuración Blockly
│   ├── contractTemplates.ts   # Plantillas de contratos
│   └── ...
├── hooks/              # Hooks personalizados
├── types/              # Definiciones TypeScript
└── config/             # Configuraciones
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter
npm run type-check   # Verificación de tipos
```

## 🎨 Personalización

### Temas
Los colores y estilos se pueden personalizar en `src/config/polkadot.ts`:
```typescript
export const UI_CONFIG = {
  theme: {
    primary: '#6366f1',
    secondary: '#ec4899',
    // ...
  }
}
```

### Bloques Personalizados
Añade nuevos bloques en `src/utils/blocklyConfig.ts`:
```typescript
export const CUSTOM_BLOCKS = {
  mi_bloque: {
    type: 'mi_bloque',
    message: 'Mi Bloque %1',
    // ...
  }
}
```

## 🚀 Deploy en Producción

### Vercel (Recomendado)
```bash
npm run build
# Subir a Vercel
```

### Netlify
```bash
npm run build
# Subir carpeta dist/ a Netlify
```

### Docker
```bash
docker build -t tralala-contracts .
docker run -p 3000:3000 tralala-contracts
```

## 📚 Documentación Adicional

- [Polkadot Documentation](https://docs.polkadot.network/)
- [Blockly Documentation](https://developers.google.com/blockly)
- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://react.dev/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🏆 Hackathon LATIN HACK 2024

Desarrollado para el hackathon LATIN HACK 2024, cumpliendo con todos los requisitos:
- ✅ Smart contracts en testnet Paseo
- ✅ Solidity ^0.8.28
- ✅ Página /test obligatoria
- ✅ Integración completa con Polkadot
- ✅ Interfaz visual con Blockly
- ✅ Steppers clickeables
- ✅ Documentación completa

---

**¡Crea contratos inteligentes en Polkadot sin escribir código!** 🚀