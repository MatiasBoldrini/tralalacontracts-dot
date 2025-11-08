import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material'
import { motion } from 'framer-motion'
import { Download, Refresh, CheckCircle } from '@mui/icons-material'

const SubWalletHelper: React.FC = () => {
  const steps = [
    {
      label: 'Instalar SubWallet',
      description: 'Descarga e instala la extensión de SubWallet',
      content: (
        <Box>
          <Typography variant="body2" gutterBottom>
            1. Ve a <a href="https://subwallet.app/" target="_blank" rel="noopener noreferrer">subwallet.app</a>
          </Typography>
          <Typography variant="body2" gutterBottom>
            2. Haz clic en "Download" o "Install Extension"
          </Typography>
          <Typography variant="body2" gutterBottom>
            3. Añade la extensión a tu navegador
          </Typography>
          <Button
            variant="contained"
            startIcon={<Download />}
            href="https://subwallet.app/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 2 }}
          >
            Ir a SubWallet
          </Button>
        </Box>
      ),
    },
    {
      label: 'Configurar Cuenta',
      description: 'Crea o importa una cuenta en SubWallet',
      content: (
        <Box>
          <Typography variant="body2" gutterBottom>
            1. Abre la extensión de SubWallet
          </Typography>
          <Typography variant="body2" gutterBottom>
            2. Crea una nueva cuenta o importa una existente
          </Typography>
          <Typography variant="body2" gutterBottom>
            3. Asegúrate de que la cuenta esté desbloqueada
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Puedes crear múltiples cuentas en SubWallet para diferentes propósitos.
          </Alert>
        </Box>
      ),
    },
    {
      label: 'Configurar Red',
      description: 'Añade Polkadot Hub TestNet a SubWallet',
      content: (
        <Box>
          <Typography variant="body2" gutterBottom>
            1. En SubWallet, ve a "Settings" → "Networks"
          </Typography>
          <Typography variant="body2" gutterBottom>
            2. Busca "Polkadot Hub" o "Paseo"
          </Typography>
          <Typography variant="body2" gutterBottom>
            3. Activa la red si no está habilitada
          </Typography>
          <Typography variant="body2" gutterBottom>
            4. Cambia a la red de prueba
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Asegúrate de estar conectado a la red de prueba, no a mainnet.
          </Alert>
        </Box>
      ),
    },
    {
      label: 'Obtener Tokens',
      description: 'Consigue tokens DOT de prueba',
      content: (
        <Box>
          <Typography variant="body2" gutterBottom>
            1. Ve al <a href="https://faucet.polkadot.io/?parachain=1111" target="_blank" rel="noopener noreferrer">faucet de Polkadot</a>
          </Typography>
          <Typography variant="body2" gutterBottom>
            2. Conecta tu wallet de SubWallet
          </Typography>
          <Typography variant="body2" gutterBottom>
            3. Solicita tokens de prueba
          </Typography>
          <Typography variant="body2" gutterBottom>
            4. Espera a que lleguen a tu cuenta
          </Typography>
          <Button
            variant="outlined"
            href="https://faucet.polkadot.io/?parachain=1111"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 2 }}
          >
            Ir al Faucet
          </Button>
        </Box>
      ),
    },
    {
      label: 'Recargar Página',
      description: 'Actualiza Tralala Contracts para detectar SubWallet',
      content: (
        <Box>
          <Typography variant="body2" gutterBottom>
            1. Cierra todas las pestañas de Tralala Contracts
          </Typography>
          <Typography variant="body2" gutterBottom>
            2. Recarga esta página
          </Typography>
          <Typography variant="body2" gutterBottom>
            3. SubWallet debería aparecer como disponible
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Recargar Página
          </Button>
        </Box>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🔐 Configurar SubWallet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Sigue estos pasos para configurar SubWallet correctamente:
          </Typography>

          <Stepper activeStep={-1} orientation="vertical">
            {steps.map((step) => (
              <Step key={step.label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                  {step.content}
                </StepContent>
              </Step>
            ))}
          </Stepper>

          <Alert severity="success" sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle />
              ¡Listo!
            </Typography>
            <Typography variant="body2">
              Una vez completados todos los pasos, SubWallet debería aparecer como disponible 
              en Tralala Contracts y podrás conectar tu wallet sin problemas.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default SubWalletHelper











