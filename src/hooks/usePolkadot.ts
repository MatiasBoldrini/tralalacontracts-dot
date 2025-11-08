import { useState, useEffect, useCallback } from 'react'
import { WalletAccount, DeployedContract, CompilationMetadata } from '../types'
import { compileContract, estimateDeploymentGas, extractContractInfo } from '../utils/deploymentUtils'
import { POLKADOT_CONFIG } from '../config/polkadot'

interface UsePolkadotReturn {
  isConnected: boolean
  account: WalletAccount | null
  accounts: WalletAccount[]
  connect: () => Promise<boolean>
  disconnect: () => void
  error: string | null
  isLoading: boolean
}

export const usePolkadot = (): UsePolkadotReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [accounts, setAccounts] = useState<WalletAccount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const connect = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Importar dinámicamente las funciones de Polkadot
      const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp')

      // Habilitar extensiones
      const extensions = await web3Enable('Tralala Contracts')

      if (extensions.length === 0) {
        throw new Error('No se encontraron extensiones de wallet instaladas')
      }

      // Obtener cuentas disponibles
      const availableAccounts = await web3Accounts()

      if (availableAccounts.length === 0) {
        throw new Error('No se encontraron cuentas en el wallet')
      }

      setAccounts(availableAccounts as WalletAccount[])
      setAccount(availableAccounts[0] as WalletAccount) // Seleccionar primera cuenta por defecto
      setIsConnected(true)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al conectar'
      setError(errorMessage)
      setIsConnected(false)
      setAccount(null)
      setAccounts([])
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setIsConnected(false)
    setAccount(null)
    setAccounts([])
    setError(null)
  }, [])

  // Verificar conexión al cargar
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { web3Accounts } = await import('@polkadot/extension-dapp')
        const accounts = await web3Accounts()

        if (accounts.length > 0) {
          setAccounts(accounts as WalletAccount[])
          setAccount(accounts[0] as WalletAccount)
          setIsConnected(true)
        }
      } catch (err) {
        // No hay wallet conectado o no está disponible
        console.log('No hay wallet conectado')
      }
    }

    checkConnection()
  }, [])

  return {
    isConnected,
    account,
    accounts,
    connect,
    disconnect,
    error,
    isLoading,
  }
}

// Hook para manejar la API de Polkadot con retry logic y fallback
export const usePolkadotApi = () => {
  const [api, setApi] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentEndpoint, setCurrentEndpoint] = useState<string>('')

  const connect = useCallback(async () => {
    try {
      const { ApiPromise, WsProvider } = await import('@polkadot/api')

      // Array de endpoints a intentar: primero el principal, luego los fallbacks
      const endpoints = [
        POLKADOT_CONFIG.network.wsUrl,
        ...(POLKADOT_CONFIG.network.wsUrlFallbacks || []),
      ]

      let lastError: Error | null = null
      let apiInstance: any = null

      // Intentar conectar con cada endpoint
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i]
        const isLastAttempt = i === endpoints.length - 1

        try {
          console.log(`🔗 Intentando conectar a Paseo con endpoint ${i + 1}/${endpoints.length}: ${endpoint.substring(0, 50)}...`)

          const wsProvider = new WsProvider(endpoint, 3000) // 3s timeout per endpoint

          // Crear instancia de API
          apiInstance = await Promise.race([
            ApiPromise.create({ provider: wsProvider }),
            // Timeout de 10 segundos para la conexión total
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout conectando a ${endpoint}`)), 10000)
            ),
          ])

          console.log(`✅ Conectado exitosamente a: ${endpoint.substring(0, 50)}...`)
          setCurrentEndpoint(endpoint)
          setApi(apiInstance)
          setIsConnected(true)
          setError(null)

          return apiInstance
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          console.warn(`❌ Fallo endpoint ${i + 1}: ${lastError.message}`)

          // Si no es el último intento, continuar silenciosamente
          if (!isLastAttempt) {
            // Pequeña pausa antes de intentar el siguiente endpoint
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }

      // Si llegamos aquí, todos los endpoints fallaron
      const errorMessage = `No se pudo conectar a ningún endpoint de Paseo. Último error: ${lastError?.message || 'Desconocido'}`
      console.error(errorMessage)
      setError(errorMessage)
      setIsConnected(false)
      setApi(null)
      throw new Error(errorMessage)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al conectar con la API'
      setError(errorMessage)
      setIsConnected(false)
      setApi(null)
      throw err
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (api) {
      try {
        await api.disconnect()
      } catch (err) {
        console.warn('Error al desconectar API:', err)
      }
      setApi(null)
      setIsConnected(false)
      setCurrentEndpoint('')
    }
  }, [api])

  // Conectar automáticamente al montar
  useEffect(() => {
    let isMounted = true

    const initConnection = async () => {
      try {
        await connect()
      } catch (err) {
        if (isMounted) {
          console.error('Error en inicialización de API:', err)
        }
      }
    }

    initConnection()

    return () => {
      isMounted = false
      if (api) {
        api.disconnect().catch((err: any) => {
          console.warn('Error al limpiar API:', err)
        })
      }
    }
  }, [])

  return {
    api,
    isConnected,
    error,
    connect,
    disconnect,
    currentEndpoint, // Útil para debugging
  }
}

// Hook para manejar transacciones
export const useTransaction = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const sendTransaction = useCallback(async (
    _api: any,
    account: WalletAccount,
    transaction: any
  ) => {
    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      // Importar funciones de firma
      const { web3FromSource } = await import('@polkadot/extension-dapp')

      // Obtener extensión del wallet
      const injector = await web3FromSource(account.meta.source)

      // Configurar firma
      const signer = injector.signer

      // Enviar transacción
      const tx = await transaction.signAndSend(
        account.address,
        { signer },
        ({ status, txHash }: any) => {
          if (status.isInBlock) {
            setTxHash(txHash.toString())
            setIsLoading(false)
          }
        }
      )
      
      return tx
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en la transacción'
      setError(errorMessage)
      setIsLoading(false)
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setTxHash(null)
    setIsLoading(false)
  }, [])

  return {
    isLoading,
    error,
    txHash,
    sendTransaction,
    reset,
  }
}

// Hook para desplegar contratos en Polkadot
export const useContractDeployment = () => {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentError, setDeploymentError] = useState<string | null>(null)
  const [deploymentProgress, setDeploymentProgress] = useState<{
    step: number
    message: string
  } | null>(null)
  const [compilationMetadata, setCompilationMetadata] = useState<CompilationMetadata | null>(null)
  const [deployedContract, setDeployedContract] = useState<DeployedContract | null>(null)

  const deployContract = useCallback(
    async (
      contractCode: string,
      contractName: string,
      account: WalletAccount,
      api: any
    ): Promise<DeployedContract | null> => {
      setIsDeploying(true)
      setDeploymentError(null)
      setDeploymentProgress(null)
      setDeployedContract(null)

      return new Promise((resolve) => {
        (async () => {
          try {
            const startTime = Date.now()

            // Paso 1: Validar código
            setDeploymentProgress({ step: 1, message: 'Validando código Solidity...' })
            if (!contractCode.trim()) {
              throw new Error('El código del contrato está vacío')
            }

            // Paso 2: Compilar contrato
            setDeploymentProgress({ step: 2, message: 'Compilando contrato...' })
            const compilationResult = compileContract(contractCode, contractName)

            if (!compilationResult.success || compilationResult.error) {
              throw new Error(`Error de compilación: ${compilationResult.error}`)
            }

            // Extraer información del contrato
            const contractInfo = extractContractInfo(contractCode)
            const metadata: CompilationMetadata = {
              contractName: contractInfo.name,
              bytecode: compilationResult.bytecode,
              abi: compilationResult.abi,
              functions: contractInfo.functions,
              events: contractInfo.events,
              stateVariables: contractInfo.stateVariables,
              lineCount: contractInfo.lineCount,
              compilationTime: Date.now() - startTime,
            }
            setCompilationMetadata(metadata)

            // Paso 3: Estimar gas
            setDeploymentProgress({ step: 3, message: 'Estimando gas requerido...' })
            const gasEstimate = estimateDeploymentGas(contractCode)

            // Paso 4: Construir transacción
            setDeploymentProgress({ step: 4, message: 'Preparando transacción...' })
            if (!api) {
              throw new Error('API de Polkadot no disponible. Intenta reconectarte.')
            }

            // Para Polkadot, construimos una transacción de deployment
            // Usando el pallet de contratos - convertir gasLimit a BigInt
            const gasLimitBigInt = BigInt(gasEstimate.gasLimit)
            const deployTx = api.tx.contracts.instantiate(
              0, // value: sin transferencia de fondos
              gasLimitBigInt, // gas_limit
              null, // storage_deposit_limit
              compilationResult.bytecode, // code
              [], // data (constructor arguments - empty)
              [] // salt (para deterministic addresses)
            )

            // Paso 5: Firmar y enviar transacción
            setDeploymentProgress({ step: 5, message: 'Esperando firma en wallet...' })
            const { web3FromSource } = await import('@polkadot/extension-dapp')

            const injector = await web3FromSource(account.meta.source)
            const signer = injector.signer

            let blockHash = ''
            let txHash = ''
            let blockNumber = 0
            let gasUsed = '0'
            let resolved = false

            // Enviar transacción
            setDeploymentProgress({ step: 6, message: 'Enviando a blockchain...' })

            const unsubscribe = await deployTx.signAndSend(
              account.address,
              { signer },
              ({ status, events, dispatchInfo }: any) => {
                if (status.isInBlock) {
                  setDeploymentProgress({ step: 7, message: 'Confirmando en blockchain...' })
                  blockHash = status.asInBlock.toString()
                  txHash = deployTx.hash?.toString() || ''
                  gasUsed = dispatchInfo?.weight?.toString() || '0'

                  // Extraer información de eventos
                  events.forEach(({ event }: any) => {
                    if (event.section === 'system' && event.method === 'ExtrinsicSuccess') {
                      console.log('✅ Transacción exitosa')
                    }
                  })
                }

                if (status.isFinalized) {
                  blockNumber = api.registry.createType('BlockNumber', blockHash).toNumber?.() || 0
                  setDeploymentProgress({ step: 8, message: 'Deployment completado!' })

                  // Crear objeto de contrato desplegado
                  const deployed: DeployedContract = {
                    address: txHash, // En Polkadot, usamos txHash como identificador
                    transactionHash: txHash,
                    blockNumber: blockNumber,
                    blockHash,
                    gasUsed,
                    explorerUrl: `${POLKADOT_CONFIG.network.explorerUrl}/tx/${txHash}`,
                    contract: {
                      name: contractInfo.name,
                      code: contractCode,
                      abi: compilationResult.abi,
                      features: [],
                    },
                    compiledBytecode: compilationResult.bytecode,
                    deploymentTime: Date.now() - startTime,
                    status: 'success',
                  }

                  setDeployedContract(deployed)
                  setIsDeploying(false)

                  if (!resolved) {
                    resolved = true
                    resolve(deployed)
                  }

                  // Limpiar suscripción
                  if (typeof unsubscribe === 'function') {
                    unsubscribe()
                  }
                }
              }
            )
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido en deployment'
            setDeploymentError(errorMessage)
            setIsDeploying(false)
            resolve(null)
          }
        })()
      })
    },
    []
  )

  const reset = useCallback(() => {
    setIsDeploying(false)
    setDeploymentError(null)
    setDeploymentProgress(null)
    setCompilationMetadata(null)
    setDeployedContract(null)
  }, [])

  return {
    isDeploying,
    deploymentError,
    deploymentProgress,
    compilationMetadata,
    deployedContract,
    deployContract,
    reset,
  }
}











