# Estructura del Proyecto

Este proyecto sigue una arquitectura de componentes organizada en tres carpetas principales:

## 📁 Estructura de Carpetas

### `pages/`

Contiene las vistas principales de la aplicación. Cada archivo representa una página completa.

- **`HomePage.tsx`** - Página principal con el flujo de creación de contratos inteligentes

### `components/`

Contiene componentes específicos de la aplicación que se utilizan en las páginas.

- **`WalletConnection.tsx`** - Componente para conectar wallets
- **`ContractBuilder.tsx`** - Constructor visual de contratos
- **`DeploymentPanel.tsx`** - Panel de despliegue de contratos
- **`ContractVisualizer.tsx`** - Visualizador de contratos desplegados
- **`TestPage.tsx`** - Página de pruebas de contratos
- **`BlocklyTest.tsx`** - Test de integración con Blockly
- **`SubWalletHelper.tsx`** - Helper para SubWallet

### `shared/`

Contiene componentes reutilizables que pueden ser utilizados en múltiples partes de la aplicación.

- **`Header.tsx`** - Header principal de la aplicación
- **`TralalaIcon.tsx`** - Icono animado de Tralala
- **`VideoHeader.tsx`** - Header con video del tiburón

## 🔧 Archivos de Índice

Cada carpeta tiene un archivo `index.ts` que exporta todos los componentes para facilitar las importaciones:

```typescript
// Importación limpia
import { HomePage } from "./pages";
import { WalletConnection, ContractBuilder } from "./components";
import { Header, VideoHeader } from "./shared";
```

## 📋 Convenciones

1. **Páginas**: Contienen la lógica de estado y orquestación de componentes
2. **Componentes**: Contienen lógica específica de funcionalidad
3. **Shared**: Contienen componentes reutilizables sin lógica de negocio específica
4. **Imports**: Usar siempre los archivos de índice para importaciones más limpias

## 🚀 Beneficios de esta Estructura

- **Escalabilidad**: Fácil agregar nuevas páginas y componentes
- **Reutilización**: Componentes shared pueden ser reutilizados
- **Mantenibilidad**: Separación clara de responsabilidades
- **Organización**: Fácil encontrar y modificar componentes específicos
