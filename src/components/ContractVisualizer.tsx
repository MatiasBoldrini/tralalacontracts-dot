import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  Link as LinkIcon,
  ContentCopy,
  PlayArrow,
  Settings,
  AccountBalanceWallet,
  Timeline,
  Code,
  Description,
} from '@mui/icons-material'
import { DeployedContract } from '../types'

interface ContractVisualizerProps {
  contract: DeployedContract | null
  onBack: () => void
  onReset: () => void
}

const ContractVisualizer: React.FC<ContractVisualizerProps> = ({
  contract,
  onBack,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState(0)

  if (!contract) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="warning">
            No hay contrato para visualizar. Por favor despliega un contrato primero.
          </Alert>
          <Button variant="contained" onClick={onBack} sx={{ mt: 2 }}>
            Volver al Deployment
          </Button>
        </CardContent>
      </Card>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const mockFunctions = [
    { name: 'getBalance', type: 'view', inputs: [], outputs: ['uint256'], description: 'Obtiene el balance del contrato' },
    { name: 'withdraw', type: 'function', inputs: [], outputs: [], description: 'Retira todos los fondos' },
    { name: 'owner', type: 'view', inputs: [], outputs: ['address'], description: 'Dirección del propietario' },
  ]

  const mockEvents = [
    { name: 'Withdrawal', inputs: [{ name: 'amount', type: 'uint256' }], description: 'Emitido cuando se retiran fondos' },
    { name: 'OwnershipTransferred', inputs: [{ name: 'previousOwner', type: 'address' }, { name: 'newOwner', type: 'address' }], description: 'Emitido cuando cambia el propietario' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header del Contrato */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {contract.contract.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Contrato desplegado exitosamente en Polkadot Hub TestNet
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Activo" color="success" />
                <Chip label="TestNet" color="info" />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceWallet />
                    Información del Contrato
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 100, fontWeight: 600 }}>
                        Dirección:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                        {contract.address}
                      </Typography>
                      <Tooltip title="Copiar">
                        <IconButton size="small" onClick={() => copyToClipboard(contract.address)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 100, fontWeight: 600 }}>
                        Transacción:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>
                        {contract.transactionHash}
                      </Typography>
                      <Tooltip title="Copiar">
                        <IconButton size="small" onClick={() => copyToClipboard(contract.transactionHash)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2">
                      <strong>Bloque:</strong> {contract.blockNumber.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Gas usado:</strong> {contract.gasUsed}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              <Box>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon />
                    Enlaces Útiles
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<LinkIcon />}
                      href={contract.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                    >
                      Ver en Block Explorer
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Code />}
                      onClick={() => copyToClipboard(contract.contract.code)}
                      size="small"
                    >
                      Copiar Código Fuente
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Settings />}
                      size="small"
                    >
                      Interactuar con Contrato
                    </Button>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Tabs de Visualización */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Funciones" icon={<PlayArrow />} />
                <Tab label="Eventos" icon={<Timeline />} />
                <Tab label="Código Fuente" icon={<Code />} />
                <Tab label="ABI" icon={<Description />} />
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Funciones del Contrato
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Nombre</strong></TableCell>
                          <TableCell><strong>Tipo</strong></TableCell>
                          <TableCell><strong>Entradas</strong></TableCell>
                          <TableCell><strong>Salidas</strong></TableCell>
                          <TableCell><strong>Descripción</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockFunctions.map((func, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{func.name}</TableCell>
                            <TableCell>
                              <Chip 
                                label={func.type} 
                                size="small" 
                                color={func.type === 'view' ? 'info' : 'primary'}
                              />
                            </TableCell>
                            <TableCell>{func.inputs.length}</TableCell>
                            <TableCell>{func.outputs.join(', ')}</TableCell>
                            <TableCell>{func.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Eventos del Contrato
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Nombre</strong></TableCell>
                          <TableCell><strong>Parámetros</strong></TableCell>
                          <TableCell><strong>Descripción</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockEvents.map((event, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{event.name}</TableCell>
                            <TableCell>
                              {event.inputs.map((input, i) => (
                                <Chip
                                  key={i}
                                  label={`${input.name}: ${input.type}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </TableCell>
                            <TableCell>{event.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Código Fuente
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50', maxHeight: 400, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {contract.contract.code}
                    </pre>
                  </Paper>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={() => copyToClipboard(contract.contract.code)}
                    >
                      Copiar Código
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LinkIcon />}
                      onClick={() => {
                        const blob = new Blob([contract.contract.code], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${contract.contract.name}.sol`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      Descargar
                    </Button>
                  </Box>
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    ABI del Contrato
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    El ABI (Application Binary Interface) permite que otras aplicaciones interactúen con tu contrato.
                  </Alert>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {JSON.stringify(contract.contract.abi, null, 2)}
                    </pre>
                  </Paper>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(JSON.stringify(contract.contract.abi, null, 2))}
                    sx={{ mt: 2 }}
                  >
                    Copiar ABI
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Botones de navegación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={onBack}>
            Atrás
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => window.open(contract.explorerUrl, '_blank')}
              startIcon={<LinkIcon />}
            >
              Ver en Explorer
            </Button>
            <Button
              variant="contained"
              onClick={onReset}
              color="primary"
            >
              Crear Nuevo Contrato
            </Button>
          </Box>
        </Box>
      </Box>
    </motion.div>
  )
}

export default ContractVisualizer











