import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  Wallet,
  Security,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { WalletAccount } from '../types'
import SubWalletHelper from './SubWalletHelper'

interface WalletConnectionProps {
  onConnect: (account: WalletAccount) => void
  onNext: () => void
}

const SUPPORTED_WALLETS = [
  {
    id: 'subwallet',
    name: 'SubWallet',
    description: 'Wallet multi-cadena para Polkadot',
    icon: '🔐',
    recommended: true,
  },
]

const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnect, onNext }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<WalletAccount[]>([])
  const [availableExtensions, setAvailableExtensions] = useState<string[]>([])
  const [showSubWalletHelp, setShowSubWalletHelp] = useState(false)

  // Detectar extensiones disponibles al cargar el componente
  useEffect(() => {
    const detectExtensions = async () => {
      try {
        const { web3Enable } = await import('@polkadot/extension-dapp')
        
        // Intentar habilitar extensiones sin esperar respuesta
        web3Enable('Tralala Contracts').then(extensions => {
          console.log('Extensiones disponibles:', extensions.map(ext => ext.name))
          setAvailableExtensions(extensions.map(ext => ext.name.toLowerCase()))
        }).catch(err => {
          console.log('No se pudieron detectar extensiones:', err)
        })
      } catch (err) {
        console.log('Error al detectar extensiones:', err)
      }
    }

    detectExtensions()
  }, [])

  const checkWalletAvailability = async (walletId: string) => {
    try {
      const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp')
      
      // Habilitar extensiones con un timeout más largo
      const extensions = await Promise.race([
        web3Enable('Tralala Contracts'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: No se detectaron extensiones')), 5000)
        )
      ]) as any[]
      
      console.log('Extensiones detectadas:', extensions)
      
      if (extensions.length === 0) {
        throw new Error('No se encontraron extensiones de wallet instaladas. Asegúrate de tener SubWallet instalado y habilitado.')
      }

      // Esperar un poco para que las extensiones se inicialicen
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const availableAccounts = await web3Accounts()
      console.log('Cuentas disponibles:', availableAccounts)

      if (availableAccounts.length === 0) {
        throw new Error('No se encontraron cuentas en el wallet. Asegúrate de crear una cuenta en tu extensión.')
      }

      setAccounts(availableAccounts as WalletAccount[])
      setConnectedWallet(walletId)
      setError(null)
      
      // Seleccionar la primera cuenta por defecto
      if (availableAccounts.length > 0) {
        onConnect(availableAccounts[0] as WalletAccount)
      }
      
      return true
    } catch (err) {
      console.error('Error al conectar wallet:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return false
    }
  }

  const handleWalletConnect = async (walletId: string) => {
    setIsConnecting(true)
    setError(null)
    
    try {
      const success = await checkWalletAvailability(walletId)
      
      if (success) {
        setTimeout(() => {
          onNext()
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleAccountSelect = (account: WalletAccount) => {
    onConnect(account)
  }

  if (connectedWallet && accounts.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                ¡Wallet Conectado!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Selecciona una cuenta para continuar
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Cuentas Disponibles
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {accounts.map((account) => (
                <Box key={account.address}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'primary.50',
                        borderColor: 'primary.main',
                      }
                    }}
                    onClick={() => handleAccountSelect(account)}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {account.meta.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {account.address.slice(0, 10)}...{account.address.slice(-10)}
                          </Typography>
                        </Box>
                        <Chip
                          label={account.meta.source}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={onNext}
                sx={{ minWidth: 200 }}
              >
                Continuar
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Wallet sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Conecta tu Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
              Para crear y desplegar contratos inteligentes, necesitas conectar tu wallet de Polkadot.
              Selecciona una de las opciones recomendadas:
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <ErrorIcon sx={{ mr: 1 }} />
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {SUPPORTED_WALLETS.map((wallet) => {
              const isAvailable = availableExtensions.some(ext =>
                ext.includes(wallet.id) ||
                (wallet.id === 'polkadot-js' && ext.includes('polkadot')) ||
                (wallet.id === 'talisman' && ext.includes('talisman')) ||
                (wallet.id === 'subwallet' && ext.includes('subwallet'))
              )

              return (
                <Box key={wallet.id}>
                  <motion.div
                    whileHover={{ scale: isAvailable ? 1.02 : 1 }}
                    whileTap={{ scale: isAvailable ? 0.98 : 1 }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: isAvailable ? 'pointer' : 'default',
                        position: 'relative',
                        border: wallet.recommended ? '2px solid' : '1px solid',
                        borderColor: isAvailable 
                          ? (wallet.recommended ? 'primary.main' : 'divider')
                          : 'grey.300',
                        opacity: isAvailable ? 1 : 0.6,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: isAvailable ? 4 : 1,
                        }
                      }}
                      onClick={() => isAvailable ? handleWalletConnect(wallet.id) : null}
                    >
                      {wallet.recommended && (
                        <Chip 
                          label="Recomendado" 
                          size="small" 
                          color="primary"
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8,
                            zIndex: 1
                          }} 
                        />
                      )}
                      
                      {!isAvailable && (
                        <Chip 
                          label="No detectado" 
                          size="small" 
                          color="warning"
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            left: 8,
                            zIndex: 1
                          }} 
                        />
                      )}
                      
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h2" sx={{ mb: 2 }}>
                          {wallet.icon}
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                          {wallet.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {wallet.description}
                        </Typography>
                        
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{ mt: 3 }}
                          disabled={isConnecting || !isAvailable}
                          startIcon={isConnecting ? <CircularProgress size={20} /> : <Security />}
                        >
                          {isConnecting ? 'Conectando...' : 
                           !isAvailable ? 'No disponible' : 'Conectar'}
                        </Button>
                        
                        {!isAvailable && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Instala desde: Extension Store
                            </Typography>
                            {wallet.id === 'subwallet' && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => setShowSubWalletHelp(true)}
                                sx={{ mt: 1, fontSize: '0.75rem' }}
                              >
                                ¿Necesitas ayuda?
                              </Button>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              )
            })}
          </Box>

          {/* Información sobre extensiones */}
          {availableExtensions.length === 0 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                🔧 No se detectaron extensiones de wallet
              </Typography>
              <Typography variant="body2">
                Para usar Tralala Contracts necesitas instalar una extensión de wallet:
              </Typography>
              <Box component="ul" sx={{ mt: 2, pl: 2 }}>
                <li><strong>SubWallet:</strong> Ve a <a href="https://subwallet.app/" target="_blank" rel="noopener noreferrer">subwallet.app</a> e instala la extensión</li>
              </Box>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Después de instalar:</strong> Recarga esta página y asegúrate de que la extensión esté habilitada.
              </Typography>
            </Alert>
          )}

          {availableExtensions.length > 0 && (
            <Alert severity="success" sx={{ mt: 3 }}>
              <Typography variant="body2">
                ✅ Extensiones detectadas: {availableExtensions.join(', ')}
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" />
              Seguridad
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tralala Contracts nunca accede a tus claves privadas. Todas las transacciones son firmadas 
              directamente por tu wallet de forma segura. Solo necesitamos permisos de lectura para mostrar 
              tu información de cuenta.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Mostrar ayuda de SubWallet si está solicitada */}
      {showSubWalletHelp && (
        <SubWalletHelper />
      )}
    </motion.div>
  )
}

export default WalletConnection
