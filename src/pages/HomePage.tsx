import React, { useState } from 'react'
import { Box, Container, Typography, Stepper, Step, StepLabel, StepContent } from '@mui/material'
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
            onCodeGenerated={setContractCode}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 2:
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

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                onClick={() => handleStepClick(index)}
                sx={{
                  cursor: index <= activeStep ? 'pointer' : 'default',
                  '& .MuiStepLabel-label': {
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: index <= activeStep ? 'primary.main' : 'text.disabled',
                  },
                  '& .MuiStepLabel-iconContainer': {
                    cursor: index <= activeStep ? 'pointer' : 'default',
                  },
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {step.description}
                </Typography>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent(index)}
                  </motion.div>
                </AnimatePresence>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Container>
    </Box>
  )
}

export default HomePage
