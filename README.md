# 🔥 Fynolt's Cult — Evento de Quema de SLP

App móvil y web desarrollada con **React Native + Expo** para el ecosistema de **Axie Infinity** en la red **Ronin**.

Mecanismo deflacionario mensual donde la comunidad compra tickets, participa en sorteos de Axies y Lands, intercambia Axies no deseados, y contribuye a la quema permanente de SLP y la liberación de Axies del mercado.

**Estética:** Dark Retro Arcane — inspirada en Wizardry, Final Fantasy I (NES) y Warhammer 40k (90s). Negro absoluto, rojo carmesí, tipografía monospace, corner brackets y sellos de Salomón como elementos decorativos.

---

## 🎯 Filosofía del proyecto

La economía de Axie Infinity tiene dos problemas estructurales: el exceso de SLP que pierde valor constantemente, y miles de Axies de baja calidad que saturan el mercado.

Este proyecto no da plata como premio. Reinvierte en el ecosistema comprando **Axies y Lands reales** del marketplace como premios de sorteo, quema SLP para reducir el supply circulante, y libera Axies para desaturar el mercado. Todo es transparente, verificable on-chain, y registrado públicamente.

---

## ⚙️ Ciclo completo de un evento

```
DÍAS 1–3 │ VENTA DE TICKETS (72 horas)
         │
         │  El usuario paga $3 USD en SLP → recibe un NFT ticket (ERC-721)
         │  Cada compra se divide automáticamente en 5 pools:
         │    25% → Pool de Recompensas (compra de Axies/Lands para sorteo)
         │    25% → Pool de Swap (liquidez para comprar Axies de usuarios)
         │    25% → Quema Directa (SLP a burn address)
         │    15% → Operaciones y Devs
         │    10% → Pool Reward Anual
         │
         │  Mientras tanto, el "Nivel del Ritual" sube:
         │    Cada $100 USD acumulados en el Pool de Recompensas = +1 nivel
         │    Por cada nivel → el sistema compra un Axie o Land de ~$100
         │    Ese item se agrega como premio del sorteo
         │    Se registra: qué se compró, TX de compra, precio en SLP
         │
DÍA 4    │ VENTANA DE SWAP (24 horas, solo para ticket holders)
         │
         │  El usuario entrega un Axie → recibe el floor price actual en SLP
         │    (del Pool de Swap, mientras haya fondos)
         │  Cooldown de 24 hs después de cada swap
         │  Puede pagar ½ floor price en SLP para resetear el cooldown
         │    Reset se divide: 50% Quema, 40% Devs, 10% Anual
         │  Si el Pool de Swap se vacía → la ventana cierra antes
         │
DÍA 5    │ CIERRE, SORTEO Y QUEMA
         │
         │  1. SORTEO: cada premio (Axie/Land de milestones) → wallet ganadora + TX
         │  2. QUEMA: todo el Pool de Quema → burn address + TX verificable
         │  3. LIBERACIÓN: cada Axie del swap → Release permanente + TX por cada uno
         │  4. TODO queda en el registro público del evento
```

### Evento Anual (31 de Diciembre)

- Requisito: tener 1 ticket de **cada mes** del año (no sirven 12 del mismo mes)
- Quemar los 12 tickets → mintear una **Llave Especial**
- Timer de 24 horas → sorteo de 3 premios **en SLP**:
  - 1er premio: 50% del Pool Anual acumulado
  - 2do premio: 30%
  - 3er premio: 20%
- Las transacciones quedan registradas

---

## 💰 Distribución de fondos

Hay 3 fuentes de ingreso, cada una con distribución diferente:

### Por cada compra de ticket ($3 USD en SLP)

| Componente          | %   | Propósito                              |
|---------------------|-----|----------------------------------------|
| Pool de Recompensas | 25% | Compra de Axies y Lands para sorteos   |
| Pool de Swap        | 25% | Fondos para comprar Axies de usuarios  |
| Quema Directa       | 25% | Envío irreversible a burn address      |
| Operaciones y Devs  | 15% | Mantenimiento e infraestructura        |
| Pool Reward Anual   | 10% | Se acumula para el evento de fin de año|

### Por cada reset de cooldown (½ floor price en SLP)

| Componente          | %   | Propósito                              |
|---------------------|-----|----------------------------------------|
| Quema Directa       | 50% | Envío irreversible a burn address      |
| Operaciones y Devs  | 40% | Mantenimiento e infraestructura        |
| Pool Reward Anual   | 10% | Se acumula para fin de año             |

### Por cada minteo de Llave Anual (12 tickets)

| Componente          | %   | Propósito                              |
|---------------------|-----|----------------------------------------|
| Pool de Recompensas | 40% | Adquisición de activos de alto valor   |
| Quema Directa       | 40% | Envío irreversible a burn address      |
| Operaciones y Devs  | 20% | Mantenimiento e infraestructura        |

---

## 🗺️ Navegación de la app

### Tabs principales (barra inferior)

| Tab        | Archivo                    | Función                                                      |
|------------|----------------------------|--------------------------------------------------------------|
| **HOME**   | `app/(tabs)/index.tsx`     | Filosofía, stats globales, pools, cómo funciona, últimos 3 rituales, links externos |
| **GOAL**   | `app/(tabs)/milestone.tsx` | Nivel del Ritual, barra XP, milestones, CTA de compra de ticket |
| **1P**     | `app/(tabs)/profile.tsx`   | Login con Ronin Wallet, tickets, llaves, inventario          |
| **SWAP**   | `app/(tabs)/swap.tsx`      | Intercambio de Axies, cooldown, skip cooldown                |
| **BOSS**   | `app/(tabs)/special.tsx`   | Evento Anual, llave, premios en SLP                          |

### Páginas de rituales (Stack navigation)

| Ruta                             | Archivo                            | Función                                          |
|----------------------------------|------------------------------------|--------------------------------------------------|
| `/ritual`                        | `app/ritual/index.tsx`             | Lista de todos los rituales realizados            |
| `/ritual/[id]`                   | `app/ritual/[id]/index.tsx`        | Detalle completo de un ritual (4 tabs)            |
| `/ritual/[id]/participants`      | `app/ritual/[id]/participants.tsx` | Lista de wallets participantes + tickets          |
| `/ritual/[id]/axies`             | `app/ritual/[id]/axies.tsx`        | Lista completa de Axies liberados + TX            |

### Detalle de un ritual — 4 tabs

| Tab         | Contenido                                                                    |
|-------------|------------------------------------------------------------------------------|
| **ACTAS**   | Stats del evento, datos del ticket, info del swap, wallet pública, participantes (link), axies liberados (desplegable) |
| **PREMIOS** | Milestones con filtros (por nivel y por monto), item comprado (link al marketplace), TX de compra, wallet ganadora, TX de entrega |
| **FONDOS**  | Distribución por pool con USD y %, detalle y TX de cada movimiento           |
| **GRÁFICO** | Chart de TradingView embebido (SLP/USD, ±2 días del evento)                  |

---

## 📁 Estructura del proyecto

```
app/
├── (tabs)/
│   ├── _layout.tsx          # Configuración de la barra de tabs
│   ├── index.tsx            # Home
│   ├── milestone.tsx        # Milestones y nivel del ritual
│   ├── profile.tsx          # Perfil de usuario
│   ├── swap.tsx             # Intercambio de Axies
│   └── special.tsx          # Evento anual legendario
├── ritual/
│   ├── index.tsx            # Lista de todos los rituales (Crónica)
│   └── [id]/
│       ├── index.tsx        # Detalle de un ritual (4 tabs)
│       ├── participants.tsx # Lista de participantes
│       └── axies.tsx        # Lista de Axies liberados
├── _layout.tsx              # Root layout (Stack + ThemeProvider)
│
constants/
└── ritualData.ts            # Data mock, paleta de colores, tipos, helpers
│
components/
├── themed-text.tsx
├── themed-view.tsx
└── ui/
    └── icon-symbol.tsx
│
assets/
└── images/
```

---

## 🗺️ Roadmap

### ✅ V1 — Maqueta Visual (estado actual)

La app se ve y navega como queremos. Todo con datos hardcodeados.

- [x] Estética Dark Retro Arcane (negro + rojo carmesí + dorado oscuro)
- [x] Arcade header: "FYNOLT'S CULT", versión, número de ritual
- [x] Home: filosofía, stats, 3 tablas de distribución, pools en carrusel, timeline, últimos 3 rituales
- [x] Navegación completa: `/ritual` (lista) → `/ritual/[id]` (detalle con 4 tabs) → `/ritual/[id]/participants` → `/ritual/[id]/axies`
- [x] Premios con filtros por nivel y monto, links al marketplace, TX verificables
- [x] Fondos con desglose por pool y TX
- [x] Participantes con wallets y tickets
- [x] Axies liberados con IDs y TX de liberación
- [x] Gráfico TradingView embebido
- [x] Responsive: carrusel en mobile, grid en web
- [ ] Rediseño de Swap (mecánica completa + cooldown + skip)
- [ ] Rediseño de Special (evento anual, 3 premios SLP, llave)
- [ ] Rediseño de Profile ("Logearse" con Ronin Wallet)
- [ ] Rediseño de Milestone (sistema de niveles integrado)

### 🔌 V2 — Integración de APIs

- [ ] Ronin Wallet via WalletConnect (login, saldo SLP, dirección)
- [ ] API de precio SLP en tiempo real (CoinGecko)
- [ ] Sky Mavis Marketplace API para floor price
- [ ] Countdown real de 72 hs (timestamp del servidor)
- [ ] Cooldown real del swap (24 hs)
- [ ] Lectura de NFTs/tickets de la wallet
- [ ] Backend (Node.js/NestJS) + PostgreSQL

### 🧪 V3 — Beta Funcional (Testnet Saigon)

- [ ] Smart Contracts: Tickets (ERC-721), distribución, burn
- [ ] Compra real de tickets en testnet
- [ ] Distribución automática de fondos
- [ ] Milestones automáticos
- [ ] Swap completo en testnet
- [ ] Minteo de Llave Anual
- [ ] Auditoría básica de contratos

---

## 🧱 Stack técnico

| Capa              | Tecnología                               |
|-------------------|------------------------------------------|
| Frontend          | React Native + Expo SDK 56 (TypeScript)  |
| Navegación        | Expo Router (file-based routing)         |
| Gráficos          | TradingView (WebView embebido)           |
| Iconos            | @expo/vector-icons (Ionicons)            |
| SVG               | react-native-svg                         |
| Web3 / Wallet     | WalletConnect + Web3Modal (V2)           |
| Blockchain        | Ronin Network (Mainnet / Saigon Testnet) |
| Smart Contracts   | Solidity ^0.8.0 (ERC-721, ERC-20) (V3)  |
| Backend           | Node.js + NestJS (V2)                    |
| Base de datos     | PostgreSQL (V2)                          |
| API de mercado    | Sky Mavis Marketplace API (V2)           |
| Precios de tokens | CoinGecko API (V2)                       |

---

## 🚀 Setup — Primera vez en una PC nueva

### Prerequisitos

| Herramienta                    | Versión mínima  | Verificar con |
|--------------------------------|-----------------|---------------|
| [Node.js](https://nodejs.org/) | 18.x o superior | `node -v`     |
| npm                            | 9.x o superior  | `npm -v`      |
| [Expo Go](https://expo.dev/go) | última versión  | App en celular|

No se necesita Android Studio, Xcode, ni emuladores.

### Paso a paso

```bash
# 1. Clonar
git clone https://github.com/Borhamus/Quema_de_SLP.git
cd Quema_de_SLP

# 2. Instalar dependencias
npm install

# 3. Verificar paquetes actualizados
npx expo install --check

# 4. Iniciar servidor de desarrollo
npx expo start
```

### Correr en Expo Go (celular)

1. Instalar **Expo Go** ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. PC y celular en la **misma red Wi-Fi**
3. Escanear el QR de la terminal
4. Si no conecta → presionar `s` para usar **tunnel**

### Correr en Web (navegador)

```bash
# Presionar 'w' en el menú, o directamente:
npx expo start --web
```

### Shortcuts del servidor

| Key | Acción                        |
|-----|-------------------------------|
| `r` | Reload                        |
| `w` | Abrir en navegador            |
| `s` | Cambiar modo (LAN/tunnel)     |
| `j` | Debugger de JavaScript        |
| `?` | Ver todos los comandos        |

### Errores comunes

| Error                                                   | Solución                                              |
|---------------------------------------------------------|-------------------------------------------------------|
| `command not found: expo`                               | Usar `npx expo` (no instalar globalmente)             |
| `Unable to find expo in this project`                   | Correr `npm install`                                  |
| QR no conecta en Expo Go                                | Presionar `s` para tunnel                             |
| Puerto 8081 ocupado                                     | `npx expo start --port 8082`                          |
| `expo-router not compatible with react-navigation`      | Cambiar imports a `expo-router/react-navigation`      |

---

## ⚠️ Nota sobre Expo SDK 56+

A partir de SDK 56, `expo-router` ya no acepta imports de `@react-navigation/*`. Se reemplazan por equivalentes de `expo-router`:

```typescript
// ❌ SDK 55
import { DarkTheme, ThemeProvider } from '@react-navigation/native';

// ✅ SDK 56+
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
```

La API es idéntica, solo cambia el módulo de origen.

---

## 👥 Equipo

Proyecto universitario — Fynolt's Cult.