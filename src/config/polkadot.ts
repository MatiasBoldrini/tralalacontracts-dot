// Configuración de Asset Hub en Paseo (Red de Polkadot para crear Tokens y NFTs)
// Asset Hub soporta el pallet de assets para crear tokens nativamente
export const POLKADOT_CONFIG = {
  network: {
    name: 'Asset Hub Paseo',
    chainId: '1000', // Asset Hub parachain ID
    // Endpoints de Asset Hub en Paseo testnet
    rpcUrl: 'https://sys.ibp.network/asset-hub-paseo',
    wsUrl: 'wss://sys.ibp.network/asset-hub-paseo',
    // Endpoints alternativos para fallback
    wsUrlFallbacks: [
      'wss://sys.ibp.network/asset-hub-paseo',
    ],
    rpcUrlFallbacks: [
      'https://paseo-asset-hub-rpc.polkadot.io',
    ],
    explorerUrl: 'https://assethub-paseo.subscan.io',
    faucetUrl: 'https://faucet.polkadot.io/',
    isTestnet: true,
    nativeCurrency: {
      name: 'PAS',
      symbol: 'PAS',
      decimals: 12,
    },
  },
  
  // Configuración de wallets soportados
  supportedWallets: [
    {
      id: 'subwallet',
      name: 'SubWallet',
      description: 'Wallet multi-cadena para Polkadot',
      icon: '🔐',
      recommended: true,
      downloadUrl: 'https://subwallet.app/',
    },
  ],

  // Configuración de deployment
  deployment: {
    gasLimit: 5000000,
    gasPrice: '1000000000', // 1 Gwei
    timeout: 300000, // 5 minutos
    retries: 3,
  },

  // URLs útiles
  urls: {
    documentation: 'https://docs.polkadot.network/',
    github: 'https://github.com/polkadot-js',
    discord: 'https://discord.gg/polkadot',
    twitter: 'https://twitter.com/polkadot',
  },
}

// Configuración de Blockly específica para contratos
export const BLOCKLY_CONTRACT_CONFIG = {
  // Categorías de bloques disponibles
  categories: [
    {
      name: 'Control',
      color: '#5C81A6',
      blocks: ['controls_if', 'controls_repeat_ext', 'controls_whileUntil'],
    },
    {
      name: 'Lógica',
      color: '#5C81A6',
      blocks: ['logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean'],
    },
    {
      name: 'Matemáticas',
      color: '#5C81A6',
      blocks: ['math_number', 'math_arithmetic', 'math_single', 'math_trig'],
    },
    {
      name: 'Texto',
      color: '#5C81A6',
      blocks: ['text', 'text_length', 'text_join', 'text_append'],
    },
    {
      name: 'Tokens',
      color: '#4CAF50',
      blocks: ['token_create', 'token_mint', 'token_transfer', 'token_approve'],
    },
    {
      name: 'NFTs',
      color: '#9C27B0',
      blocks: ['nft_create', 'nft_mint', 'nft_transfer', 'nft_approve'],
    },
    {
      name: 'Votación',
      color: '#FF9800',
      blocks: ['proposal_create', 'vote_cast', 'proposal_execute', 'proposal_cancel'],
    },
    {
      name: 'Marketplace',
      color: '#2196F3',
      blocks: ['item_list', 'item_buy', 'item_cancel', 'item_update'],
    },
  ],

  // Configuración de generación de código
  codeGeneration: {
    language: 'solidity',
    version: '^0.8.28',
    license: 'MIT',
    pragma: 'SPDX-License-Identifier: MIT',
  },
}

// Mensajes y textos de la aplicación
export const APP_MESSAGES = {
  welcome: {
    title: 'Tralala Contracts',
    subtitle: 'Crea contratos inteligentes en Polkadot de forma visual y sencilla',
    description: 'No necesitas experiencia en programación. Solo arrastra bloques y crea tu contrato.',
  },
  
  steps: {
    wallet: {
      title: 'Conecta tu Wallet',
      description: 'Para crear y desplegar contratos inteligentes, necesitas conectar tu wallet de Polkadot.',
    },
    builder: {
      title: 'Diseña tu Contrato',
      description: 'Selecciona las funcionalidades que quieres incluir y arrastra bloques para crear tu contrato.',
    },
    deploy: {
      title: 'Despliega tu Contrato',
      description: 'Despliega tu contrato en la red de prueba de Polkadot de forma segura.',
    },
    visualize: {
      title: 'Explora tu Contrato',
      description: 'Visualiza tu contrato desplegado y obtén enlaces útiles para interactuar con él.',
    },
  },

  errors: {
    noWallet: 'No se encontraron wallets instalados',
    noAccounts: 'No se encontraron cuentas en el wallet',
    connectionFailed: 'Error al conectar con el wallet',
    deploymentFailed: 'Error durante el deployment del contrato',
    codeGenerationFailed: 'Error al generar el código del contrato',
  },

  success: {
    walletConnected: '¡Wallet conectado exitosamente!',
    contractGenerated: '¡Código generado exitosamente!',
    contractDeployed: '¡Contrato desplegado exitosamente!',
  },
}

// Configuración de la interfaz de usuario
export const UI_CONFIG = {
  theme: {
    primary: '#6366f1',
    secondary: '#ec4899',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  animations: {
    duration: 0.3,
    easing: 'ease-in-out',
  },
  
  layout: {
    maxWidth: '1200px',
    padding: '2rem',
    borderRadius: '12px',
  },
}













