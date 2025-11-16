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
