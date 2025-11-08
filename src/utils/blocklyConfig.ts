import * as Blockly from 'blockly'
import { sanitizeContractName } from './contractTemplates'

// Función auxiliar para obtener valores de bloques de forma segura
const getBlockValue = (block: any, fieldName: string, defaultValue: string = ''): string => {
  try {
    const field = block.getField(fieldName)
    return field ? field.getValue() : defaultValue
  } catch (error) {
    console.error(`Error getting field ${fieldName}:`, error)
    return defaultValue
  }
}

// Configuración personalizada de Blockly para contratos inteligentes
export const BLOCKLY_CONFIG = {
  grid: {
    spacing: 20,
    length: 3,
    colour: '#ccc',
    snap: true,
  },
  zoom: {
    controls: true,
    wheel: true,
    startScale: 1.0,
    maxScale: 3,
    minScale: 0.3,
    scaleSpeed: 1.2,
  },
  toolbox: {
    kind: 'categoryToolbox',
    contents: [
      // Bloques de control básicos
      {
        kind: 'category',
        name: 'Control',
        colour: '#5C81A6',
        contents: [
          {
            kind: 'block',
            type: 'controls_if',
          },
          {
            kind: 'block',
            type: 'controls_repeat_ext',
          },
          {
            kind: 'block',
            type: 'logic_compare',
          },
        ],
      },
      // Bloques de lógica
      {
        kind: 'category',
        name: 'Lógica',
        colour: '#5C81A6',
        contents: [
          {
            kind: 'block',
            type: 'logic_operation',
          },
          {
            kind: 'block',
            type: 'logic_negate',
          },
          {
            kind: 'block',
            type: 'logic_boolean',
          },
        ],
      },
      // Bloques matemáticos
      {
        kind: 'category',
        name: 'Matemáticas',
        colour: '#5C81A6',
        contents: [
          {
            kind: 'block',
            type: 'math_number',
          },
          {
            kind: 'block',
            type: 'math_arithmetic',
          },
          {
            kind: 'block',
            type: 'math_single',
          },
        ],
      },
      // Bloques de texto
      {
        kind: 'category',
        name: 'Texto',
        colour: '#5C81A6',
        contents: [
          {
            kind: 'block',
            type: 'text',
          },
          {
            kind: 'block',
            type: 'text_length',
          },
          {
            kind: 'block',
            type: 'text_join',
          },
        ],
      },
    ],
  },
}

// Definiciones de bloques personalizados para contratos
export const CUSTOM_BLOCKS = {
  // Bloques básicos de contrato
  contract_start: {
    type: 'contract_start',
    message: 'Iniciar Contrato',
    args: [],
    colour: '#FF6B35',
    tooltip: 'Inicia la definición de un contrato inteligente',
    helpUrl: '',
  },
  
  variable_declare: {
    type: 'variable_declare',
    message: 'Declarar variable %1 de tipo %2',
    args: [
      { type: 'field_input', name: 'NAME', text: 'miVariable' },
      { 
        type: 'field_dropdown', 
        name: 'TYPE', 
        options: [
          ['uint256', 'uint256'],
          ['address', 'address'],
          ['string', 'string'],
          ['bool', 'bool'],
          ['mapping', 'mapping']
        ]
      }
    ],
    colour: '#4A90E2',
    tooltip: 'Declara una nueva variable en el contrato',
    helpUrl: '',
  },

  function_public: {
    type: 'function_public',
    message: 'Función pública %1',
    args: [
      { type: 'field_input', name: 'NAME', text: 'miFuncion' }
    ],
    colour: '#7ED321',
    tooltip: 'Define una función pública',
    helpUrl: '',
  },

  function_private: {
    type: 'function_private',
    message: 'Función privada %1',
    args: [
      { type: 'field_input', name: 'NAME', text: 'miFuncion' }
    ],
    colour: '#F5A623',
    tooltip: 'Define una función privada',
    helpUrl: '',
  },

  modifier_onlyowner: {
    type: 'modifier_onlyowner',
    message: 'Solo el propietario puede ejecutar',
    args: [],
    colour: '#D0021B',
    tooltip: 'Modificador que restringe acceso al propietario del contrato',
    helpUrl: '',
  },

  require_statement: {
    type: 'require_statement',
    message: 'Verificar que %1',
    args: [
      { type: 'input_value', name: 'CONDITION', check: 'Boolean' }
    ],
    colour: '#9013FE',
    tooltip: 'Verifica una condición, si es falsa revierte la transacción',
    helpUrl: '',
  },

  emit_event: {
    type: 'emit_event',
    message: 'Emitir evento %1',
    args: [
      { type: 'field_input', name: 'EVENT_NAME', text: 'MiEvento' }
    ],
    colour: '#50E3C2',
    tooltip: 'Emite un evento del contrato',
    helpUrl: '',
  },

  // Bloques para tokens
  token_create: {
    type: 'token_create',
    message: 'Crear Token %1 %2',
    args: [
      { type: 'field_input', name: 'NAME', text: 'MiToken' },
      { type: 'field_input', name: 'SYMBOL', text: 'MTK' },
    ],
    colour: '#4CAF50',
    tooltip: 'Crea un nuevo token ERC20',
    helpUrl: '',
  },
  token_mint: {
    type: 'token_mint',
    message: 'Acuñar %1 tokens para %2',
    args: [
      { type: 'input_value', name: 'AMOUNT', check: 'Number' },
      { type: 'input_value', name: 'TO', check: 'String' },
    ],
    colour: '#4CAF50',
    tooltip: 'Acuña nuevos tokens para una dirección',
    helpUrl: '',
  },
  token_transfer: {
    type: 'token_transfer',
    message: 'Transferir %1 tokens a %2',
    args: [
      { type: 'input_value', name: 'AMOUNT', check: 'Number' },
      { type: 'input_value', name: 'TO', check: 'String' },
    ],
    colour: '#4CAF50',
    tooltip: 'Transfiere tokens a otra dirección',
    helpUrl: '',
  },

  // Bloques para NFTs
  nft_create: {
    type: 'nft_create',
    message: 'Crear NFT %1 %2',
    args: [
      { type: 'field_input', name: 'NAME', text: 'MiNFT' },
      { type: 'field_input', name: 'SYMBOL', text: 'MNF' },
    ],
    colour: '#9C27B0',
    tooltip: 'Crea una nueva colección NFT',
    helpUrl: '',
  },
  nft_mint: {
    type: 'nft_mint',
    message: 'Acuñar NFT #%1 para %2',
    args: [
      { type: 'input_value', name: 'TOKEN_ID', check: 'Number' },
      { type: 'input_value', name: 'TO', check: 'String' },
    ],
    colour: '#9C27B0',
    tooltip: 'Acuña un nuevo NFT con ID específico',
    helpUrl: '',
  },

  // Bloques para votación
  proposal_create: {
    type: 'proposal_create',
    message: 'Crear Propuesta: %1',
    args: [
      { type: 'field_input', name: 'DESCRIPTION', text: 'Nueva propuesta' },
    ],
    colour: '#FF9800',
    tooltip: 'Crea una nueva propuesta de votación',
    helpUrl: '',
  },
  vote_cast: {
    type: 'vote_cast',
    message: 'Votar %1 en propuesta %2',
    args: [
      { 
        type: 'field_dropdown', 
        name: 'VOTE', 
        options: [
          ['Sí', 'yes'],
          ['No', 'no'],
          ['Abstención', 'abstain']
        ]
      },
      { type: 'input_value', name: 'PROPOSAL_ID', check: 'Number' },
    ],
    colour: '#FF9800',
    tooltip: 'Emite un voto en una propuesta',
    helpUrl: '',
  },

  // Bloques para marketplace
  item_list: {
    type: 'item_list',
    message: 'Listar item %1 por %2 tokens',
    args: [
      { type: 'input_value', name: 'ITEM_ID', check: 'Number' },
      { type: 'input_value', name: 'PRICE', check: 'Number' },
    ],
    colour: '#2196F3',
    tooltip: 'Lista un item en el marketplace',
    helpUrl: '',
  },
  item_buy: {
    type: 'item_buy',
    message: 'Comprar item %1',
    args: [
      { type: 'input_value', name: 'ITEM_ID', check: 'Number' },
    ],
    colour: '#2196F3',
    tooltip: 'Compra un item del marketplace',
    helpUrl: '',
  },

  // Más operaciones de tokens
  token_burn: {
    type: 'token_burn',
    message: 'Quemar %1 tokens',
    args: [
      { type: 'input_value', name: 'AMOUNT', check: 'Number' },
    ],
    colour: '#4CAF50',
    tooltip: 'Elimina tokens del suministro total',
    helpUrl: '',
  },

  token_approve: {
    type: 'token_approve',
    message: 'Autorizar a %1 gastar %2 tokens',
    args: [
      { type: 'input_value', name: 'SPENDER', check: 'String' },
      { type: 'input_value', name: 'AMOUNT', check: 'Number' },
    ],
    colour: '#4CAF50',
    tooltip: 'Autoriza a una dirección a gastar tokens en tu nombre',
    helpUrl: '',
  },

  token_balance: {
    type: 'token_balance',
    message: 'Obtener balance de %1',
    args: [
      { type: 'input_value', name: 'ADDRESS', check: 'String' },
    ],
    colour: '#4CAF50',
    tooltip: 'Obtiene el saldo de tokens de una dirección',
    helpUrl: '',
  },

  // Más operaciones de NFTs
  nft_burn: {
    type: 'nft_burn',
    message: 'Quemar NFT #%1',
    args: [
      { type: 'input_value', name: 'TOKEN_ID', check: 'Number' },
    ],
    colour: '#9C27B0',
    tooltip: 'Elimina un NFT de la colección',
    helpUrl: '',
  },

  nft_transfer: {
    type: 'nft_transfer',
    message: 'Transferir NFT #%1 a %2',
    args: [
      { type: 'input_value', name: 'TOKEN_ID', check: 'Number' },
      { type: 'input_value', name: 'TO', check: 'String' },
    ],
    colour: '#9C27B0',
    tooltip: 'Transfiere la propiedad de un NFT',
    helpUrl: '',
  },

  nft_uri: {
    type: 'nft_uri',
    message: 'Obtener URI de NFT #%1',
    args: [
      { type: 'input_value', name: 'TOKEN_ID', check: 'Number' },
    ],
    colour: '#9C27B0',
    tooltip: 'Obtiene la URI de metadatos de un NFT',
    helpUrl: '',
  },

  // Operaciones de staking
  staking_stake: {
    type: 'staking_stake',
    message: 'Depositar %1 tokens en staking',
    args: [
      { type: 'input_value', name: 'AMOUNT', check: 'Number' },
    ],
    colour: '#FF5722',
    tooltip: 'Bloquea tokens para ganar recompensas',
    helpUrl: '',
  },

  staking_unstake: {
    type: 'staking_unstake',
    message: 'Retirar %1 tokens del staking',
    args: [
      { type: 'input_value', name: 'AMOUNT', check: 'Number' },
    ],
    colour: '#FF5722',
    tooltip: 'Desbloquea tokens del staking',
    helpUrl: '',
  },

  staking_claim: {
    type: 'staking_claim',
    message: 'Reclamar recompensas de staking',
    args: [],
    colour: '#FF5722',
    tooltip: 'Reclama las recompensas ganadas por staking',
    helpUrl: '',
  },

  // Control de acceso
  access_set_owner: {
    type: 'access_set_owner',
    message: 'Establecer propietario a %1',
    args: [
      { type: 'input_value', name: 'NEW_OWNER', check: 'String' },
    ],
    colour: '#D0021B',
    tooltip: 'Transfiere la propiedad del contrato',
    helpUrl: '',
  },

  access_grant_role: {
    type: 'access_grant_role',
    message: 'Otorgar rol %1 a %2',
    args: [
      { type: 'field_input', name: 'ROLE', text: 'ADMIN' },
      { type: 'input_value', name: 'ACCOUNT', check: 'String' },
    ],
    colour: '#D0021B',
    tooltip: 'Asigna un rol a una dirección',
    helpUrl: '',
  },

  access_revoke_role: {
    type: 'access_revoke_role',
    message: 'Revocar rol %1 de %2',
    args: [
      { type: 'field_input', name: 'ROLE', text: 'ADMIN' },
      { type: 'input_value', name: 'ACCOUNT', check: 'String' },
    ],
    colour: '#D0021B',
    tooltip: 'Remueve un rol de una dirección',
    helpUrl: '',
  },

  // Gobernanza adicional
  proposal_execute: {
    type: 'proposal_execute',
    message: 'Ejecutar propuesta %1',
    args: [
      { type: 'input_value', name: 'PROPOSAL_ID', check: 'Number' },
    ],
    colour: '#FF9800',
    tooltip: 'Ejecuta una propuesta aprobada',
    helpUrl: '',
  },

  proposal_cancel: {
    type: 'proposal_cancel',
    message: 'Cancelar propuesta %1',
    args: [
      { type: 'input_value', name: 'PROPOSAL_ID', check: 'Number' },
    ],
    colour: '#FF9800',
    tooltip: 'Cancela una propuesta pendiente',
    helpUrl: '',
  },

  // Marketplace adicional
  item_cancel: {
    type: 'item_cancel',
    message: 'Cancelar anuncio de item %1',
    args: [
      { type: 'input_value', name: 'ITEM_ID', check: 'Number' },
    ],
    colour: '#2196F3',
    tooltip: 'Retira un item de la venta',
    helpUrl: '',
  },

  item_update_price: {
    type: 'item_update_price',
    message: 'Actualizar precio de item %1 a %2',
    args: [
      { type: 'input_value', name: 'ITEM_ID', check: 'Number' },
      { type: 'input_value', name: 'NEW_PRICE', check: 'Number' },
    ],
    colour: '#2196F3',
    tooltip: 'Cambia el precio de un item listado',
    helpUrl: '',
  },

  // Operaciones de registro/logging
  log_event: {
    type: 'log_event',
    message: 'Registrar evento: %1',
    args: [
      { type: 'field_input', name: 'MESSAGE', text: 'Evento importante' },
    ],
    colour: '#00BCD4',
    tooltip: 'Emite un evento de registro personalizado',
    helpUrl: '',
  },

  // Operaciones de pagos
  send_payment: {
    type: 'send_payment',
    message: 'Enviar %1 a %2',
    args: [
      { type: 'input_value', name: 'AMOUNT', check: 'Number' },
      { type: 'input_value', name: 'RECIPIENT', check: 'String' },
    ],
    colour: '#673AB7',
    tooltip: 'Envía fondos a una dirección',
    helpUrl: '',
  },

  get_balance: {
    type: 'get_balance',
    message: 'Obtener balance del contrato',
    args: [],
    colour: '#673AB7',
    tooltip: 'Devuelve el saldo de fondos del contrato',
    helpUrl: '',
  },

  // Operaciones de tiempo
  timestamp: {
    type: 'timestamp',
    message: 'Timestamp actual (bloque)',
    args: [],
    colour: '#795548',
    tooltip: 'Obtiene la marca de tiempo del bloque actual',
    helpUrl: '',
  },

  time_locked: {
    type: 'time_locked',
    message: 'Bloquear por %1 segundos',
    args: [
      { type: 'input_value', name: 'DURATION', check: 'Number' },
    ],
    colour: '#795548',
    tooltip: 'Crea un bloqueo de tiempo para una acción',
    helpUrl: '',
  },

  // Operaciones matemáticas seguras
  safe_add: {
    type: 'safe_add',
    message: 'Sumar seguro: %1 + %2',
    args: [
      { type: 'input_value', name: 'A', check: 'Number' },
      { type: 'input_value', name: 'B', check: 'Number' },
    ],
    colour: '#607D8B',
    tooltip: 'Suma dos números con protección contra overflow',
    helpUrl: '',
  },

  safe_mul: {
    type: 'safe_mul',
    message: 'Multiplicar seguro: %1 × %2',
    args: [
      { type: 'input_value', name: 'A', check: 'Number' },
      { type: 'input_value', name: 'B', check: 'Number' },
    ],
    colour: '#607D8B',
    tooltip: 'Multiplica dos números con protección contra overflow',
    helpUrl: '',
  },

  safe_sub: {
    type: 'safe_sub',
    message: 'Restar seguro: %1 - %2',
    args: [
      { type: 'input_value', name: 'A', check: 'Number' },
      { type: 'input_value', name: 'B', check: 'Number' },
    ],
    colour: '#607D8B',
    tooltip: 'Resta dos números con protección contra underflow',
    helpUrl: '',
  },

  // Operaciones de verificación
  verify_signature: {
    type: 'verify_signature',
    message: 'Verificar firma de %1',
    args: [
      { type: 'field_input', name: 'DATA', text: 'datos' },
    ],
    colour: '#009688',
    tooltip: 'Verifica una firma criptográfica',
    helpUrl: '',
  },

  check_address: {
    type: 'check_address',
    message: 'Validar dirección %1',
    args: [
      { type: 'input_value', name: 'ADDRESS', check: 'String' },
    ],
    colour: '#009688',
    tooltip: 'Verifica que una dirección sea válida',
    helpUrl: '',
  },

  // Más operaciones de contrato
  contract_pause: {
    type: 'contract_pause',
    message: 'Pausar contrato',
    args: [],
    colour: '#E91E63',
    tooltip: 'Pausa todas las operaciones del contrato',
    helpUrl: '',
  },

  contract_resume: {
    type: 'contract_resume',
    message: 'Reanudar contrato',
    args: [],
    colour: '#E91E63',
    tooltip: 'Reanuda el contrato después de una pausa',
    helpUrl: '',
  },

  contract_destroy: {
    type: 'contract_destroy',
    message: 'Destruir contrato',
    args: [],
    colour: '#E91E63',
    tooltip: 'Elimina el contrato permanentemente',
    helpUrl: '',
  },
}

// Función para crear bloques personalizados
export const createCustomBlocks = () => {
  try {
    console.log('Creando bloques personalizados...')
    
    Object.entries(CUSTOM_BLOCKS).forEach(([key, blockDef]) => {
      console.log(`Registrando bloque: ${key}`)
      
      // Registrar el bloque en Blockly
      if (Blockly && Blockly.Blocks) {
        Blockly.Blocks[key] = {
          init: function() {
            this.setColour(blockDef.colour)
            this.setTooltip(blockDef.tooltip)
            this.setHelpUrl(blockDef.helpUrl || '')
            
            // Configurar el bloque de forma más simple y robusta
            if (blockDef.args && blockDef.args.length > 0) {
              // Crear un input dummy para el texto principal
              const dummyInput = this.appendDummyInput()
              dummyInput.appendField(blockDef.message.split('%')[0] || blockDef.message)
              
              // Añadir campos basados en los argumentos
              blockDef.args.forEach((arg: any) => {
                if (arg.type === 'field_input') {
                  dummyInput.appendField(new Blockly.FieldTextInput(arg.text || ''), arg.name)
                } else if (arg.type === 'field_dropdown') {
                  dummyInput.appendField(new Blockly.FieldDropdown(arg.options || []), arg.name)
                } else if (arg.type === 'input_value') {
                  this.appendValueInput(arg.name).setCheck(arg.check || null)
                }
              })
            } else {
              // Si no hay argumentos, solo mostrar el mensaje
              this.appendDummyInput().appendField(blockDef.message)
            }

            this.setPreviousStatement(true)
            this.setNextStatement(true)
          }
        }
      }

      // Registrar el generador de código JavaScript
      if (Blockly && Blockly.JavaScript) {
        Blockly.JavaScript[key] = function(block: any) {
          const blockType = block.type
          let code = ''
          
          switch (blockType) {
            case 'contract_start':
              code = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.28;\n\ncontract MiContrato {\n`
              break
            case 'variable_declare':
              const varName = block.getFieldValue('NAME') || 'miVariable'
              const varType = block.getFieldValue('TYPE') || 'uint256'
              code = `    ${varType} public ${varName};\n`
              break
            case 'function_public':
              const funcName = block.getFieldValue('NAME') || 'miFuncion'
              code = `    function ${funcName}() public {\n        // Lógica de la función\n    }\n`
              break
            case 'function_private':
              const privFuncName = block.getFieldValue('NAME') || 'miFuncion'
              code = `    function ${privFuncName}() private {\n        // Lógica de la función\n    }\n`
              break
            case 'modifier_onlyowner':
              code = `    modifier onlyOwner() {\n        require(msg.sender == owner, "No autorizado");\n        _;\n    }\n`
              break
            case 'require_statement':
              const condition = Blockly.JavaScript.valueToCode(block, 'CONDITION', Blockly.JavaScript.ORDER_ATOMIC) || 'true'
              code = `        require(${condition}, "Condición no cumplida");\n`
              break
            case 'emit_event':
              const eventName = block.getFieldValue('EVENT_NAME') || 'MiEvento'
              code = `        emit ${eventName}();\n`
              break
            case 'token_create':
              const name = block.getFieldValue('NAME') || 'MiToken'
              const symbol = block.getFieldValue('SYMBOL') || 'MTK'
              code = `// Crear token ${name} (${symbol})\n`
              break
            case 'token_mint':
              const amount = Blockly.JavaScript.valueToCode(block, 'AMOUNT', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              const to = Blockly.JavaScript.valueToCode(block, 'TO', Blockly.JavaScript.ORDER_ATOMIC) || 'msg.sender'
              code = `mint(${to}, ${amount});\n`
              break
            case 'nft_create':
              const nftName = block.getFieldValue('NAME') || 'MiNFT'
              const nftSymbol = block.getFieldValue('SYMBOL') || 'MNF'
              code = `// Crear NFT ${nftName} (${nftSymbol})\n`
              break
            case 'nft_mint':
              const nftTo = Blockly.JavaScript.valueToCode(block, 'TO', Blockly.JavaScript.ORDER_ATOMIC) || 'msg.sender'
              code = `mintNFT(${nftTo});\n`
              break
            case 'proposal_create':
              const description = block.getFieldValue('DESCRIPTION') || 'Nueva propuesta'
              code = `createProposal("${description}");\n`
              break
            case 'vote_cast':
              const vote = block.getFieldValue('VOTE') || 'yes'
              const proposalId = Blockly.JavaScript.valueToCode(block, 'PROPOSAL_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `vote(${proposalId}, ${vote === 'yes'});\n`
              break
            case 'item_list':
              const price = Blockly.JavaScript.valueToCode(block, 'PRICE', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `listItem(${price});\n`
              break
            case 'item_buy':
              const buyItemId = Blockly.JavaScript.valueToCode(block, 'ITEM_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `buyItem(${buyItemId});\n`
              break
            case 'token_burn':
              const burnAmount = Blockly.JavaScript.valueToCode(block, 'AMOUNT', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `burn(${burnAmount});\n`
              break
            case 'token_approve':
              const approveTo = Blockly.JavaScript.valueToCode(block, 'SPENDER', Blockly.JavaScript.ORDER_ATOMIC) || 'address(0)'
              const approveAmount = Blockly.JavaScript.valueToCode(block, 'AMOUNT', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `approve(${approveTo}, ${approveAmount});\n`
              break
            case 'token_balance':
              const balanceAddr = Blockly.JavaScript.valueToCode(block, 'ADDRESS', Blockly.JavaScript.ORDER_ATOMIC) || 'msg.sender'
              code = `balanceOf[${balanceAddr}];\n`
              break
            case 'nft_burn':
              const nftBurnId = Blockly.JavaScript.valueToCode(block, 'TOKEN_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `burnNFT(${nftBurnId});\n`
              break
            case 'nft_transfer':
              const nftTransferId = Blockly.JavaScript.valueToCode(block, 'TOKEN_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              const nftTransferTo = Blockly.JavaScript.valueToCode(block, 'TO', Blockly.JavaScript.ORDER_ATOMIC) || 'address(0)'
              code = `transferNFT(${nftTransferId}, ${nftTransferTo});\n`
              break
            case 'nft_uri':
              const nftUriId = Blockly.JavaScript.valueToCode(block, 'TOKEN_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `tokenURI(${nftUriId});\n`
              break
            case 'staking_stake':
              const stakeAmount = Blockly.JavaScript.valueToCode(block, 'AMOUNT', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `stake(${stakeAmount});\n`
              break
            case 'staking_unstake':
              const unstakeAmount = Blockly.JavaScript.valueToCode(block, 'AMOUNT', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `unstake(${unstakeAmount});\n`
              break
            case 'staking_claim':
              code = `claimRewards();\n`
              break
            case 'access_set_owner':
              const newOwner = Blockly.JavaScript.valueToCode(block, 'NEW_OWNER', Blockly.JavaScript.ORDER_ATOMIC) || 'address(0)'
              code = `owner = ${newOwner};\n`
              break
            case 'access_grant_role':
              const grantRole = block.getFieldValue('ROLE') || 'ADMIN'
              const grantAccount = Blockly.JavaScript.valueToCode(block, 'ACCOUNT', Blockly.JavaScript.ORDER_ATOMIC) || 'address(0)'
              code = `grantRole(keccak256(abi.encodePacked("${grantRole}")), ${grantAccount});\n`
              break
            case 'access_revoke_role':
              const revokeRole = block.getFieldValue('ROLE') || 'ADMIN'
              const revokeAccount = Blockly.JavaScript.valueToCode(block, 'ACCOUNT', Blockly.JavaScript.ORDER_ATOMIC) || 'address(0)'
              code = `revokeRole(keccak256(abi.encodePacked("${revokeRole}")), ${revokeAccount});\n`
              break
            case 'proposal_execute':
              const execProposalId = Blockly.JavaScript.valueToCode(block, 'PROPOSAL_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `executeProposal(${execProposalId});\n`
              break
            case 'proposal_cancel':
              const cancelProposalId = Blockly.JavaScript.valueToCode(block, 'PROPOSAL_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `cancelProposal(${cancelProposalId});\n`
              break
            case 'item_cancel':
              const cancelItemId = Blockly.JavaScript.valueToCode(block, 'ITEM_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `cancelListing(${cancelItemId});\n`
              break
            case 'item_update_price':
              const updateItemId = Blockly.JavaScript.valueToCode(block, 'ITEM_ID', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              const updatePrice = Blockly.JavaScript.valueToCode(block, 'NEW_PRICE', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `updatePrice(${updateItemId}, ${updatePrice});\n`
              break
            case 'log_event':
              const logMsg = block.getFieldValue('MESSAGE') || 'evento'
              code = `emit Log("${logMsg}");\n`
              break
            case 'send_payment':
              const payAmount = Blockly.JavaScript.valueToCode(block, 'AMOUNT', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              const payRecipient = Blockly.JavaScript.valueToCode(block, 'RECIPIENT', Blockly.JavaScript.ORDER_ATOMIC) || 'address(0)'
              code = `payable(${payRecipient}).transfer(${payAmount});\n`
              break
            case 'get_balance':
              code = `address(this).balance;\n`
              break
            case 'timestamp':
              code = `block.timestamp;\n`
              break
            case 'time_locked':
              const lockDuration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `unlockTime = block.timestamp + ${lockDuration};\n`
              break
            case 'safe_add':
              const addA = Blockly.JavaScript.valueToCode(block, 'A', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              const addB = Blockly.JavaScript.valueToCode(block, 'B', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `${addA} + ${addB};\n`
              break
            case 'safe_mul':
              const mulA = Blockly.JavaScript.valueToCode(block, 'A', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              const mulB = Blockly.JavaScript.valueToCode(block, 'B', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `${mulA} * ${mulB};\n`
              break
            case 'safe_sub':
              const subA = Blockly.JavaScript.valueToCode(block, 'A', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              const subB = Blockly.JavaScript.valueToCode(block, 'B', Blockly.JavaScript.ORDER_ATOMIC) || '0'
              code = `${subA} - ${subB};\n`
              break
            case 'verify_signature':
              const verifyData = block.getFieldValue('DATA') || 'datos'
              code = `verifySignature("${verifyData}");\n`
              break
            case 'check_address':
              const checkAddr = Blockly.JavaScript.valueToCode(block, 'ADDRESS', Blockly.JavaScript.ORDER_ATOMIC) || 'address(0)'
              code = `require(${checkAddr} != address(0), "Dirección inválida");\n`
              break
            case 'contract_pause':
              code = `paused = true;\nemit Paused(msg.sender);\n`
              break
            case 'contract_resume':
              code = `paused = false;\nemit Resumed(msg.sender);\n`
              break
            case 'contract_destroy':
              code = `selfdestruct(payable(owner));\n`
              break
            default:
              code = `// ${blockDef.tooltip}\n`
          }
          
          return code
        }
      }
    })
    
    console.log('Bloques personalizados creados exitosamente')
  } catch (error) {
    console.error('Error creating custom blocks:', error)
  }
}

// Función para generar código Solidity desde los bloques
export const generateSolidityCode = (workspace: Blockly.WorkspaceSvg, contractName: string): string => {
  try {
    // Sanitizar el nombre del contrato
    const sanitizedName = sanitizeContractName(contractName)

    // Verificar que el workspace existe
    if (!workspace) {
      return `// Error: Workspace no disponible`
    }

    // Obtener todos los bloques del workspace
    const blocks = workspace.getTopBlocks(false)

    if (!blocks || blocks.length === 0) {
      return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }
    
    // No hay bloques en el workspace
    // Agrega bloques desde el panel lateral para generar código
}`
    }
    
    let solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${sanitizedName} {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }
    
    // Funciones generadas desde bloques:`
    
    // Variables para rastrear qué funcionalidades se han añadido
    const addedFeatures = new Set<string>()
    
    // Procesar cada bloque y generar código Solidity
    blocks.forEach(block => {
      const blockType = block.type
      const blockData = CUSTOM_BLOCKS[blockType as keyof typeof CUSTOM_BLOCKS]
      
      if (blockData) {
        solidityCode += `\n\n    // ${blockData.tooltip}`
        
        // Generar función basada en el tipo de bloque
        switch (blockType) {
          case 'token_create':
            if (!addedFeatures.has('token')) {
              const name = getBlockValue(block, 'NAME', 'MiToken')
              const symbol = getBlockValue(block, 'SYMBOL', 'MTK')
              solidityCode += `\n    string public name = "${name}";`
              solidityCode += `\n    string public symbol = "${symbol}";`
              solidityCode += `\n    uint8 public decimals = 18;`
              solidityCode += `\n    uint256 public totalSupply = 0;`
              solidityCode += `\n    mapping(address => uint256) public balanceOf;`
              solidityCode += `\n    mapping(address => mapping(address => uint256)) public allowance;`
              addedFeatures.add('token')
            }
            break
            
          case 'token_mint':
            if (!addedFeatures.has('token_mint')) {
              solidityCode += `\n    function mint(address to, uint256 amount) public onlyOwner {`
              solidityCode += `\n        require(to != address(0), "Dirección inválida");`
              solidityCode += `\n        totalSupply += amount;`
              solidityCode += `\n        balanceOf[to] += amount;`
              solidityCode += `\n        emit Transfer(address(0), to, amount);`
              solidityCode += `\n    }`
              addedFeatures.add('token_mint')
            }
            break
            
          case 'token_transfer':
            if (!addedFeatures.has('token_transfer')) {
              solidityCode += `\n    function transfer(address to, uint256 amount) public returns (bool) {`
              solidityCode += `\n        require(balanceOf[msg.sender] >= amount, "Saldo insuficiente");`
              solidityCode += `\n        balanceOf[msg.sender] -= amount;`
              solidityCode += `\n        balanceOf[to] += amount;`
              solidityCode += `\n        emit Transfer(msg.sender, to, amount);`
              solidityCode += `\n        return true;`
              solidityCode += `\n    }`
              addedFeatures.add('token_transfer')
            }
            break
            
          case 'nft_create':
            if (!addedFeatures.has('nft')) {
              const nftName = getBlockValue(block, 'NAME', 'MiNFT')
              const nftSymbol = getBlockValue(block, 'SYMBOL', 'MNF')
              solidityCode += `\n    string public name = "${nftName}";`
              solidityCode += `\n    string public symbol = "${nftSymbol}";`
              solidityCode += `\n    uint256 public nextTokenId = 1;`
              solidityCode += `\n    mapping(uint256 => address) public ownerOf;`
              solidityCode += `\n    mapping(address => uint256) public balanceOf;`
              addedFeatures.add('nft')
            }
            break
            
          case 'nft_mint':
            if (!addedFeatures.has('nft_mint')) {
              solidityCode += `\n    function mint(address to) public onlyOwner returns (uint256) {`
              solidityCode += `\n        require(to != address(0), "Dirección inválida");`
              solidityCode += `\n        uint256 tokenId = nextTokenId++;`
              solidityCode += `\n        ownerOf[tokenId] = to;`
              solidityCode += `\n        balanceOf[to]++;`
              solidityCode += `\n        emit Transfer(address(0), to, tokenId);`
              solidityCode += `\n        return tokenId;`
              solidityCode += `\n    }`
              addedFeatures.add('nft_mint')
            }
            break
            
          case 'proposal_create':
            if (!addedFeatures.has('governance')) {
              solidityCode += `\n    struct Proposal {`
              solidityCode += `\n        string description;`
              solidityCode += `\n        uint256 yesVotes;`
              solidityCode += `\n        uint256 noVotes;`
              solidityCode += `\n        bool executed;`
              solidityCode += `\n        uint256 deadline;`
              solidityCode += `\n    }`
              solidityCode += `\n    mapping(uint256 => Proposal) public proposals;`
              solidityCode += `\n    uint256 public nextProposalId = 1;`
              solidityCode += `\n    uint256 public votingDuration = 7 days;`
              solidityCode += `\n    function createProposal(string memory description) public onlyOwner returns (uint256) {`
              solidityCode += `\n        uint256 proposalId = nextProposalId++;`
              solidityCode += `\n        proposals[proposalId] = Proposal(description, 0, 0, false, block.timestamp + votingDuration);`
              solidityCode += `\n        emit ProposalCreated(proposalId, description);`
              solidityCode += `\n        return proposalId;`
              solidityCode += `\n    }`
              addedFeatures.add('governance')
            }
            break
            
          case 'vote_cast':
            if (!addedFeatures.has('voting')) {
              solidityCode += `\n    mapping(uint256 => mapping(address => bool)) public hasVoted;`
              solidityCode += `\n    function vote(uint256 proposalId, bool support) public {`
              solidityCode += `\n        require(proposals[proposalId].deadline > block.timestamp, "Votación cerrada");`
              solidityCode += `\n        require(!hasVoted[proposalId][msg.sender], "Ya votaste");`
              solidityCode += `\n        hasVoted[proposalId][msg.sender] = true;`
              solidityCode += `\n        if (support) {`
              solidityCode += `\n            proposals[proposalId].yesVotes++;`
              solidityCode += `\n        } else {`
              solidityCode += `\n            proposals[proposalId].noVotes++;`
              solidityCode += `\n        }`
              solidityCode += `\n        emit VoteCast(proposalId, msg.sender, support);`
              solidityCode += `\n    }`
              addedFeatures.add('voting')
            }
            break
            
          case 'item_list':
            if (!addedFeatures.has('marketplace')) {
              solidityCode += `\n    struct Item {`
              solidityCode += `\n        uint256 id;`
              solidityCode += `\n        address seller;`
              solidityCode += `\n        uint256 price;`
              solidityCode += `\n        bool isListed;`
              solidityCode += `\n    }`
              solidityCode += `\n    mapping(uint256 => Item) public items;`
              solidityCode += `\n    uint256 public nextItemId = 1;`
              solidityCode += `\n    function listItem(uint256 price) public returns (uint256) {`
              solidityCode += `\n        uint256 itemId = nextItemId++;`
              solidityCode += `\n        items[itemId] = Item(itemId, msg.sender, price, true);`
              solidityCode += `\n        emit ItemListed(itemId, msg.sender, price);`
              solidityCode += `\n        return itemId;`
              solidityCode += `\n    }`
              addedFeatures.add('marketplace')
            }
            break
            
          case 'item_buy':
            if (!addedFeatures.has('marketplace_buy')) {
              solidityCode += `\n    function buyItem(uint256 itemId) public payable {`
              solidityCode += `\n        Item storage item = items[itemId];`
              solidityCode += `\n        require(item.isListed, "Item no disponible");`
              solidityCode += `\n        require(msg.value >= item.price, "Pago insuficiente");`
              solidityCode += `\n        item.isListed = false;`
              solidityCode += `\n        payable(item.seller).transfer(item.price);`
              solidityCode += `\n        if (msg.value > item.price) {`
              solidityCode += `\n            payable(msg.sender).transfer(msg.value - item.price);`
              solidityCode += `\n        }`
              solidityCode += `\n        emit ItemBought(itemId, msg.sender, item.price);`
              solidityCode += `\n    }`
              addedFeatures.add('marketplace_buy')
            }
            break
        }
      }
    })
    
    // Añadir eventos necesarios
    if (addedFeatures.has('token') || addedFeatures.has('token_mint') || addedFeatures.has('token_transfer')) {
      solidityCode += `\n\n    event Transfer(address indexed from, address indexed to, uint256 value);`
    }
    if (addedFeatures.has('governance')) {
      solidityCode += `\n    event ProposalCreated(uint256 indexed proposalId, string description);`
    }
    if (addedFeatures.has('voting')) {
      solidityCode += `\n    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);`
    }
    if (addedFeatures.has('marketplace')) {
      solidityCode += `\n    event ItemListed(uint256 indexed itemId, address indexed seller, uint256 price);`
    }
    if (addedFeatures.has('marketplace_buy')) {
      solidityCode += `\n    event ItemBought(uint256 indexed itemId, address indexed buyer, uint256 price);`
    }
    
    solidityCode += `
    
    // Funciones de utilidad
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}`

    return solidityCode
  } catch (error: unknown) {
    console.error('Error generating Solidity code:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return `// Error generando código: ${msg}`
  }
}
