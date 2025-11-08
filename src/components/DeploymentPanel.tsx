import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  Link as LinkIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { WalletAccount } from '../types'
import { usePolkadotApi, useContractDeployment } from '../hooks/usePolkadot'
import { estimateDeploymentGas } from '../utils/deploymentUtils'

interface DeploymentPanelProps {
  contractCode: string
  account: WalletAccount | null
  onBack: () => void
}

const DEPLOYMENT_STEPS = [
  'Validar código',
  'Compilar contrato',
  'Estimar gas',
  'Firmar transacción',
  'Enviar a blockchain',
  'Confirmar deployment',
]

const DeploymentPanel: React.FC<DeploymentPanelProps> = ({
  contractCode,
  account,
  onBack,
}) => {
  const { api, isConnected: isApiConnected } = usePolkadotApi()
  const { isDeploying, deploymentError, deploymentProgress, deployedContract, deployContract, reset } = useContractDeployment()

  const [contractName, setContractName] = useState('MiContrato')
  const [gasEstimate, setGasEstimate] = useState<string>('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (contractCode) {
      // Extraer nombre del contrato del código (solo caracteres válidos: letras, números, _)
      const contractMatch = contractCode.match(/contract\s+([\w]+)/)
      if (contractMatch) {
        const extractedName = contractMatch[1]
        // Si el nombre extraído tiene espacios o caracteres inválidos, usar nombre por defecto
        if (/^[\w]+$/.test(extractedName)) {
          setContractName(extractedName)
        } else {
          setContractName('MiContrato')
        }
      } else {
        // Si no se puede extraer, usar nombre por defecto
        setContractName('MiContrato')
      }

      // Calcular estimación de gas
      const estimate = estimateDeploymentGas(contractCode)
      setGasEstimate(estimate.gasLimit)
    }
  }, [contractCode])

  // Actualizar paso actual basado en el progreso del deployment
  useEffect(() => {
    if (deploymentProgress) {
      setCurrentStep(deploymentProgress.step)
    }
  }, [deploymentProgress])

  // Mostrar diálogo de éxito cuando el contrato se despliega
  useEffect(() => {
    if (deployedContract && deployedContract.status === 'success') {
      setShowSuccessDialog(true)
    }
  }, [deployedContract])

  const handleDeploy = async () => {
    if (!account) {
      console.error('❌ Wallet no conectada')
      return
    }

    if (!isApiConnected) {
      console.error('❌ API de Polkadot no conectada')
      return
    }

    if (!api) {
      console.error('❌ Instancia de API no disponible')
      return
    }

    if (!api.tx || !api.tx.contracts) {
      console.error('❌ Pallet de contratos no disponible en esta red')
      return
    }

    setCurrentStep(0)
    const result = await deployContract(contractCode, contractName, account, api)

    if (result && result.status === 'success') {
      console.log('✅ Contrato desplegado exitosamente:', result)
    } else {
      console.error('❌ Error en deployment:', deploymentError)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    reset()
    // Aquí podrías redirigir al usuario a la siguiente página o mostrar los detalles del contrato
  }

  const getStepIcon = (step: number) => {
    if (step < currentStep) return <CheckCircle color="success" />
    if (step === currentStep) return <CloudUpload color="primary" />
    return <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#e0e0e0' }} />
  }

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed'
    if (step === currentStep) return 'active'
    return 'pending'
  }

  const getStepDescription = (index: number) => {
    switch (index) {
      case 0:
        return 'Verificando sintaxis y estructura del código Solidity'
      case 1:
        return 'Compilando código Solidity a bytecode (solc)'
      case 2:
        return 'Calculando el costo de gas para el deployment'
      case 3:
        return 'Esperando firma de la transacción en tu wallet'
      case 4:
        return 'Enviando transacción a la red Polkadot'
      case 5:
        return 'Confirmando que el contrato se desplegó correctamente'
      default:
        return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Estado de la conexión API */}
        {!isApiConnected && (
          <Alert severity="warning" icon={<InfoIcon />}>
            Conectando a Paseo Testnet... Por favor espera.
          </Alert>
        )}

        {/* Información del Deployment */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUpload color="primary" />
              Desplegar Contrato en Testnet
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Información del Contrato
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Nombre:</strong> {contractName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Red:</strong> Paseo Testnet
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cuenta:</strong> {account?.address.slice(0, 10)}...{account?.address.slice(-10)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              <Box>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Costos Estimados
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Gas estimado:</strong> {gasEstimate || 'Calculando...'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Red:</strong> Testnet - Sin costo real
                    </Typography>
                    <Chip label="TestNet - Tokens Gratis" color="success" size="small" />
                  </Box>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Stepper de Deployment */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Proceso de Deployment
            </Typography>

            <Stepper activeStep={currentStep} orientation="vertical">
              {DEPLOYMENT_STEPS.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    StepIconComponent={() => getStepIcon(index)}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: getStepStatus(index) === 'completed' ? 600 : 400,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {getStepDescription(index)}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {isDeploying && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {deploymentProgress?.message || 'Procesando... Por favor no cierres esta ventana'}
                </Typography>
              </Box>
            )}

            {deploymentError && (
              <Alert severity="error" sx={{ mt: 3 }}>
                <ErrorIcon sx={{ mr: 1 }} />
                <Box>
                  <strong>Error en deployment:</strong>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {deploymentError}
                  </Typography>
                </Box>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Código del Contrato */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Código a Desplegar
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                {contractCode}
              </pre>
            </Paper>
          </CardContent>
        </Card>

        {/* Botones de navegación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={onBack} disabled={isDeploying}>
            Atrás
          </Button>
          <Button
            variant="contained"
            onClick={handleDeploy}
            disabled={isDeploying || !account || !contractCode || !isApiConnected}
            startIcon={<CloudUpload />}
            size="large"
          >
            {isDeploying ? 'Desplegando...' : 'Desplegar en Testnet'}
          </Button>
        </Box>
      </Box>

      {/* Dialog de éxito */}
      <Dialog open={showSuccessDialog} onClose={handleSuccessClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5">
            ¡Contrato Desplegado Exitosamente!
          </Typography>
        </DialogTitle>
        <DialogContent>
          {deployedContract && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {deployedContract.contract.name}
              </Typography>

              <Paper sx={{ p: 2, backgroundColor: 'grey.50', mb: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  <strong>Transacción:</strong> {deployedContract.transactionHash}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Bloque:</strong> {deployedContract.blockNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Gas Utilizado:</strong> {deployedContract.gasUsed}
                </Typography>
                <Typography variant="body2">
                  <strong>Tiempo de Despliegue:</strong> {deployedContract.deploymentTime ? `${(deployedContract.deploymentTime / 1000).toFixed(2)}s` : 'N/A'}
                </Typography>
              </Paper>

              <Alert severity="info">
                El contrato se ha desplegado en Paseo Testnet. Puedes verificar la transacción en el explorador.
              </Alert>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  href={deployedContract.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Ver en Block Explorer
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={handleSuccessClose} size="large">
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  )
}

export default DeploymentPanel

