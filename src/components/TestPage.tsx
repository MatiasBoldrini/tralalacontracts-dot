import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Chip,
  Paper,
  Divider,
  Link,
  CircularProgress,
  Snackbar,
} from '@mui/material'
import {
  AccountBalanceWallet,
  Code,
  Visibility,
  CheckCircle,
  ContentCopy,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { usePolkadot } from '../hooks/usePolkadot'
import BlocklyTest from './BlocklyTest'

interface TestPageProps {
  contractAddress?: string
}

const TestPage: React.FC<TestPageProps> = ({
  contractAddress = '0x1234567890123456789012345678901234567890',
}) => {
  const { isConnected } = usePolkadot()
  const [contractData, setContractData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string>('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [writeFunction, setWriteFunction] = useState('')
  const [writeParams, setWriteParams] = useState('')

  // Verificar que estamos en la red correcta (testnet Paseo)
  const isCorrectNetwork = true // En una implementación real, verificaríamos la red

  useEffect(() => {
    if (isConnected && contractAddress) {
      initializeContract()
    }
  }, [isConnected, contractAddress])

  const initializeContract = async () => {
    try {
      setLoading(true)
      // Aquí se inicializaría el contrato con la dirección y ABI
      // Por ahora simulamos datos
      setContractData({
        name: 'Mi Contrato',
        symbol: 'MC',
        totalSupply: '1000000',
        owner: '0x1234567890123456789012345678901234567890',
        balance: '0.5 ETH'
      })
    } catch (error) {
      console.error('Error inicializando contrato:', error)
      showSnackbar('Error al inicializar el contrato', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleWriteFunction = async () => {
    if (!writeFunction.trim()) {
      showSnackbar('Por favor ingresa una función', 'error')
      return
    }

    try {
      setLoading(true)
      // Simular transacción
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64)
      setTxHash(mockTxHash)
      showSnackbar('Transacción enviada exitosamente', 'success')

      // Actualizar datos del contrato
      setContractData((prev: any) => ({
        ...prev,
        lastUpdate: new Date().toLocaleString()
      }))
    } catch (error) {
      console.error('Error en transacción:', error)
      showSnackbar('Error en la transacción', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSnackbar('Copiado al portapapeles', 'success')
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            component="h1"
            textAlign="center"
            sx={{ mb: 2, background: 'linear-gradient(45deg, #6366f1, #ec4899)',
                 backgroundClip: 'text',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent' }}
          >
            Página de Pruebas
          </Typography>
          
          <Typography
            variant="h6"
            component="p"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Interfaz para probar tu contrato inteligente desplegado en Polkadot
          </Typography>
        </motion.div>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Conexión de Wallet */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceWallet color="primary" />
                  Conexión de Wallet
                </Typography>

                {!isConnected ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Button
                      variant="contained"
                      disabled
                      startIcon={<AccountBalanceWallet />}
                      size="large"
                    >
                      Conectar Wallet
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Conecta tu wallet para interactuar con el contrato
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Wallet conectada:</strong> 0x...
                      </Typography>
                    </Alert>

                    <Alert
                      severity={isCorrectNetwork ? "success" : "error"}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="body2">
                        <strong>Red:</strong> {isCorrectNetwork ? 'Testnet Paseo (Correcta)' : 'Red incorrecta'}
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Información del Contrato */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Code color="primary" />
                  Información del Contrato
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Dirección del Contrato:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {contractAddress}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<ContentCopy />}
                      onClick={() => copyToClipboard(contractAddress)}
                    >
                      Copiar
                    </Button>
                  </Box>
                </Box>

                <Link
                  href={`https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
                >
                  <Visibility fontSize="small" />
                  Ver en Block Explorer
                </Link>
              </CardContent>
            </Card>
          </Box>

          {/* Funciones de Escritura */}
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Funciones de Escritura (Write)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Ejecuta funciones que modifican el estado del contrato
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="Función a ejecutar"
                      placeholder="mint, transfer, vote, etc."
                      value={writeFunction}
                      onChange={(e) => setWriteFunction(e.target.value)}
                      variant="outlined"
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="Parámetros (JSON)"
                      placeholder='{"to": "0x...", "amount": 100}'
                      value={writeParams}
                      onChange={(e: any) => setWriteParams(e.target.value)}
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleWriteFunction}
                    disabled={!isConnected || loading || !writeFunction.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <Code />}
                  >
                    {loading ? 'Enviando...' : 'Ejecutar Función'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setWriteFunction('mint')
                      setWriteParams('{"to": "0x...", "amount": 1000}')
                    }}
                  >
                    Ejemplo: Mint
                  </Button>
                </Box>

                {txHash && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Transacción enviada:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {txHash}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ContentCopy />}
                        onClick={() => copyToClipboard(txHash)}
                      >
                        Copiar
                      </Button>
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Visualización de Lectura */}
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility color="primary" />
                  Visualización de Lectura (Read)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Datos actuales del contrato en la blockchain
                </Typography>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {Object.entries(contractData).map(([key, value]) => (
                      <Box key={key}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Typography>
                          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                            {String(value)}
                          </Typography>
                        </Paper>
                      </Box>
                    ))}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckCircle />}
                    label="Contrato Verificado"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label="Testnet Paseo"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label="Solidity ^0.8.28"
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Prueba de Blockly */}
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Code color="primary" />
                  Prueba de Generación de Código Blockly
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Prueba la funcionalidad de generación de código desde bloques visuales
                </Typography>
                <BlocklyTest />
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}

export default TestPage
