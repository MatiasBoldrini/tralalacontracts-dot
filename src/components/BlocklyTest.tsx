import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Typography, Alert, Paper } from '@mui/material'
import * as Blockly from 'blockly'
import { createCustomBlocks, generateSolidityCode, BLOCKLY_CONFIG } from '../utils/blocklyConfig'

const BlocklyTest: React.FC = () => {
  const blocklyDiv = useRef<HTMLDivElement>(null)
  const workspace = useRef<Blockly.WorkspaceSvg | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (blocklyDiv.current && !isInitialized) {
      initializeBlockly()
    }
  }, [isInitialized])

  const initializeBlockly = () => {
    if (!blocklyDiv.current) return

    try {
      // Verificar que Blockly esté disponible
      if (!Blockly || !Blockly.inject) {
        console.error('Blockly no está disponible')
        setGeneratedCode('// Error: Blockly no está disponible')
        return
      }

      // Crear bloques personalizados
      createCustomBlocks()

      // Crear toolbox de prueba con algunos bloques
      const testToolbox = {
        kind: 'categoryToolbox',
        contents: [
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
            name: 'Tokens',
            colour: '#4CAF50',
            contents: [
              {
                kind: 'block',
                type: 'token_create',
              },
              {
                kind: 'block',
                type: 'token_mint',
              },
              {
                kind: 'block',
                type: 'token_transfer',
              },
            ],
          },
          {
            kind: 'category',
            name: 'NFTs',
            colour: '#9C27B0',
            contents: [
              {
                kind: 'block',
                type: 'nft_create',
              },
              {
                kind: 'block',
                type: 'nft_mint',
              },
            ],
          },
          {
            kind: 'category',
            name: 'Gobernanza',
            colour: '#FF9800',
            contents: [
              {
                kind: 'block',
                type: 'proposal_create',
              },
              {
                kind: 'block',
                type: 'vote_cast',
              },
            ],
          },
          {
            kind: 'category',
            name: 'Marketplace',
            colour: '#2196F3',
            contents: [
              {
                kind: 'block',
                type: 'item_list',
              },
              {
                kind: 'block',
                type: 'item_buy',
              },
            ],
          },
        ],
      }

      // Inicializar workspace
      workspace.current = Blockly.inject(blocklyDiv.current, {
        ...BLOCKLY_CONFIG,
        toolbox: testToolbox,
      })

      // Escuchar cambios en el workspace
      workspace.current.addChangeListener(() => {
        if (workspace.current) {
          try {
            const code = generateSolidityCode(workspace.current, 'TestContract')
            setGeneratedCode(code)
          } catch (error: unknown) {
            console.error('Error generating code:', error)
            const msg = error instanceof Error ? error.message : String(error)
            setGeneratedCode(`// Error: ${msg}`)
          }
        }
      })

      // Generar código inicial
      if (workspace.current) {
        const initialCode = generateSolidityCode(workspace.current, 'TestContract')
        setGeneratedCode(initialCode)
      }

      setIsInitialized(true)
    } catch (error: unknown) {
      console.error('Error initializing Blockly test:', error)
      const msg = error instanceof Error ? error.message : String(error)
      setGeneratedCode(`// Error inicializando Blockly: ${msg}`)
    }
  }

  const testCodeGeneration = () => {
    if (workspace.current) {
      try {
        const code = generateSolidityCode(workspace.current, 'TestContract')
        setGeneratedCode(code)
        console.log('Generated code:', code)
      } catch (error: unknown) {
        console.error('Error in test generation:', error)
        const msg = error instanceof Error ? error.message : String(error)
        setGeneratedCode(`// Error: ${msg}`)
      }
    }
  }

  const addTestBlock = (blockType: string) => {
    if (workspace.current) {
      try {
        const block = workspace.current.newBlock(blockType)
        block.initSvg()
        block.render()
        block.moveBy(100, 100)
      } catch (error) {
        console.error('Error adding test block:', error)
      }
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Prueba de Generación de Código Blockly
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Esta es una página de prueba para verificar que la generación de código desde bloques de Blockly funciona correctamente.
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={testCodeGeneration}>
          Generar Código
        </Button>
        <Button variant="outlined" onClick={() => addTestBlock('token_create')}>
          Añadir Bloque Token
        </Button>
        <Button variant="outlined" onClick={() => addTestBlock('nft_create')}>
          Añadir Bloque NFT
        </Button>
        <Button variant="outlined" onClick={() => addTestBlock('proposal_create')}>
          Añadir Bloque Propuesta
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, height: '500px' }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Área de Trabajo Blockly
          </Typography>
          <div
            ref={blocklyDiv}
            style={{
              width: '100%',
              height: '400px',
              border: '1px solid #ccc',
            }}
          />
        </Paper>

        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Código Generado
          </Typography>
          <pre
            style={{
              width: '100%',
              height: '400px',
              overflow: 'auto',
              backgroundColor: '#f5f5f5',
              padding: '10px',
              border: '1px solid #ddd',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            {generatedCode}
          </pre>
        </Paper>
      </Box>
    </Box>
  )
}

export default BlocklyTest
