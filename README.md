# 🔥 Evento de Quema de SLP — App Móvil

Una aplicación móvil multiplataforma (iOS/Android) desarrollada con **React Native + Expo**, orientada al ecosistema de **Axie Infinity** en la red **Ronin**. Su objetivo es crear un mecanismo deflacionario mensual donde la comunidad puede comprar tickets, participar en sorteos, intercambiar Axies y contribuir activamente a la quema de SLP.

---

## 🎯 ¿Qué es esto?

La economía de Axie Infinity enfrenta dos problemas estructurales:

- **Exceso de SLP:** el token pierde valor porque se emite constantemente pero se consume poco.
- **Saturación de Axies:** hay miles de Axies de baja calidad que nadie quiere, deprimiendo el mercado.

Esta app introduce un **evento mensual de 72 horas** que actúa como un "agujero negro" de activos. Cada vez que alguien participa, retira SLP y/o Axies de circulación de forma permanente. La idea es que sea un win-win: los usuarios tienen la chance de ganar premios de alto valor, y el ecosistema se beneficia de la deflación.

---

## ⚙️ ¿Cómo funciona el sistema?

### 1. Compra de Tickets (ventana de 72 hs)

Al inicio de cada mes se abre una ventana de 72 horas donde los usuarios pueden comprar tickets pagando **3 USD en SLP** (calculado en tiempo real). Cada ticket es un NFT (ERC-721) que se envía a la wallet del comprador. Tener los **12 tickets del año** desbloquea acceso al evento anual legendario.

### 2. Distribución de Fondos (automática vía Smart Contract)

Por cada ticket vendido, los fondos se distribuyen así:

| Pool               | %   | Propósito                              |
| ------------------ | --- | -------------------------------------- |
| Pool de Rewards    | 25% | Compra de premios para sorteos         |
| Pool de Swap       | 25% | Fondos para comprar Axies de usuarios  |
| Quema Directa      | 25% | Envío a burn address de SLP            |
| Devs y Operaciones | 15% | Infraestructura y desarrollo           |
| Pool Reward Anual  | 10% | Acumulado para el evento de fin de año |

### 3. Milestones Comunitarios

La app muestra una barra de progreso global. A medida que la comunidad aporta SLP, se desbloquean hitos. Cuando un milestone se alcanza, el sistema compra automáticamente un activo (Axie, Land, ítem) y lo sortea.

### 4. Swap de Axies ("Agujero Negro")

Una vez cerrada la venta de tickets (pasadas las 72 hs), se habilita el módulo de intercambio. Los usuarios pueden entregar sus Axies no deseados a cambio del **Floor Price** actual del mercado. Los Axies recibidos son **liberados permanentemente** (mecánica de Release). Incluye cooldown de 24 hs con opción de pago para saltearlo.

### 5. Evento Anual Legendario

Los usuarios que acumularon los 12 tickets del año pueden mintear una **Llave Anual** y acceder al sorteo especial de fin de año, con premios de mayor valor.

---

## 🗺️ Roadmap

### ✅ Estado Actual (Pre-V1)

- Estructura base de navegación con Expo Router (5 tabs)
- Pantallas creadas: Home, Milestone, Perfil, Swap, Especial
- Tema oscuro con paleta negra y dorado
- UI placeholder funcional (datos hardcodeados)
- Bugs conocidos:
  - Acordeones del Home comparten estado (`showInfo`) → se abren juntos
  - `_layout.tsx` tiene un fondo marrón residual (`#935f17`) que no corresponde
  - Color activo del tab bar (`#0A7EA4`) no coincide con la paleta del proyecto

---

### 🎨 V1 — Maqueta Visual (Frontend Completo)

**Objetivo:** que la app se vea exactamente como queremos, con navegación fluida y datos simulados realistas. Sin integración real con ninguna API o blockchain.

**Scope:**

- [ ] Corregir bugs existentes (acordeones independientes, colores del tab bar, fondo residual)
- [ ] Definir y aplicar la paleta de colores definitiva (negro base, dorado como acento primario, rojo fuego como acento secundario)
- [ ] Rediseñar pantalla **Home**: hero section con estadísticas animadas, countdown del evento, acordeones independientes
- [ ] Rediseñar pantalla **Milestone**: termómetro de progreso animado, cards de milestone con estados visuales claros (pendiente / en proceso / completado)
- [ ] Rediseñar pantalla **Perfil**: estado de wallet (conectada/desconectada), grid de tickets, display de llave anual con progreso visual
- [ ] Diseñar pantalla **Swap**: interfaz de intercambio con card de Axie, precio floor, cooldown timer, botón de skip cooldown
- [ ] Diseñar pantalla **Especial**: acceso con llave, display del premio anual, estado del sorteo
- [ ] Datos simulados (mock data) consistentes y realistas en todas las pantallas
- [ ] Componentes reutilizables: `TicketCard`, `MilestoneCard`, `CountdownTimer`, `ProgressBar`, `WalletBadge`

---

### 🔌 V2 — Integración de APIs y Funcionalidades

**Objetivo:** conectar la maqueta con datos reales. La app consume APIs externas y el usuario puede interactuar con su wallet, pero sin smart contracts en producción (se usa testnet).

**Scope:**

- [ ] Integración con **WalletConnect / Ronin Wallet** (RF-01 a RF-04)
  - Conectar y desconectar wallet
  - Leer dirección pública (RON) y saldo de SLP
- [ ] Consumo de **API de precio de SLP** (oráculo o CoinGecko/CoinMarketCap) para calcular el precio del ticket en tiempo real
- [ ] Consumo de **Sky Mavis Marketplace API** para leer el Floor Price de Axies
- [ ] Lógica de **ventana de 72 hs**: activar/desactivar compra de tickets según tiempo del evento
- [ ] **Countdown real** basado en timestamp del servidor
- [ ] Lógica de **cooldown** del swap (24 hs desde el último intercambio)
- [ ] Lectura de **tickets/NFTs** de la wallet del usuario (inventario real)
- [ ] Backend básico (Node.js/NestJS) con endpoints para:
  - Estado del evento activo
  - Milestones y progreso actual
  - Historial de transacciones/quemas
- [ ] Base de datos (PostgreSQL) para logs de eventos y estado de milestones

---

### 🧪 V3 — Beta Funcional (Testnet)

**Objetivo:** versión casi completa funcionando en la testnet de Ronin (Saigon). Permite probar el flujo completo sin dinero real.

**Scope:**

- [ ] Deploy de **Smart Contracts en Saigon Testnet**
  - Contrato de Tickets (ERC-721)
  - Contrato de distribución de pools
  - Contrato de burn de SLP
- [ ] Compra real de tickets en testnet (firma de transacción con Ronin Wallet)
- [ ] Distribución automática de fondos post-compra
- [ ] Sistema de **Milestones automáticos**: cron job que detecta cuando se alcanza un hito y actualiza el estado
- [ ] Mecánica de **Swap completa** en testnet: entrega de Axie → pago de floor price → release del Axie
- [ ] **Skip de cooldown** con pago en SLP (testnet)
- [ ] **Minteo de Llave Anual** al acumular 12 tickets
- [ ] Pantalla de **estadísticas históricas** (total SLP quemado, Axies liberados)
- [ ] Pruebas de carga y estrés durante la ventana de 72 hs
- [ ] Auditoría básica de los smart contracts

---

## 🧱 Stack Técnico

| Capa              | Tecnología                               |
| ----------------- | ---------------------------------------- |
| Frontend          | React Native + Expo (TypeScript)         |
| Navegación        | Expo Router                              |
| Web3 / Wallet     | WalletConnect + Web3Modal                |
| Blockchain        | Ronin Network (Mainnet / Saigon Testnet) |
| Smart Contracts   | Solidity ^0.8.0 (ERC-721, ERC-20)        |
| Interacción Web3  | Viem o Ethers.js v6                      |
| Backend           | Node.js + NestJS                         |
| Base de datos     | PostgreSQL                               |
| API de mercado    | Sky Mavis Marketplace API                |
| Precios de tokens | CoinGecko API / Oráculo on-chain         |

---

## 📁 Estructura del Proyecto

```
app/
├── (tabs)/
│   ├── index.tsx        # Home — estadísticas globales y acordeones informativos
│   ├── milestone.tsx    # Progreso comunitario y milestones desbloqueados
│   ├── profile.tsx      # Perfil de usuario, tickets y bolsa
│   ├── swap.tsx         # Intercambio de Axies (Agujero Negro)
│   ├── special.tsx      # Evento anual legendario (requiere llave)
│   └── _layout.tsx      # Configuración de la barra de tabs
├── _layout.tsx          # Layout raíz
assets/
components/
├── ui/                  # Componentes base (IconSymbol, etc.)
├── TicketCard.tsx       # [pendiente V1]
├── MilestoneCard.tsx    # [pendiente V1]
├── CountdownTimer.tsx   # [pendiente V1]
├── ProgressBar.tsx      # [pendiente V1]
└── WalletBadge.tsx      # [pendiente V1]
constants/
└── theme.ts             # Paleta de colores y tipografía
hooks/
```

---

## 📋 Requerimientos Funcionales Clave

| ID            | Descripción                                                                | Versión |
| ------------- | -------------------------------------------------------------------------- | ------- |
| RF-01 a RF-04 | Conexión y desconexión de Ronin Wallet via WalletConnect                   | V2      |
| RF-05 a RF-09 | Compra de tickets (ventana 72 hs, precio en SLP, NFT ERC-721)              | V2/V3   |
| RF-10         | Distribución automática de fondos en pools via Smart Contract              | V3      |
| RF-11 a RF-14 | Sistema de milestones con barra de progreso y compra automática de premios | V2/V3   |
| RF-15 a RF-20 | Módulo de Swap de Axies con cooldown y skip de cooldown                    | V2/V3   |
| RF-21 a RF-23 | Perfil de usuario, inventario de tickets y estadísticas globales           | V2      |

---

## 🚀 Cómo correr el proyecto

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npx expo start

# Correr en Android
npx expo run:android

# Correr en iOS
npx expo run:ios
```

---

## 👥 Equipo

Franco Joaquín Gómez
Proyecto universitario — Facultad de [UNTDF].
