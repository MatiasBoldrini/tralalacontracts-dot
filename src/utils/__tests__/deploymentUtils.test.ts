import { describe, it, expect } from 'vitest'
import {
  compileContract,
  estimateDeploymentGas,
  extractContractInfo,
  isValidBytecode,
  processDeploymentReceipt,
} from '../deploymentUtils'

describe('deploymentUtils', () => {
  describe('compileContract', () => {
    it('debería compilar un contrato válido exitosamente', () => {
      const contractCode = `
        pragma solidity ^0.8.28;

        contract SimpleToken {
          function transfer() public {}
          event Transfer(address to, uint amount);
        }
      `
      const result = compileContract(contractCode, 'SimpleToken')

      expect(result.success).toBe(true)
      expect(result.bytecode).toBeDefined()
      expect(result.bytecode.startsWith('0x')).toBe(true)
      expect(result.abi).toBeDefined()
      expect(result.abi.length).toBeGreaterThan(0)
      expect(result.error).toBeUndefined()
    })

    it('debería fallar con código vacío', () => {
      const result = compileContract('', 'EmptyContract')

      expect(result.success).toBe(false)
      expect(result.error).toContain('vacío')
      expect(result.bytecode).toBe('')
      expect(result.abi).toEqual([])
    })

    it('debería fallar sin pragma solidity', () => {
      const contractCode = `
        contract NoDirective {
          function test() public {}
        }
      `
      const result = compileContract(contractCode, 'NoDirective')

      expect(result.success).toBe(false)
      expect(result.error).toContain('pragma solidity')
    })

    it('debería fallar sin declaración contract', () => {
      const contractCode = `
        pragma solidity ^0.8.28;

        interface OnlyInterface {
          function test() external;
        }
      `
      const result = compileContract(contractCode, 'OnlyInterface')

      expect(result.success).toBe(false)
      expect(result.error).toContain('contrato')
    })

    it('debería fallar con llaves desbalanceadas', () => {
      const contractCode = `
        pragma solidity ^0.8.28;

        contract Unbalanced {
          function test() public {
            // Falta una llave de cierre
        }
      `
      const result = compileContract(contractCode, 'Unbalanced')

      expect(result.success).toBe(false)
      expect(result.error).toContain('llaves desbalanceadas')
    })

    it('debería extraer funciones correctamente en el ABI', () => {
      const contractCode = `
        pragma solidity ^0.8.28;

        contract MultiFunction {
          function transfer() public {}
          function approve() external {}
          function balanceOf() public {}
        }
      `
      const result = compileContract(contractCode, 'MultiFunction')

      expect(result.success).toBe(true)
      const functionAbi = result.abi.filter(item => item.type === 'function')
      expect(functionAbi.length).toBeGreaterThan(0)
      const functionNames = functionAbi.map(f => f.name)
      expect(functionNames).toContain('transfer')
      expect(functionNames).toContain('approve')
    })

    it('debería extraer eventos correctamente en el ABI', () => {
      const contractCode = `
        pragma solidity ^0.8.28;

        contract EventContract {
          event Transfer(address indexed from, address indexed to, uint256 amount);
          event Approval(address indexed owner, address indexed spender, uint256 amount);
        }
      `
      const result = compileContract(contractCode, 'EventContract')

      expect(result.success).toBe(true)
      const eventAbi = result.abi.filter(item => item.type === 'event')
      expect(eventAbi.length).toBeGreaterThan(0)
      const eventNames = eventAbi.map(e => e.name)
      expect(eventNames).toContain('Transfer')
      expect(eventNames).toContain('Approval')
    })
  })

  describe('estimateDeploymentGas', () => {
    it('debería estimar gas para contrato simple', () => {
      const contractCode = `
        pragma solidity ^0.8.28;
        contract Simple {}
      `
      const estimate = estimateDeploymentGas(contractCode)

      expect(estimate.gasLimit).toBeDefined()
      expect(estimate.gasPrice).toBeDefined()
      expect(estimate.estimatedCost).toBeDefined()
      expect(parseInt(estimate.gasLimit)).toBeGreaterThanOrEqual(200000)
      expect(parseInt(estimate.gasLimit)).toBeLessThanOrEqual(5000000)
    })

    it('debería tener un mínimo de 200k gas', () => {
      const contractCode = `
        pragma solidity ^0.8.28;
        contract Minimal {}
      `
      const estimate = estimateDeploymentGas(contractCode)

      expect(parseInt(estimate.gasLimit)).toBeGreaterThanOrEqual(200000)
    })

    it('debería limitar el gas a 5 millones máximo', () => {
      const complexCode = `
        pragma solidity ^0.8.28;
        contract VeryComplex {
          function f1() public {}
          function f2() public {}
          function f3() public {}
          function f4() public {}
          function f5() public {}
          ${Array(100).fill('event E(uint i);').join('\n')}
          ${Array(50).fill('mapping(address => uint) public m;').join('\n')}
        }
      `
      const estimate = estimateDeploymentGas(complexCode)

      expect(parseInt(estimate.gasLimit)).toBeLessThanOrEqual(5000000)
    })

    it('debería calcular costo estimado correctamente', () => {
      const contractCode = `
        pragma solidity ^0.8.28;
        contract TestCost {}
      `
      const estimate = estimateDeploymentGas(contractCode)

      // estimatedCost debería ser un número válido
      const cost = parseFloat(estimate.estimatedCost)
      expect(cost).toBeGreaterThanOrEqual(0)
      expect(isNaN(cost)).toBe(false)
    })

    it('debería aumentar gas con más funciones', () => {
      const simpleCode = `pragma solidity ^0.8.28; contract S { function f() public {} }`
      const simpleEstimate = estimateDeploymentGas(simpleCode)

      const complexCode = `pragma solidity ^0.8.28; contract C { function f1() public {} function f2() public {} function f3() public {} function f4() public {} function f5() public {} }`
      const complexEstimate = estimateDeploymentGas(complexCode)

      expect(parseInt(complexEstimate.gasLimit)).toBeGreaterThan(parseInt(simpleEstimate.gasLimit))
    })
  })

  describe('extractContractInfo', () => {
    it('debería extraer nombre del contrato correctamente', () => {
      const contractCode = `
        pragma solidity ^0.8.28;
        contract MyTokenContract {
          function transfer() public {}
        }
      `
      const info = extractContractInfo(contractCode)

      expect(info.name).toBe('MyTokenContract')
    })

    it('debería extraer funciones', () => {
      const contractCode = `
        pragma solidity ^0.8.28;
        contract FunctionTest {
          function transfer() public {}
          function approve() external {}
          function mint() public {}
        }
      `
      const info = extractContractInfo(contractCode)

      expect(info.functions).toContain('transfer')
      expect(info.functions).toContain('approve')
      expect(info.functions).toContain('mint')
      expect(info.functions.length).toBe(3)
    })

    it('debería extraer eventos', () => {
      const contractCode = `
        pragma solidity ^0.8.28;
        contract EventTest {
          event Transfer(address from, address to);
          event Approval(address owner, address spender);
        }
      `
      const info = extractContractInfo(contractCode)

      expect(info.events).toContain('Transfer')
      expect(info.events).toContain('Approval')
    })

    it('debería contar líneas de código', () => {
      const contractCode = `pragma solidity ^0.8.28;
contract Test {
  function a() public {}
  function b() public {}
}
`
      const info = extractContractInfo(contractCode)

      expect(info.lineCount).toBe(6) // Incluye la línea vacía al final
    })

    it('debería retornar valores por defecto para código inválido', () => {
      const invalidCode = 'random text without contract'
      const info = extractContractInfo(invalidCode)

      expect(info.name).toBe('UnknownContract')
      expect(info.functions).toEqual([])
      expect(info.events).toEqual([])
    })

    it('debería retornar empty arrays para contrato vacío', () => {
      const contractCode = `
        pragma solidity ^0.8.28;
        contract Empty {
        }
      `
      const info = extractContractInfo(contractCode)

      expect(info.name).toBe('Empty')
      expect(info.functions).toEqual([])
      expect(info.events).toEqual([])
    })
  })

  describe('isValidBytecode', () => {
    it('debería validar bytecode válido', () => {
      const validBytecode = '0x608060405234801561001057600080fd5b50'

      expect(isValidBytecode(validBytecode)).toBe(true)
    })

    it('debería rechazar bytecode sin prefijo 0x', () => {
      const noPrefixBytecode = '608060405234801561001057600080fd5b50'

      expect(isValidBytecode(noPrefixBytecode)).toBe(false)
    })

    it('debería rechazar bytecode con caracteres no-hexadecimales', () => {
      const invalidBytecode = '0xZZZZZZ'

      expect(isValidBytecode(invalidBytecode)).toBe(false)
    })

    it('debería rechazar bytecode vacío o solo 0x', () => {
      expect(isValidBytecode('0x')).toBe(false)
      expect(isValidBytecode('')).toBe(false)
    })

    it('debería validar bytecode con mayúsculas y minúsculas', () => {
      const mixedCase = '0xAbCdEf1234567890'

      expect(isValidBytecode(mixedCase)).toBe(true)
    })

    it('debería validar bytecode largo', () => {
      const longBytecode = '0x' + 'ab'.repeat(1000)

      expect(isValidBytecode(longBytecode)).toBe(true)
    })
  })

  describe('processDeploymentReceipt', () => {
    it('debería procesar receipt correctamente', () => {
      const receipt = processDeploymentReceipt(
        '0xabc123',
        '0xblock456',
        12345,
        '150000',
        'https://explorer.example.com'
      )

      expect(receipt.transactionHash).toBe('0xabc123')
      expect(receipt.blockHash).toBe('0xblock456')
      expect(receipt.blockNumber).toBe(12345)
      expect(receipt.gasUsed).toBe('150000')
      expect(receipt.status).toBe('success')
    })

    it('debería generar URL de explorador correctamente', () => {
      const receipt = processDeploymentReceipt(
        '0xhash123',
        '0xblock456',
        100,
        '100000',
        'https://rococo.subscan.io'
      )

      expect(receipt.explorerUrl).toBe('https://rococo.subscan.io/tx/0xhash123')
    })

    it('debería usar txHash como address temporalmente', () => {
      const receipt = processDeploymentReceipt(
        '0xtxaddress',
        '0xblock',
        1,
        '0',
        'https://explorer.test.io'
      )

      // El address es el txHash por ahora (se obtendría del event en producción)
      expect(receipt.address).toBe('0xtxaddress')
    })

    it('debería mantener todos los campos del receipt', () => {
      const receipt = processDeploymentReceipt(
        '0xtx',
        '0xblock',
        999,
        '200000',
        'https://test.io'
      )

      expect(receipt).toHaveProperty('transactionHash')
      expect(receipt).toHaveProperty('blockHash')
      expect(receipt).toHaveProperty('blockNumber')
      expect(receipt).toHaveProperty('gasUsed')
      expect(receipt).toHaveProperty('status')
      expect(receipt).toHaveProperty('explorerUrl')
      expect(receipt).toHaveProperty('address')
    })
  })
})
