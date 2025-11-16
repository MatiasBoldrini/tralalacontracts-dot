import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  Build,
  Code,
  Preview,
  Add,
  Save,
  PlayArrow,
  AutoAwesome,
} from '@mui/icons-material'
import * as Blockly from 'blockly'
import { ContractFeature } from '../types'
import { createCustomBlocks, generateSolidityCode } from '../utils/blocklyConfig'
import { generateContractByType, ContractConfig } from '../utils/contractTemplates'
import { loadWizardTemplate, WizardTemplate, WIZARD_TEMPLATES } from '../utils/blocklyWizard'

interface ContractBuilderProps {
  onCodeGenerated: (code: string) => void
  onNext: () => void
  onBack: () => void
}

const CONTRACT_FEATURES: ContractFeature[] = [
  {
    id: 'loyalty',
    name: 'Sistema de Lealtad',
    description: 'Programa de puntos y recompensas para clientes',
    category: 'defi',
    blocks: [
      {
        type: 'token_create',
        message: 'Crear Token de Recompensas',
        args: [{ type: 'field_input', name: 'NAME' }, { type: 'field_input', name: 'SYMBOL' }],
        colour: '#4CAF50',
        tooltip: 'Crea un token para el programa de lealtad',
      },
      {
        type: 'token_mint',
        message: 'Otorgar %1 puntos a %2',
        args: [{ type: 'input_value', name: 'AMOUNT' }, { type: 'input_value', name: 'TO' }],
        colour: '#4CAF50',
        tooltip: 'Otorga puntos de recompensa',
      },
    ],
  },
  {
    id: 'certificates',
    name: 'Certificados Digitales',
    description: 'Emitir certificados verificables en blockchain',
    category: 'utility',
    blocks: [
      {
        type: 'nft_create',
        message: 'Crear Certificado',
        args: [{ type: 'field_input', name: 'NAME' }, { type: 'field_input', name: 'SYMBOL' }],
        colour: '#9C27B0',
        tooltip: 'Crea un sistema de certificados NFT',
      },
      {
        type: 'nft_mint',
        message: 'Emitir certificado para %1',
        args: [{ type: 'input_value', name: 'TO' }],
        colour: '#9C27B0',
        tooltip: 'Emite un certificado digital',
      },
    ],
  },
  {
    id: 'governance',
    name: 'Gobernanza Comunitaria',
    description: 'Sistema de votación para decisiones comunitarias',
    category: 'dao',
    blocks: [
      {
        type: 'proposal_create',
        message: 'Crear Propuesta: %1',
        args: [{ type: 'field_input', name: 'DESCRIPTION' }],
        colour: '#FF9800',
        tooltip: 'Crea una propuesta de gobernanza',
      },
      {
        type: 'vote_cast',
        message: 'Votar %1 en propuesta %2',
        args: [{ type: 'dropdown', name: 'VOTE', options: [['Sí', 'yes'], ['No', 'no'], ['Abstención', 'abstain']] }, { type: 'input_value', name: 'PROPOSAL_ID' }],
        colour: '#FF9800',
        tooltip: 'Emite un voto en la propuesta',
      },
    ],
  },
  {
    id: 'marketplace',
    name: 'Mercado Local',
    description: 'Plataforma para compra/venta de productos locales',
    category: 'token',
    blocks: [
      {
        type: 'item_list',
        message: 'Listar producto por %1 tokens',
        args: [{ type: 'input_value', name: 'PRICE' }],
        colour: '#2196F3',
        tooltip: 'Lista un producto en el mercado',
      },
      {
        type: 'item_buy',
        message: 'Comprar producto %1',
        args: [{ type: 'input_value', name: 'ITEM_ID' }],
        colour: '#2196F3',
        tooltip: 'Compra un producto del mercado',
      },
    ],
  },
]

const ContractBuilder: React.FC<ContractBuilderProps> = ({ onCodeGenerated, onNext, onBack }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null)
  const workspace = useRef<Blockly.WorkspaceSvg | null>(null)
  const [mainTab, setMainTab] = useState<'wizard' | 'features' | 'blockly'>('wizard')
  const [blocklyTab, setBlocklyTab] = useState(0)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [contractName, setContractName] = useState('')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isBlocklyReady, setIsBlocklyReady] = useState(false)
  const [selectedWizardTemplate, setSelectedWizardTemplate] = useState<WizardTemplate | null>(null)

  useEffect(() => {
    if (selectedFeatures.length > 0 && blocklyDiv.current) {
      // Reinicializar Blockly cuando cambien las features
      initializeBlockly()
    }
  }, [selectedFeatures])

  const initializeBlockly = () => {
    if (!blocklyDiv.current) {
      console.log('blocklyDiv.current no está disponible')
      return
    }

    try {
      console.log('Inicializando Blockly...')
      
      // Limpiar workspace anterior si existe
      if (workspace.current) {
        console.log('Disponiendo workspace anterior...')
        workspace.current.dispose()
        workspace.current = null
      }

      // Verificar que Blockly esté disponible
      if (!Blockly || !Blockly.inject) {
        console.error('Blockly no está disponible')
        setGeneratedCode('// Error: Blockly no está disponible')
        return
      }

      console.log('Blockly está disponible, creando bloques personalizados...')
      
      // Crear bloques personalizados ANTES de inicializar el workspace
      createCustomBlocks()

      // Crear toolbox dinámico basado en features seleccionadas
      const toolbox = createDynamicToolbox()

      console.log('Inyectando Blockly en el div...')
      
      // Inicializar workspace con configuración básica
      const workspaceOptions = {
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
        toolbox: toolbox,
      }

      workspace.current = Blockly.inject(blocklyDiv.current, workspaceOptions)

      console.log('Workspace creado exitosamente:', workspace.current)

      // Escuchar cambios en el workspace
      workspace.current.addChangeListener(() => {
        if (workspace.current) {
          try {
            const code = generateSolidityCode(workspace.current, contractName || 'MyContract')
            setGeneratedCode(code)
            onCodeGenerated(code)
          } catch (error: unknown) {
            console.error('Error generating code from blocks:', error)
            const msg = error instanceof Error ? error.message : String(error)
            setGeneratedCode(`// Error generando código: ${msg}`)
          }
        }
      })

      // Generar código inicial
      if (workspace.current) {
        const initialCode = generateSolidityCode(workspace.current, contractName || 'MyContract')
        setGeneratedCode(initialCode)
        onCodeGenerated(initialCode)
        console.log('Código inicial generado')
      }

      setIsBlocklyReady(true)
    } catch (error: unknown) {
      console.error('Error initializing Blockly:', error)
      const msg = error instanceof Error ? error.message : String(error)
      setGeneratedCode(`// Error inicializando Blockly: ${msg}`)
      setIsBlocklyReady(false)
    }
  }

  const handleWizardTemplate = (template: WizardTemplate) => {
    console.log(`📋 Seleccionando plantilla: ${template.name}`)
    setSelectedWizardTemplate(template)
    setSelectedFeatures([template.id])
    setMainTab('blockly')
    setContractName(template.name)

    // Generar código inmediatamente usando el template generator
    // Esto asegura que el código esté disponible incluso si Blockly falla
    const config: ContractConfig = {
      name: template.name,
      symbol: template.name.substring(0, 3).toUpperCase(),
    }
    const generatedCode = generateContractByType(template.id, config)
    setGeneratedCode(generatedCode)
    onCodeGenerated(generatedCode)
    console.log(`✅ Código generado inmediatamente para "${template.name}"`)

    // Esperar a que Blockly esté listo para cargar los bloques visuales
    setTimeout(() => {
      if (workspace.current) {
        try {
          // Limpiar workspace
          workspace.current.clear()
          // Cargar plantilla visual
          loadWizardTemplate(workspace.current, template)
          console.log(`✅ Bloques visuales cargados para "${template.name}"`)
        } catch (error) {
          console.warn('Error cargando bloques visuales (el código ya fue generado):', error)
        }
      } else {
        // Si Blockly aún no está listo, intentar de nuevo
        setTimeout(() => {
          if (workspace.current) {
            try {
              workspace.current.clear()
              loadWizardTemplate(workspace.current, template)
              console.log(`✅ Bloques visuales cargados para "${template.name}" (segundo intento)`)
            } catch (error) {
              console.warn('Error cargando bloques visuales en segundo intento:', error)
            }
          }
        }, 500)
      }
    }, 100)
  }

  const handleSkipWizard = () => {
    setMainTab('features')
    // Inicializar Blockly vacío
    if (!isBlocklyReady && blocklyDiv.current) {
      setSelectedFeatures(['manual'])
    }
  }

  const openWizard = () => {
    setMainTab('wizard')
  }

  const createDynamicToolbox = () => {
    console.log('Creando toolbox dinámico para features:', selectedFeatures)
    
    // Toolbox base con bloques estándar y bloques de construcción de contratos
    const baseContents = [
      {
        kind: 'category',
        name: 'Construcción de Contratos',
        colour: '#FF6B35',
        contents: [
          { kind: 'block', type: 'contract_start' },
          { kind: 'block', type: 'variable_declare' },
          { kind: 'block', type: 'function_public' },
          { kind: 'block', type: 'function_private' },
          { kind: 'block', type: 'modifier_onlyowner' },
          { kind: 'block', type: 'require_statement' },
          { kind: 'block', type: 'emit_event' },
        ]
      },
      {
        kind: 'category',
        name: 'Lógica',
        colour: '#5C81A6',
        contents: [
          { kind: 'block', type: 'controls_if' },
          { kind: 'block', type: 'logic_compare' },
          { kind: 'block', type: 'logic_operation' },
          { kind: 'block', type: 'logic_boolean' },
        ]
      },
      {
        kind: 'category',
        name: 'Matemáticas',
        colour: '#5C81A6',
        contents: [
          { kind: 'block', type: 'math_number' },
          { kind: 'block', type: 'math_arithmetic' },
        ]
      },
      {
        kind: 'category',
        name: 'Texto',
        colour: '#5C81A6',
        contents: [
          { kind: 'block', type: 'text' },
          { kind: 'block', type: 'text_join' },
        ]
      }
    ]

    // Añadir categorías basadas en features seleccionadas
    const featureCategories: any[] = []

    selectedFeatures.forEach(featureId => {
      const feature = CONTRACT_FEATURES.find(f => f.id === featureId)
      if (feature) {
        console.log(`Añadiendo categoría para feature: ${feature.name}`)
        featureCategories.push({
          kind: 'category',
          name: feature.name,
          colour: feature.blocks[0]?.colour || '#5C81A6',
          contents: feature.blocks.map(block => {
            console.log(`  - Añadiendo bloque: ${block.type}`)
            return {
              kind: 'block',
              type: block.type,
            }
          })
        })
      }
    })

    const finalToolbox = {
      kind: 'categoryToolbox',
      contents: [...baseContents, ...featureCategories]
    }

    console.log('Toolbox final:', finalToolbox)
    return finalToolbox
  }

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const generateCode = () => {
    console.log('🏗️ generateCode() iniciado')
    let finalCode = ''

    try {
      if (workspace.current) {
        // Generar código desde Blockly
        console.log('🔧 Generando desde Blockly workspace')
        const code = generateSolidityCode(workspace.current, contractName || 'MyContract')
        finalCode = code
      } else {
        // Generar código usando plantillas basadas en wizard o features seleccionadas
        console.log('📋 Generando desde plantillas (no hay workspace)')
        let solidityCode = ''

        if (selectedFeatures.length === 1 && selectedFeatures[0] !== 'manual') {
          const featureId = selectedFeatures[0]
          console.log(`📌 Feature única seleccionada: ${featureId}`)

          // Check if this is already a wizard template ID (e.g., 'nft-collection', 'token-erc20')
          const isWizardTemplateId = WIZARD_TEMPLATES.some(t => t.id === featureId)

          if (isWizardTemplateId) {
            // Direct wizard template - use it directly
            const config: ContractConfig = {
              name: contractName || 'MyContract',
              symbol: contractName?.substring(0, 3).toUpperCase() || 'MC',
            }
            solidityCode = generateContractByType(featureId, config)
            console.log(`✅ Código generado desde wizard template: ${featureId}`)
          } else {
            // It's a feature ID - try to map to wizard template
            const featureToWizardMap: Record<string, string> = {
              'loyalty': 'loyalty-rewards',
              'certificates': 'nft-collection',
              'governance': 'governance-dao',
              'marketplace': 'marketplace',
            }
            const wizardTemplateId = featureToWizardMap[featureId]

            if (wizardTemplateId) {
              const config: ContractConfig = {
                name: contractName || 'MyContract',
                symbol: contractName?.substring(0, 3).toUpperCase() || 'MC',
              }
              solidityCode = generateContractByType(wizardTemplateId, config)
              console.log(`✅ Código generado desde feature mapeada: ${featureId} -> ${wizardTemplateId}`)
            } else {
              // Unknown feature - generate basic contract
              const config: ContractConfig = {
                name: contractName || 'MyContract',
              }
              solidityCode = generateContractByType('basic', config)
              console.log(`⚠️ Feature desconocida, generando contrato básico`)
            }
          }
        } else if (selectedFeatures.length > 1) {
          // Si hay múltiples features, generar contrato combinado
          console.log(`🔀 Múltiples features (${selectedFeatures.length}), generando contrato combinado`)
          solidityCode = generateCombinedContract()
        } else {
          // Si no hay features seleccionadas o es manual, generar contrato básico
          console.log(`📝 Generando contrato básico por defecto`)
          const config: ContractConfig = {
            name: contractName || 'MyContract',
          }
          solidityCode = generateContractByType('basic', config)
        }

        finalCode = solidityCode
      }

      // Asegurar que hay código generado
      if (!finalCode || finalCode.trim().length === 0) {
        console.warn('⚠️ No se generó código, usando fallback')
        const config: ContractConfig = {
          name: contractName || 'MyContract',
        }
        finalCode = generateContractByType('basic', config)
      }

      console.log(`✅ Código final generado (${finalCode.length} caracteres)`)
      setGeneratedCode(finalCode)
      onCodeGenerated(finalCode)

      return finalCode
    } catch (error: unknown) {
      console.error('❌ Error generating code:', error)
      const msg = error instanceof Error ? error.message : String(error)
      const errorCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Error generando código: ${msg}
// Por favor, verifica que los bloques estén correctamente configurados

contract ${contractName || 'MyContract'} {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    receive() external payable {}
}`
      setGeneratedCode(errorCode)
      onCodeGenerated(errorCode)
      return errorCode
    }
  }

  const generateCombinedContract = () => {
    const contractName = 'MyContract'
    
    let solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ${contractName} {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }`
    
    // Añadir funcionalidades basadas en features seleccionadas
    selectedFeatures.forEach(featureId => {
      const feature = CONTRACT_FEATURES.find(f => f.id === featureId)
      if (feature) {
        solidityCode += `\n\n    // Funciones de ${feature.name}:`
        
        switch (featureId) {
          case 'loyalty':
            solidityCode += `
    string public name = "Puntos de Lealtad";
    string public symbol = "PTS";
    uint8 public decimals = 18;
    uint256 public totalSupply = 0;
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public lastPurchase;
    
    function awardPoints(address to, uint256 amount) public onlyOwner {
        totalSupply += amount;
        balanceOf[to] += amount;
        lastPurchase[to] = block.timestamp;
    }
    
    function redeemPoints(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Puntos insuficientes");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
    }`
            break
          case 'certificates':
            solidityCode += `
    uint256 public nextTokenId = 1;
    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => string) public certificateData;
    mapping(address => uint256) public certificateBalance;
    
    function issueCertificate(address to, string memory data) public onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId++;
        ownerOf[tokenId] = to;
        certificateData[tokenId] = data;
        certificateBalance[to]++;
        return tokenId;
    }
    
    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        return ownerOf[tokenId] != address(0);
    }`
            break
          case 'governance':
            solidityCode += `
    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 endTime;
        bool executed;
        address proposer;
    }
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public nextProposalId = 1;
    uint256 public votingDuration = 7 days;
    
    function createProposal(string memory description) public onlyOwner returns (uint256) {
        uint256 proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            description: description,
            yesVotes: 0,
            noVotes: 0,
            endTime: block.timestamp + votingDuration,
            executed: false,
            proposer: msg.sender
        });
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) public {
        require(block.timestamp <= proposals[proposalId].endTime, "Votación cerrada");
        require(!hasVoted[proposalId][msg.sender], "Ya votaste");
        
        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            proposals[proposalId].yesVotes++;
        } else {
            proposals[proposalId].noVotes++;
        }
    }`
            break
          case 'marketplace':
            solidityCode += `
    struct Product {
        uint256 id;
        address seller;
        string name;
        uint256 price;
        bool isActive;
        string description;
    }
    mapping(uint256 => Product) public products;
    uint256 public nextProductId = 1;
    uint256 public platformFee = 250; // 2.5%
    
    function listProduct(string memory name, uint256 price, string memory description) public returns (uint256) {
        uint256 productId = nextProductId++;
        products[productId] = Product({
            id: productId,
            seller: msg.sender,
            name: name,
            price: price,
            isActive: true,
            description: description
        });
        return productId;
    }
    
    function buyProduct(uint256 productId) public payable {
        Product storage product = products[productId];
        require(product.isActive, "Producto no disponible");
        require(msg.value >= product.price, "Pago insuficiente");
        
        product.isActive = false;
        
        uint256 fee = (product.price * platformFee) / 10000;
        uint256 sellerAmount = product.price - fee;
        
        payable(product.seller).transfer(sellerAmount);
        if (fee > 0) {
            payable(owner).transfer(fee);
        }
    }`
            break
        }
      }
    })
    
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
  }

  const handleNext = () => {
    console.log('🔄 handleNext llamado')
    console.log('📦 selectedFeatures:', selectedFeatures)
    console.log('📝 contractName:', contractName)
    console.log('💻 generatedCode length:', generatedCode.length)

    if (selectedFeatures.length === 0) {
      console.warn('⚠️ No hay features seleccionadas')
      return
    }

    if (!contractName) {
      console.log('⚠️ No hay nombre de contrato, mostrando diálogo')
      setShowNameDialog(true)
      return
    }

    // Generar código antes de continuar
    console.log('⚙️ Generando código...')
    const code = generateCode()

    // Dar tiempo a que el estado se actualice antes de continuar
    setTimeout(() => {
      console.log('✅ Código generado, continuando al deployment')
      console.log('📄 Código a deployar:', code.substring(0, 100) + '...')
      onNext()
    }, 100)
  }

  const handleNameConfirm = () => {
    if (contractName.trim()) {
      setShowNameDialog(false)
      generateCode()
      onNext()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Tabs principales: Plantillas | Funcionalidades | Editor */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={mainTab === 'wizard' ? 0 : mainTab === 'features' ? 1 : 2}
                onChange={(_, newValue) => setMainTab(['wizard', 'features', 'blockly'][newValue] as 'wizard' | 'features' | 'blockly')}
              >
                <Tab label="📋 Plantillas Disponibles" />
                <Tab label="🔧 Funcionalidades" />
                <Tab label="⚙️ Editor Visual" disabled={selectedFeatures.length === 0} />
              </Tabs>
            </Box>

            <Box sx={{ p: 4, minHeight: 300 }}>
              {/* TAB 0: PLANTILLAS */}
              {mainTab === 'wizard' && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesome color="primary" />
                    Elige una Plantilla para Empezar
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Selecciona una plantilla predefinida con bloques precargados. Puedes personalizarla después.
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                    {WIZARD_TEMPLATES.map((template) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          sx={{
                            cursor: 'pointer',
                            height: '100%',
                            border: '2px solid transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: 3,
                            },
                          }}
                          onClick={() => {
                            setContractName(template.name)
                            handleWizardTemplate(template)
                          }}
                        >
                          <CardContent>
                            <Typography variant="h2" sx={{ fontSize: '3rem', mb: 1 }}>
                              {template.icon}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                              {template.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                              {template.description}
                            </Typography>
                            <Chip label={`${template.blocks.length} bloques`} size="small" variant="outlined" />
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </Box>

                  <Box sx={{ mt: 4 }}>
                    <Button
                      variant="text"
                      onClick={handleSkipWizard}
                      fullWidth
                      sx={{ textTransform: 'none' }}
                    >
                      O crear un contrato desde cero con funcionalidades personalizadas →
                    </Button>
                  </Box>
                </Box>
              )}

              {/* TAB 1: FUNCIONALIDADES */}
              {mainTab === 'features' && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build color="primary" />
                    Selecciona Funcionalidades Personalizadas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Combina las funcionalidades que necesites para tu contrato:
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    {CONTRACT_FEATURES.map((feature) => (
                      <motion.div
                        key={feature.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: selectedFeatures.includes(feature.id) ? '2px solid' : '1px solid',
                            borderColor: selectedFeatures.includes(feature.id) ? 'primary.main' : 'divider',
                            backgroundColor: selectedFeatures.includes(feature.id) ? 'primary.50' : 'background.paper',
                            transition: 'all 0.2s',
                          }}
                          onClick={() => handleFeatureToggle(feature.id)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              {feature.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {feature.description}
                            </Typography>
                            <Chip
                              label={feature.category.toUpperCase()}
                              size="small"
                              sx={{ mt: 1 }}
                              color={selectedFeatures.includes(feature.id) ? 'primary' : 'default'}
                            />
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={() => setMainTab('blockly')}
                      disabled={selectedFeatures.length === 0}
                      fullWidth
                    >
                      Continuar al Editor Visual →
                    </Button>
                  </Box>
                </Box>
              )}

              {/* TAB 2: EDITOR BLOCKLY */}
              {mainTab === 'blockly' && selectedFeatures.length > 0 && (
                <Box>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                      value={blocklyTab}
                      onChange={(_, newValue) => setBlocklyTab(newValue)}
                    >
                      <Tab label="Diseñador Visual" icon={<Build />} />
                      <Tab label="Código Generado" icon={<Code />} />
                      <Tab label="Vista Previa" icon={<Preview />} />
                    </Tabs>
                  </Box>

                  <Box sx={{ minHeight: 400 }}>
                    {blocklyTab === 0 && (
                      <Box sx={{ height: 500, position: 'relative' }}>
                        <Box
                          ref={blocklyDiv}
                          sx={{
                            height: '100%',
                            width: '100%',
                            border: '1px solid #ddd',
                            borderRadius: 1,
                            backgroundColor: '#f9f9f9',
                          }}
                        />
                      </Box>
                    )}

                    {blocklyTab === 1 && (
                      <Paper sx={{ p: 2, backgroundColor: 'grey.50', minHeight: 400 }}>
                        <Typography variant="h6" gutterBottom>
                          Código Solidity Generado:
                        </Typography>
                        <TextField
                          multiline
                          fullWidth
                          rows={15}
                          value={generatedCode}
                          variant="outlined"
                          InputProps={{
                            readOnly: true,
                            sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                          }}
                        />
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={generateCode}
                          >
                            {workspace.current ? 'Regenerar' : 'Generar'} Código
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<Save />}
                            onClick={() => {
                              const blob = new Blob([generatedCode], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${contractName || 'contract'}.sol`
                              a.click()
                              URL.revokeObjectURL(url)
                            }}
                          >
                            Descargar
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<AutoAwesome />}
                            onClick={openWizard}
                            size="small"
                          >
                            Cargar otra plantilla
                          </Button>
                        </Box>
                      </Paper>
                    )}

                    {blocklyTab === 2 && (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                          Vista Previa del Contrato
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {selectedWizardTemplate ? `Plantilla: ${selectedWizardTemplate.name}` : 'Contrato personalizado'}
                        </Typography>
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Esta funcionalidad estará disponible en la próxima versión
                        </Alert>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Botones de navegación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button onClick={onBack} variant="outlined">
            Atrás
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setMainTab('wizard')}
              disabled={mainTab === 'wizard'}
            >
              Ver Plantillas
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={selectedFeatures.length === 0 || !contractName}
              startIcon={<Add />}
            >
              Continuar al Despliegue
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Dialog para nombre del contrato */}
      <Dialog open={showNameDialog} onClose={() => setShowNameDialog(false)}>
        <DialogTitle>Nombre del Contrato</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del contrato"
            fullWidth
            variant="outlined"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            placeholder="MiContratoInteligente"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            El nombre debe seguir las convenciones de Solidity (CamelCase, sin espacios)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNameDialog(false)}>Cancelar</Button>
          <Button onClick={handleNameConfirm} disabled={!contractName.trim()}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  )
}

export default ContractBuilder
