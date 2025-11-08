import * as Blockly from 'blockly'

/**
 * Sistema de Wizard para pre-cargar bloques en Blockly
 * Permite a usuarios seleccionar plantillas y cargar bloques automáticamente
 */

export interface BlockTemplate {
  type: string
  x: number
  y: number
  fields?: Record<string, string | number>
  inputs?: Record<string, any>
}

export interface WizardTemplate {
  id: string
  name: string
  description: string
  icon: string
  blocks: BlockTemplate[]
  codeExample?: string
}

/**
 * Plantillas predefinidas de contratos inteligentes con bloques
 */
export const WIZARD_TEMPLATES: WizardTemplate[] = [
  {
    id: 'token-erc20',
    name: 'Token (ERC20)',
    description: 'Crea tu propio token criptográfico con funcionalidades estándar',
    icon: '💰',
    blocks: [
      { type: 'contract_start', x: 20, y: 20 },
      { type: 'variable_declare', x: 20, y: 100, fields: { NAME: 'name', TYPE: 'string' } },
      { type: 'variable_declare', x: 20, y: 160, fields: { NAME: 'symbol', TYPE: 'string' } },
      { type: 'variable_declare', x: 20, y: 220, fields: { NAME: 'totalSupply', TYPE: 'uint256' } },
      { type: 'function_public', x: 20, y: 280, fields: { NAME: 'transfer' } },
      { type: 'token_transfer', x: 20, y: 340 },
      { type: 'function_public', x: 20, y: 400, fields: { NAME: 'approve' } },
      { type: 'token_approve', x: 20, y: 460 },
      { type: 'function_public', x: 20, y: 520, fields: { NAME: 'mint' } },
      { type: 'token_mint', x: 20, y: 580 },
    ],
    codeExample: 'token_transfer'
  },

  {
    id: 'nft-collection',
    name: 'NFT Collection',
    description: 'Crea colecciones de NFTs (ERC721) para activos digitales únicos',
    icon: '🖼️',
    blocks: [
      { type: 'contract_start', x: 20, y: 20 },
      { type: 'variable_declare', x: 20, y: 100, fields: { NAME: 'tokenName', TYPE: 'string' } },
      { type: 'variable_declare', x: 20, y: 160, fields: { NAME: 'tokenSymbol', TYPE: 'string' } },
      { type: 'variable_declare', x: 20, y: 220, fields: { NAME: 'tokenCounter', TYPE: 'uint256' } },
      { type: 'function_public', x: 20, y: 280, fields: { NAME: 'mintNFT' } },
      { type: 'nft_mint', x: 20, y: 340 },
      { type: 'function_public', x: 20, y: 400, fields: { NAME: 'transferNFT' } },
      { type: 'nft_transfer', x: 20, y: 460 },
      { type: 'function_public', x: 20, y: 520, fields: { NAME: 'getNFTUri' } },
      { type: 'nft_uri', x: 20, y: 580 },
    ],
    codeExample: 'nft_mint'
  },

  {
    id: 'governance-dao',
    name: 'DAO & Gobernanza',
    description: 'Sistema de votación descentralizado para tomar decisiones comunitarias',
    icon: '🗳️',
    blocks: [
      { type: 'contract_start', x: 20, y: 20 },
      { type: 'variable_declare', x: 20, y: 100, fields: { NAME: 'proposals', TYPE: 'mapping' } },
      { type: 'variable_declare', x: 20, y: 160, fields: { NAME: 'proposalCount', TYPE: 'uint256' } },
      { type: 'variable_declare', x: 20, y: 220, fields: { NAME: 'votingDuration', TYPE: 'uint256' } },
      { type: 'function_public', x: 20, y: 280, fields: { NAME: 'createProposal' } },
      { type: 'function_public', x: 20, y: 340, fields: { NAME: 'vote' } },
      { type: 'function_public', x: 20, y: 400, fields: { NAME: 'executeProposal' } },
      { type: 'require_statement', x: 20, y: 460 },
      { type: 'emit_event', x: 20, y: 520, fields: { EVENT: 'ProposalCreated' } },
    ],
    codeExample: 'proposal_create'
  },

  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Plataforma de compra-venta de productos con escrow y comisiones',
    icon: '🛍️',
    blocks: [
      { type: 'contract_start', x: 20, y: 20 },
      { type: 'variable_declare', x: 20, y: 100, fields: { NAME: 'items', TYPE: 'mapping' } },
      { type: 'variable_declare', x: 20, y: 160, fields: { NAME: 'itemCounter', TYPE: 'uint256' } },
      { type: 'variable_declare', x: 20, y: 220, fields: { NAME: 'platformFee', TYPE: 'uint256' } },
      { type: 'function_public', x: 20, y: 280, fields: { NAME: 'listItem' } },
      { type: 'function_public', x: 20, y: 340, fields: { NAME: 'buyItem' } },
      { type: 'function_public', x: 20, y: 400, fields: { NAME: 'cancelListing' } },
      { type: 'function_public', x: 20, y: 460, fields: { NAME: 'withdrawFunds' } },
      { type: 'emit_event', x: 20, y: 520, fields: { EVENT: 'ItemListed' } },
      { type: 'emit_event', x: 20, y: 580, fields: { EVENT: 'ItemSold' } },
    ],
    codeExample: 'item_list'
  },

  {
    id: 'staking-pool',
    name: 'Staking Pool',
    description: 'Sistema de staking donde usuarios bloquean tokens para ganar recompensas',
    icon: '💎',
    blocks: [
      { type: 'contract_start', x: 20, y: 20 },
      { type: 'variable_declare', x: 20, y: 100, fields: { NAME: 'stakeholders', TYPE: 'mapping' } },
      { type: 'variable_declare', x: 20, y: 160, fields: { NAME: 'totalStaked', TYPE: 'uint256' } },
      { type: 'variable_declare', x: 20, y: 220, fields: { NAME: 'rewardRate', TYPE: 'uint256' } },
      { type: 'function_public', x: 20, y: 280, fields: { NAME: 'stake' } },
      { type: 'staking_stake', x: 20, y: 340 },
      { type: 'function_public', x: 20, y: 400, fields: { NAME: 'unstake' } },
      { type: 'staking_unstake', x: 20, y: 460 },
      { type: 'function_public', x: 20, y: 520, fields: { NAME: 'claimRewards' } },
      { type: 'staking_claim', x: 20, y: 580 },
    ],
    codeExample: 'token_mint'
  },

  {
    id: 'loyalty-rewards',
    name: 'Sistema de Lealtad',
    description: 'Programa de puntos y recompensas para clientes',
    icon: '⭐',
    blocks: [
      { type: 'contract_start', x: 20, y: 20 },
      { type: 'variable_declare', x: 20, y: 100, fields: { NAME: 'balances', TYPE: 'mapping' } },
      { type: 'variable_declare', x: 20, y: 160, fields: { NAME: 'pointsPerPurchase', TYPE: 'uint256' } },
      { type: 'variable_declare', x: 20, y: 220, fields: { NAME: 'redeemRate', TYPE: 'uint256' } },
      { type: 'function_public', x: 20, y: 280, fields: { NAME: 'addPoints' } },
      { type: 'function_public', x: 20, y: 340, fields: { NAME: 'redeemPoints' } },
      { type: 'function_public', x: 20, y: 400, fields: { NAME: 'checkBalance' } },
      { type: 'function_public', x: 20, y: 460, fields: { NAME: 'transferPoints' } },
      { type: 'emit_event', x: 20, y: 520, fields: { EVENT: 'PointsAdded' } },
    ],
    codeExample: 'token_mint'
  },

  {
    id: 'escrow-contract',
    name: 'Contrato de Depósito en Garantía',
    description: 'Tercero de confianza que retiene fondos hasta completar condiciones',
    icon: '🔐',
    blocks: [
      { type: 'contract_start', x: 20, y: 20 },
      { type: 'variable_declare', x: 20, y: 100, fields: { NAME: 'escrows', TYPE: 'mapping' } },
      { type: 'variable_declare', x: 20, y: 160, fields: { NAME: 'arbiter', TYPE: 'address' } },
      { type: 'variable_declare', x: 20, y: 220, fields: { NAME: 'escrowCounter', TYPE: 'uint256' } },
      { type: 'function_public', x: 20, y: 280, fields: { NAME: 'createEscrow' } },
      { type: 'function_public', x: 20, y: 340, fields: { NAME: 'releaseFunds' } },
      { type: 'function_public', x: 20, y: 400, fields: { NAME: 'refundFunds' } },
      { type: 'modifier_onlyowner', x: 20, y: 460 },
      { type: 'emit_event', x: 20, y: 520, fields: { EVENT: 'EscrowCreated' } },
    ],
    codeExample: 'require_statement'
  },

  {
    id: 'whitelist-contract',
    name: 'Whitelist & Access Control',
    description: 'Control de acceso basado en lista de direcciones autorizadas',
    icon: '✅',
    blocks: [
      { type: 'contract_start', x: 20, y: 20 },
      { type: 'variable_declare', x: 20, y: 100, fields: { NAME: 'whitelist', TYPE: 'mapping' } },
      { type: 'variable_declare', x: 20, y: 160, fields: { NAME: 'owner', TYPE: 'address' } },
      { type: 'function_public', x: 20, y: 220, fields: { NAME: 'addToWhitelist' } },
      { type: 'access_grant_role', x: 20, y: 280 },
      { type: 'function_public', x: 20, y: 340, fields: { NAME: 'removeFromWhitelist' } },
      { type: 'access_revoke_role', x: 20, y: 400 },
      { type: 'function_public', x: 20, y: 460, fields: { NAME: 'isWhitelisted' } },
      { type: 'require_statement', x: 20, y: 520 },
      { type: 'emit_event', x: 20, y: 580, fields: { EVENT: 'WhitelistUpdated' } },
    ],
    codeExample: 'require_statement'
  },
]

/**
 * Carga una plantilla de wizard en el workspace de Blockly
 */
export function loadWizardTemplate(
  workspace: Blockly.WorkspaceSvg,
  template: WizardTemplate
): void {
  try {
    // Crear bloques basados en la plantilla
    template.blocks.forEach((blockTemplate) => {
      try {
        const block = workspace.newBlock(blockTemplate.type)

        // Configurar campos si existen
        if (blockTemplate.fields) {
          Object.entries(blockTemplate.fields).forEach(([fieldName, fieldValue]) => {
            const field = block.getField(fieldName)
            if (field) {
              field.setValue(fieldValue as string)
            }
          })
        }

        // Posicionar el bloque
        block.moveBy(blockTemplate.x, blockTemplate.y)

        // Renderizar el bloque
        block.initSvg()
        block.render()
      } catch (error) {
        console.error(`Error creando bloque ${blockTemplate.type}:`, error)
      }
    })

    // Conectar bloques si hay relaciones padre-hijo
    connectBlocksInSequence(workspace, template)

    console.log(`Plantilla "${template.name}" cargada exitosamente`)
  } catch (error) {
    console.error('Error cargando plantilla de wizard:', error)
  }
}

/**
 * Conecta bloques de manera secuencial
 */
function connectBlocksInSequence(workspace: Blockly.WorkspaceSvg, _template: WizardTemplate): void {
  const topBlocks = workspace.getTopBlocks(false)

  if (topBlocks.length > 1) {
    // Conectar bloques que tengan conexión siguiente/anterior
    for (let i = 0; i < topBlocks.length - 1; i++) {
      const currentBlock = topBlocks[i]
      const nextBlock = topBlocks[i + 1]

      // Verificar si el bloque actual tiene una salida de siguiente
      if (currentBlock.nextConnection && nextBlock.previousConnection) {
        try {
          currentBlock.nextConnection.connect(nextBlock.previousConnection)
        } catch (error) {
          // Algunos bloques no pueden conectarse, está bien
        }
      }
    }
  }
}

/**
 * Obtiene una plantilla por ID
 */
export function getWizardTemplate(templateId: string): WizardTemplate | undefined {
  return WIZARD_TEMPLATES.find((t) => t.id === templateId)
}

/**
 * Obtiene todas las plantillas disponibles
 */
export function getAllWizardTemplates(): WizardTemplate[] {
  return WIZARD_TEMPLATES
}

/**
 * Limpia el workspace y carga una nueva plantilla
 */
export function replaceWithWizardTemplate(
  workspace: Blockly.WorkspaceSvg,
  template: WizardTemplate
): void {
  // Guardar bloques actuales por si se necesita undo
  const currentXml = Blockly.Xml.workspaceToDom(workspace)

  try {
    // Limpiar workspace
    workspace.clear()

    // Cargar nueva plantilla
    loadWizardTemplate(workspace, template)
  } catch (error) {
    console.error('Error reemplazando con plantilla:', error)
    // Restaurar bloques anteriores si algo falla
    try {
      Blockly.Xml.domToWorkspace(currentXml, workspace)
    } catch (restoreError) {
      console.error('Error restaurando workspace:', restoreError)
    }
  }
}
