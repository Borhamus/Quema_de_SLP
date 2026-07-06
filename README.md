# 🔥 Fynolt's Cult — Evento de Quema de SLP

App móvil y web desarrollada con **React Native + Expo** para el ecosistema de **Axie Infinity** en la red **Ronin**.

Mecanismo deflacionario mensual donde la comunidad compra tickets, participa en sorteos de Axies y Lands, intercambia Axies no deseados, y contribuye a la quema permanente de SLP y la liberación de Axies del mercado.

**Estética:** Dark Retro Arcane — inspirada en Wizardry, Final Fantasy I (NES) y Warhammer 40k (90s). Negro absoluto, rojo carmesí, tipografía monospace, corner brackets y sellos de Salomón como elementos decorativos.

**Estado actual: v0.1 — Prototipo funcional con backend real.**
No es una maqueta visual. Toda la lógica de negocio (pools, niveles, sorteos, cooldowns, cierre de eventos) corre de verdad contra una base de datos Supabase, con un panel de test dedicado para simular ciclos completos sin esperar los tiempos reales (72hs / 24hs). Lo que falta para la versión 1.0 real es la capa blockchain (NFTs y transferencias on-chain reales) — ver [Roadmap](#-roadmap--de-v01-a-v10).

---

## 📋 Índice

1. [Instalación desde cero](#-instalación-desde-cero)
2. [Cómo está armada la app](#-cómo-está-armada-la-app)
3. [Cómo fluye el dinero — lógica de negocio](#-cómo-fluye-el-dinero--lógica-de-negocio)
4. [Panel de test](#-panel-de-test-test)
5. [Roadmap — de v0.1 a v1.0](#-roadmap--de-v01-a-v10)

---

## 🚀 Instalación desde cero

### Prerequisitos

| Herramienta                    | Versión mínima  | Verificar con |
|---------------------------------|-----------------|---------------|
| [Node.js](https://nodejs.org/) | 18.x o superior | `node -v`     |
| npm                             | 9.x o superior  | `npm -v`      |
| [Expo Go](https://expo.dev/go) | última versión  | App en celular (opcional, ver nota abajo) |

No se necesita Android Studio, Xcode, ni emuladores. **Hoy el proyecto se prueba desde navegador (web)** — el flujo en celular con Expo Go todavía no está validado (ver Roadmap).

### Paso 1 — Clonar e instalar

```bash
git clone https://github.com/Borhamus/Quema_de_SLP.git
cd Quema_de_SLP
npm install
```

### Paso 2 — Variables de entorno (`.env`)

El proyecto necesita un archivo `.env` en la raíz con credenciales reales. **Ese archivo no está en el repo** (por seguridad, nunca se sube a git) — te lo van a pasar por otro medio (mail, mensaje privado).

Guardá el `.env` que te pasaron en la raíz del proyecto (al lado de `package.json`). Si necesitás armar uno nuevo desde cero, copiá `.env.example` a `.env` y completá los valores:

```bash
cp .env.example .env
```

Variables que necesita:

| Variable | Para qué es | Dónde conseguirla |
|----------|-------------|---------------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Conexión a la base de datos | Dashboard de Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Key pública de Supabase (RLS la protege, no es secreta) | Dashboard de Supabase → Settings → API |
| `EXPO_PUBLIC_MORALIS_API_KEY` | Traer los Axies reales de una wallet en Ronin | Cuenta gratis en [moralis.com](https://moralis.com) → Web3 APIs → API Keys |

Sin estas variables la app no arranca — `lib/supabase.ts` falla explícitamente en vez de arrancar con datos incompletos.

### Paso 3 — Base de datos (Supabase)

Los archivos que crean la base están en `database/` (sí están en el repo, no tienen ningún secreto adentro — son solo estructura de tablas y funciones):

```
database/
├── 01_crear_base_de_datos.sql     ← crea TODO desde cero (tablas, funciones, policies, cron)
├── 02_vaciar_base_de_datos.sql    ← borra los DATOS, mantiene la estructura
└── 03_eliminar_base_de_datos.sql  ← borra TODO (para volver a correr el 01 desde cero)
```

**Para un proyecto Supabase nuevo:**
1. Entrá al proyecto en [supabase.com](https://supabase.com), andá a **Database → Extensions** y activá: `uuid-ossp`, `pg_net`, `pg_cron`.
2. Andá a **SQL Editor → New query**, pegá el contenido completo de `01_crear_base_de_datos.sql` y ejecutalo.
3. Listo — la base queda con todas las tablas, funciones, triggers automáticos (cron cada 5 minutos) y datos de referencia cargados.

**Para reiniciar pruebas sin perder la estructura:** corré `02_vaciar_base_de_datos.sql`.

**Para empezar 100% de cero** (por ejemplo, si cambiamos el esquema): corré `03_eliminar_base_de_datos.sql` y después `01_crear_base_de_datos.sql` de nuevo.

> ⚠️ Estos 3 archivos son la única fuente de verdad del esquema — si alguno de los tres queda desactualizado respecto a los otros, la base puede quedar inconsistente. Siempre se actualizan los tres juntos.

### Paso 4 — Correr el proyecto

```bash
npx expo start -c
```

El flag `-c` limpia la caché de Metro — conviene usarlo siempre que se toquen rutas, `_layout.tsx`, o variables de entorno.

**En navegador:** presioná `w` en la terminal, o andá directo a `http://localhost:8081`.

**En celular (Expo Go):** todavía no validado — ver Roadmap. Si lo probás, PC y celular deben estar en la misma red Wi-Fi, y hay que escanear el QR de la terminal.

### Errores comunes

| Error | Solución |
|-------|----------|
| La app no arranca / pantalla en blanco con error de `.env` | Revisá que `.env` exista en la raíz y tenga las 3 variables completas |
| `command not found: expo` | Usar `npx expo` (no hace falta instalar nada global) |
| Cambié rutas/`_layout.tsx` y algo quedó roto | `npx expo start -c` (no alcanza con recargar el navegador) |
| La cámara para leer QR no muestra imagen (pantalla negra) | Ver sección de troubleshooting de cámara — suele ser Windows reteniendo el dispositivo, o el navegador (probado en Brave con problemas puntuales) |
| Puerto 8081 ocupado | `npx expo start --port 8082` |

---

## 🧱 Cómo está armada la app

### Stack técnico

| Capa | Tecnología |
|------|------------|
| Frontend | React Native + Expo SDK 56 (TypeScript) |
| Navegación | Expo Router (file-based routing) |
| Backend | Supabase (Postgres + Auth-less RLS + funciones `security definer` + `pg_cron`) |
| Autenticación | Wallet Ronin únicamente — sin email, sin OAuth, sesión efímera en memoria (no persiste entre pestañas ni recargas, a propósito) |
| Datos de Axies | Moralis Web3 API (NFTs reales de Ronin mainnet) |
| Precio de SLP | CoinGecko (consultado del lado del servidor vía `pg_net`, infalsificable por el cliente) |
| QR | `react-native-qrcode-svg` (nativo) / `qrcode` (web) — generación; `expo-camera` (nativo) / `getUserMedia` + `jsqr` (web) — lectura |
| Gráfico de precio | TradingView embebido (`WebView` nativo / `iframe` en web) |

### Filosofía de identidad

No hay tabla de usuarios. La `wallet_address` es la clave universal en todo el sistema — el login es simplemente conectar la wallet de Ronin, sin contraseña ni registro. Por diseño, esa sesión vive solo en la memoria de esa pestaña del navegador: cerrar la pestaña o recargar la página desconecta. Es una decisión de simplicidad, no un bug.

### Estructura de carpetas

```
app/
├── (tabs)/                    # Navegación principal (barra inferior)
│   ├── _layout.tsx
│   ├── index.tsx              # Home
│   ├── milestone.tsx          # Nivel del Ritual, compra de tickets
│   ├── profile.tsx            # Wallet, tickets, llaves, QR
│   ├── swap.tsx                # Intercambio de Axies + cooldown
│   └── special.tsx            # Evento Anual y Llave
├── ritual/
│   ├── index.tsx               # Historial de rituales completados
│   └── [id]/
│       ├── index.tsx           # Detalle de un ritual (Actas / Ganadores / Fondos / Gráfico)
│       ├── participants.tsx
│       └── axies.tsx
├── test.tsx                    # Panel de QA — ver sección dedicada
└── _layout.tsx                 # Root layout (providers + Stack)

components/                     # Componentes compartidos entre pantallas
├── BuyTicketsModal.tsx         # Modal de compra — el MISMO en /profile, /milestone y /test
├── CooldownModal.tsx           # Modal de cooldown del swap — compartido /swap y /test
├── TicketQrModal(.web).tsx     # QR de un ticket + descarga PNG (versión nativa / web)
├── TicketQrScannerModal(.web).tsx  # Lector de QR desde Home (versión nativa / web)
├── HScroller.tsx               # Carrusel horizontal con flechas (no depende de gestos táctiles)
└── PixelArt.tsx                # Sprites compartidos (candado, cirquero)

contexts/
├── wallet-context.tsx          # Conexión Ronin, sesión efímera
└── test-mode-context.tsx       # Toggle global de "modo test"

hooks/
├── use-slp-price.ts            # Precio de SLP en vivo (referencia visual — el precio real de cada transacción lo calcula el servidor)
├── use-countdown.ts            # Cuenta regresiva genérica
└── use-wallet-profile.ts

lib/
├── supabase.ts                 # Cliente de Supabase
└── axie-service.ts             # Axies reales de una wallet (Moralis)

database/
├── 01_crear_base_de_datos.sql
├── 02_vaciar_base_de_datos.sql
└── 03_eliminar_base_de_datos.sql
```

### Rutas principales

| Ruta | Función |
|------|---------|
| `/` | Home — filosofía, stats globales, últimos rituales, buscador de ritual por QR |
| `/milestone` | Nivel del Ritual actual, cuenta regresiva de venta, compra de tickets |
| `/profile` | Conectar wallet, ver tickets (agrupados en Activo/Pasados, numerados), ver/descargar QR, llaves |
| `/swap` | Ventana de intercambio de Axies, cooldown con las 2 opciones de liberación |
| `/special` | Evento Anual, minteo de llave, sorteo de fin de año |
| `/ritual` | Historial de todos los rituales completados |
| `/ritual/[id]` | Detalle de un ritual: Actas, Ganadores, Fondos, Gráfico |
| `/test` | Panel de QA — ver sección dedicada más abajo |

### Backend — piezas clave

Todo el estado vive en Postgres (Supabase). Las tablas principales: `events`, `tickets`, `ticket_transfers`, `participants`, `level_rewards_unlocked`, `event_funds`, `released_axies`, `swap_cooldown_releases`, `annual_keys`, `profiles`, `system_config`.

La escritura NUNCA pasa por SQL directo desde el cliente — todo se hace a través de funciones `security definer`, que son las únicas que pueden saltarse el RLS de solo-lectura:

- `buy_ticket()` / `buy_tickets_bulk()` — compra de tickets (individual o en lote, hasta 1000 de una)
- `swap_axie()` — intercambio de un Axie por SLP, dispara el cooldown de 4hs
- `release_swap_cooldown_with_slp()` / `release_swap_cooldown_with_axie()` — las 2 formas de saltarse el cooldown
- `draw_next_reward()` — sorteo secuencial (un ticket que ya ganó no vuelve a participar)
- `close_event_with_reason()` — la única función real de cierre de un evento: sortea todo lo pendiente, quema el pool, libera los Axies, arma el desglose de fondos con transacción por cada pool, y transfiere cualquier sobrante al pool anual. La usan los 3 caminos posibles (cron automático, agotamiento del pool de swap, botón manual de test) para que el resultado sea siempre idéntico sin importar por qué se cerró.
- `find_ticket_by_qr()` — resuelve un código de QR al evento y ticket correspondiente

Un cron job (`pg_cron`, cada 5 minutos) revisa si hay que crear el evento mensual, o si hay que avanzar de fase (venta → swap → cierre) según el tiempo transcurrido — sin intervención humana.

---

## 💰 Cómo fluye el dinero — lógica de negocio

### El ciclo de vida de un evento, como máquina de estados

```
A) ACTIVO         →  B) SWAP           →  C+D+E) CIERRE
   72hs de venta      24hs de circo         (un solo paso atómico)
   de tickets         de intercambios       Sortea + quema + libera
                       + cooldown            Axies + genera transacciones
                                              + registra el motivo
```

El cierre (C+D+E) siempre pasa por la misma función sin importar el motivo:
- **Tiempo agotado** — el cron automático lo dispara a las 24hs de abierto el swap
- **Fondos agotados** — si alguien intenta un swap y ya no queda plata en el pool
- **Manual** — solo disponible desde el panel de test, para simular

### Por cada compra de ticket ($3 USD en SLP, precio calculado por el servidor — infalsificable)

| Pool | % | Qué pasa con esa plata |
|------|---|--------------------------|
| Recompensas | 25% | Se acumula. Cada $50 USD acumulados = sube 1 nivel del ritual y desbloquea un premio en SLP para sortear |
| Swap | 25% | Financia los intercambios de Axies por SLP durante la ventana de swap |
| Quema Directa | 25% | Se quema al cerrar el evento (irreversible) |
| Operaciones y Devs | 15% | Se acumula, no se toca hasta el cierre |
| Pool Reward Anual | 10% | Se acumula para el evento de fin de año |

### Niveles y premios

Cada vez que el Pool de Recompensas cruza el umbral de un nivel (ver `level_thresholds`), se descuenta ese costo del pool y se generan los premios correspondientes en `level_rewards_unlocked`, congelados al precio de SLP de ese momento exacto. Se sortean en orden secuencial: un ticket que ya ganó no vuelve a participar.

### Swap y cooldown

Cada Axie entregado en la ventana de swap se paga al floor price del momento, y pone a esa wallet en **cooldown de 4 horas** antes de poder volver a entregar otro. Para saltarse el cooldown hay 2 opciones:
1. **Pagar ~$2 USD en SLP** → va al pool de Operaciones.
2. **Entregar otro Axie sin cobrar** → cuenta igual como "Axie liberado" en las estadísticas, pero no se paga.

### Al cerrar el evento

- Se sortean todos los premios pendientes.
- Se quema el 100% del Pool de Quema.
- Se liberan (registran con transacción) todos los Axies recibidos, sea por swap o por cooldown.
- **El sobrante sin usar de los pools de Recompensas Y de Swap se transfiere al Pool Anual** — nada queda perdido en un evento ya cerrado.
- Todo el movimiento queda en `event_funds`, cada fila con su propia transacción simulada.

### Evento Anual

- Requiere 1 ticket de cada mes del año (12 en total, uno por mes, no 12 del mismo mes) → se queman a cambio de una **Llave Anual**.
- Minteo de la llave: 40% Recompensas, 40% Quema, 20% Devs.
- La llave da acceso al evento de fin de año: sorteo de 10 premios en SLP repartidos del pool acumulado.

---

## 🧪 Panel de test (`/test`)

Como los tiempos reales son de 72hs y 24hs, existe un panel completo para simular el ciclo entero en minutos:

- **Selector de eventos de test** — creá tantos como quieras, cada uno con Año/Mes elegido a mano (siempre día 1), con número negativo para no chocar nunca con un evento real.
- **Máquina de estados segura** — solo se puede avanzar o retroceder un paso por vez, con confirmación antes de cada cambio. Saltar directo a "Completado" está bloqueado a propósito (ese estado solo se alcanza cerrando de verdad, nunca a mano).
- **Checklist automático** (17 puntos) — verifica que todo lo que debería pasar al cerrar un evento efectivamente pasó: pools en 0, motivo de cierre grabado, cada pool con su transacción, sorteo sin repetir ganador, etc.
- **Toggle "Mostrar eventos de test en Home/ritual"** — para poder ver el resultado en las pantallas reales sin mezclar para siempre datos de prueba con datos reales.
- **Toggle "Activar modo test"** — agrega un botón flotante "Volver a test" en todas las demás pantallas, para navegar sin perder la sesión de wallet.

---

## 🗺️ Roadmap — de v0.1 a v1.0

### ✅ Ya funciona (v0.1)

- Ciclo de vida completo del evento, automático vía cron, sin intervención humana
- Sistema de pools con distribución y liquidación real en la base de datos
- Sorteo secuencial de premios, con registro de cada transacción de entrega
- Swap de Axies (datos reales de la wallet vía Moralis) + cooldown con las 2 formas de liberarlo
- Cierre de evento unificado con motivo registrado y desglose de fondos
- Tickets con QR generado, descargable, y buscador de evento por QR desde una cámara (web)
- Historial de rituales, con Ganadores, Fondos y gráfico de precio real
- Panel de test completo con checklist automático
- Login por wallet Ronin (sin backend de autenticación tradicional)

### 🔲 Falta para v1.0 — esto es lo importante

**Todo lo de arriba corre sobre una base de datos, no sobre blockchain.** Los tickets y las llaves son filas en Supabase, no NFTs reales. El objetivo de v1.0 es que sea 100% real:

- [ ] **Tickets como NFTs reales** (ERC-721) minteados en Ronin — hoy `token_id` existe como columna pero nunca se completa
- [ ] **Llaves Anuales como NFTs reales** (ERC-721), misma lógica
- [ ] **Venta real de tickets on-chain** — el usuario paga SLP de verdad desde su wallet, no un monto simulado tipeado en un formulario de test
- [ ] **Transferencia real de tickets y llaves entre wallets** — hoy `transfer_ticket()` y `transfer_annual_key()` existen a nivel de base de datos, pero no hay contrato ni transacción real detrás
- [ ] **Testnet Saigon** como entorno de prueba antes de ir a mainnet — necesita: Ronin Wallet en modo testnet, RON de testnet (faucet oficial), un contrato ERC-20 propio simulando SLP (no existe faucet oficial de SLP), y los contratos ERC-721 de tickets y llaves
- [ ] Reemplazar los `tx_hash` simulados (`SIM-...`) por hashes de transacciones reales verificables en el explorador de Ronin
- [ ] Validar el flujo completo en Expo Go (celular) — hoy solo está probado en navegador

En criollo: la lógica de negocio, los números, y las reglas ya están puestas a prueba y funcionando de punta a punta. Lo que falta es conectar esa lógica a transacciones reales en blockchain en vez de a filas de una base de datos.

---

## Desarrollado por
Franco Joaquín Gómez — Universidad de Tierra Del Fuego.