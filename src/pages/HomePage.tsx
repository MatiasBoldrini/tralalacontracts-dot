import React, { useState } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  WalletConnection, 
  ContractBuilder, 
  DeploymentPanel, 
  ContractVisualizer, 
  TestPage 
} from '../components'
import { VideoHeader } from '../shared'
import { WalletAccount } from '../types'

const steps = [
  {
    label: 'Conectar Wallet',
    description: 'Conecta tu wallet para interactuar con Polkadot',
  },
  {
    label: 'Diseñar Contrato',
    description: 'Crea tu contrato inteligente usando bloques visuales',
  },
  {
    label: 'Desplegar',
    description: 'Despliega tu contrato en la red de prueba',
  },
  {
    label: 'Visualizar',
    description: 'Explora tu contrato desplegado',
  },
  {
    label: 'Probar',
    description: 'Interactúa con tu contrato en la página de pruebas',
  },
]

const HomePage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [connectedAccount, setConnectedAccount] = useState<WalletAccount | null>(null)
  const [contractCode, setContractCode] = useState<string>('')
  const [deployedContract, setDeployedContract] = useState<any>(null)

  // Handler mejorado para recibir código del ContractBuilder
  const handleCodeGenerated = (code: string) => {
    console.log('🏠 HomePage recibió código del ContractBuilder')
    console.log('📄 Tamaño del código:', code.length, 'caracteres')
    console.log('📝 Preview:', code.substring(0, 150) + '...')
    setContractCode(code)
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleStepClick = (stepIndex: number) => {
    // Permitir navegación solo a pasos anteriores o al paso actual
    if (stepIndex <= activeStep) {
      setActiveStep(stepIndex)
    }
  }

  const handleReset = () => {
    setActiveStep(0)
    setConnectedAccount(null)
    setContractCode('')
    setDeployedContract(null)
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <WalletConnection
            onConnect={setConnectedAccount}
            onNext={handleNext}
          />
        )
      case 1:
        return (
          <ContractBuilder
            onCodeGenerated={handleCodeGenerated}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 2:
        console.log('🚀 Renderizando DeploymentPanel con código:', contractCode.length, 'caracteres')
        return (
          <DeploymentPanel
            contractCode={contractCode}
            account={connectedAccount}
            onBack={handleBack}
          />
        )
      case 3:
        return (
          <ContractVisualizer
            contract={deployedContract}
            onBack={handleBack}
            onReset={handleReset}
          />
        )
      case 4:
        return (
          <TestPage
            contractAddress={deployedContract?.address}
          />
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <VideoHeader />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            component="p"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Crea contratos inteligentes en Polkadot de forma visual y sencilla
          </Typography>
        </motion.div>

        {/* Custom Stepper */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 4,
            maxWidth: '800px',
            position: 'relative',
            mx: 'auto',
          }}
        >
          {/* Background Line */}
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: '5%',
              right: '5%',
              height: '2px',
              backgroundColor: '#E5E5E5',
              zIndex: 1,
            }}
          />

          {/* Steps */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {steps.map((step, index) => (
              <Box
                key={step.label}
                onClick={() => handleStepClick(index)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: index <= activeStep ? 'pointer' : 'default',
                  px: 1,
                }}
              >
                {/* Step Number Circle */}
                <Box
                  sx={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: activeStep >= index ? '#0047AB' : '#E5E5E5',
                    color: activeStep >= index ? 'white' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '1rem',
                    mb: 1,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {index + 1}
                </Box>

                {/* Step Label */}
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#000000',
                    textAlign: 'center',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                    maxWidth: '70px',
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            {steps[activeStep].description}
          </Typography>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent(activeStep)}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  )
}

export default HomePage
