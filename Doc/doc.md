# Arquitectura y Base de Datos — Fynolt's Cult: Quema de SLP

**Proyecto:** Fynolt's Cult — Evento de Quema de SLP  
**Stack:** React Native + Expo SDK 56 · Supabase (Auth + Database + Realtime)  
**Versión del documento:** 1.0  
**Fecha:** Junio 2026

---

## 1. Descripción del sistema

Aplicación móvil y web desarrollada con React Native + Expo para el ecosistema de Axie Infinity en la red Ronin. Implementa un mecanismo deflacionario mensual donde la comunidad compra tickets NFT (ERC-721), participa en sorteos de Axies y Lands, intercambia Axies no deseados, y contribuye a la quema permanente de SLP y la liberación de Axies del mercado.

El sistema se divide en tres capas:

- **Frontend:** React Native + Expo (iOS, Android, Web)
- **Backend / API:** Supabase (REST automático + SDK de cliente)
- **Blockchain:** Ronin Network — contratos ERC-721 y ERC-20 (Fase V3)

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Expo)                      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Home    │  │  Ritual  │  │ Profile  │  │  Swap  │ │
│  │ /index   │  │ /ritual  │  │ /profile │  │ /swap  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       └─────────────┴──────────────┴─────────────┘      │
│                         │                               │
│              @supabase/supabase-js                      │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────▼───────────────────────────────┐
│                      SUPABASE                           │
│                                                         │
│  ┌─────────────────┐   ┌──────────────────────────────┐ │
│  │   Auth          │   │   REST API (auto-generada)   │ │
│  │  · Email        │   │                              │ │
│  │  · Google OAuth │   │  GET /rest/v1/events         │ │
│  │  · Ronin Wallet │   │  GET /rest/v1/event_funds    │ │
│  └─────────────────┘   │  GET /rest/v1/milestones     │ │
│                        │  GET /rest/v1/tickets        │ │
│  ┌─────────────────┐   │  POST /rest/v1/favorites     │ │
│  │   Realtime      │   └──────────────────────────────┘ │
│  │  · Favoritos    │                                    │
│  │  · Estado       │   ┌──────────────────────────────┐ │
│  │    del evento   │   │   PostgreSQL                 │ │
│  └─────────────────┘   │   (ver sección 4)            │ │
│                        └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              RONIN NETWORK (Blockchain)                  │
│   · Tickets NFT (ERC-721)  · SLP (ERC-20)               │
│   · Axies NFT              · Burn address               │
└─────────────────────────────────────────────────────────┘
```

**Flujo de datos principal:**

1. El usuario abre la app y se autentica via Supabase Auth
2. La app consulta la API REST de Supabase para obtener eventos, fondos y milestones
3. Las acciones del usuario (favoritos) se sincronizan en tiempo real via WebSocket
4. Las transacciones blockchain se registran en la base de datos como hashes verificables

---

## 3. Ciclo de vida de un evento

Un evento atraviesa los siguientes estados en la columna `events.status`:

```
  PREVIO          ACTIVO          SWAP            COMPLETADO
    │               │               │                  │
    ▼               ▼               ▼                  ▼
 "previo"  ──►  "activo"  ──►   "swap"   ──►   "completado"
              (Días 1–3)        (Día 4)           (Día 5+)
           Venta de tickets   Ventana de       Sorteo, quema
           72 horas           intercambio      y liberación
```

| Estado | Duración | Qué ocurre |
|--------|----------|------------|
| `previo` | Indefinido | El evento está configurado pero no abierto |
| `activo` | 72 horas | Venta de tickets, sube el nivel del ritual |
| `swap` | 24 horas | Solo ticket holders pueden intercambiar Axies |
| `completado` | Permanente | Sorteo realizado, SLP quemado, Axies liberados |

---

## 4. Modelo de base de datos

### Diagrama entidad-relación

```
users ──────────────────────────────────────────────┐
  │                                                  │
  ├──< tickets >──< events >──< event_funds          │
  │                   │                              │
  ├──< participants    ├──< milestones               │
  │                   │                              │
  ├──< annual_keys    ├──< released_axies            │
  │        │          │                              │
  │        └──> annual_event                        │
  │                                                  │
  └──< favorites >──< events (ref) >─────────────────┘
```

### 4.1 Tabla: `users`

Gestiona los usuarios autenticados. Se integra directamente con Supabase Auth — cada registro en `auth.users` crea una fila correspondiente aquí via trigger.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Mismo UUID que `auth.users.id` |
| `email` | `text` | Correo electrónico |
| `display_name` | `text` | Nombre visible en la app |
| `avatar_url` | `text` | URL del avatar (Google o personalizado) |
| `ronin_wallet` | `text` | Dirección `ronin:0x...` si vinculó wallet |
| `provider` | `text` | `email`, `google` o `ronin` |
| `created_at` | `timestamptz` | Fecha de registro |

### 4.2 Tabla: `events`

Tabla central del sistema. Almacena tanto eventos activos como históricos. El campo `status` determina en qué fase está el evento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `event_number` | `integer` | Número secuencial del ritual (1, 2, 3…) |
| `label` | `text` | Nombre visible: "Enero 2025 — Primer Ritual" |
| `date_start` | `date` | Inicio de la venta de tickets |
| `date_end` | `date` | Cierre del evento (Día 5) |
| `status` | `text` | `previo`, `activo`, `swap`, `completado` |
| `total_tickets` | `integer` | Total de tickets vendidos |
| `ticket_price_slp` | `integer` | Precio del ticket en SLP |
| `slp_price_usd` | `numeric` | Precio del SLP en USD al momento del evento |
| `total_raised_usd` | `numeric` | Total recaudado en USD |
| `ritual_level` | `integer` | Nivel del ritual alcanzado |
| `slp_burned` | `integer` | SLP enviados a la burn address |
| `axies_released` | `integer` | Axies liberados permanentemente |
| `axies_swapped` | `integer` | Axies intercambiados durante el swap |
| `floor_price_usd` | `numeric` | Floor price del marketplace al momento del swap |
| `swap_pool_spent` | `numeric` | USD gastados del pool de swap |
| `cooldown_resets` | `integer` | Cantidad de resets de cooldown pagados |
| `wallet_url` | `text` | URL pública de la wallet del proyecto en Ronin |
| `created_at` | `timestamptz` | Fecha de creación del registro |

**Endpoint principal:**
```
GET https://<proyecto>.supabase.co/rest/v1/events
    ?select=event_number,label,date_start,slp_burned,axies_released,ritual_level
    &order=event_number.desc
```

### 4.3 Tabla: `event_funds`

Los cinco pools de distribución de fondos de cada evento. Cada fila es un pool con su monto, porcentaje y transacción verificable on-chain.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `event_id` | `uuid` FK → `events.id` | Evento al que pertenece |
| `name` | `text` | Nombre del pool: "Pool de Recompensas" |
| `emoji` | `text` | Emoji identificador: ⚔️ 🔥 ⚖️ 🔩 🗝️ |
| `color_hex` | `text` | Color en hex para la UI |
| `pct_of_ticket` | `integer` | Porcentaje del ticket: 25, 25, 25, 15, 10 |
| `total_usd` | `numeric` | Monto total en USD acumulado en este pool |
| `detail` | `text` | Descripción de qué se hizo con los fondos |
| `tx_hash` | `text` | Hash de la transacción en Ronin |
| `tx_url` | `text` | URL completa al Ronin Explorer |
| `created_at` | `timestamptz` | Fecha de creación |

**Endpoint por evento:**
```
GET https://<proyecto>.supabase.co/rest/v1/event_funds
    ?select=name,total_usd,pct_of_ticket,emoji,detail,tx_url
    &event_id=eq.<uuid-del-evento>
    &order=pct_of_ticket.desc
```

### 4.4 Tabla: `milestones`

Cada premio desbloqueado por nivel de ritual. Registra el item comprado, la transacción de compra, el ganador del sorteo y la transacción de entrega.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `event_id` | `uuid` FK → `events.id` | Evento al que pertenece |
| `level` | `integer` | Nivel del ritual en el que se desbloqueó |
| `threshold_usd` | `numeric` | USD acumulados para alcanzar este nivel |
| `slp_equivalent` | `integer` | Equivalente en SLP al precio del momento |
| `slp_price_at_time` | `numeric` | Precio del SLP en USD al momento de compra |
| `item_name` | `text` | Descripción del item: "Axie Beast #11822913" |
| `item_type` | `text` | `axie` o `land` |
| `market_url` | `text` | URL del item en el marketplace de Axie |
| `purchase_tx_hash` | `text` | Hash TX de compra del item |
| `purchase_tx_url` | `text` | URL al Ronin Explorer — TX de compra |
| `winner_wallet` | `text` | Wallet ganadora del sorteo |
| `delivery_tx_hash` | `text` | Hash TX de entrega al ganador |
| `delivery_tx_url` | `text` | URL al Ronin Explorer — TX de entrega |
| `created_at` | `timestamptz` | Fecha de creación |

### 4.5 Tabla: `tickets`

Cada NFT ticket comprado por un usuario. El campo `qr_code` contiene el dato que se codifica en el QR físico o digital para identificar el evento asociado.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `event_id` | `uuid` FK → `events.id` | Evento al que corresponde el ticket |
| `user_id` | `uuid` FK → `users.id` | Usuario propietario |
| `token_id` | `text` | ID del NFT en la blockchain Ronin |
| `tx_hash` | `text` | Hash de la transacción de minteo |
| `qr_code` | `text` | Dato codificado en el QR (event_number o uuid) |
| `purchased_at` | `timestamptz` | Fecha y hora de compra |
| `used_in_annual` | `boolean` | Si fue usado para mintear una Llave Anual |

### 4.6 Tabla: `participants`

Resumen de participación por wallet por evento. Se actualiza cada vez que un usuario compra un ticket adicional.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `event_id` | `uuid` FK → `events.id` | Evento |
| `user_id` | `uuid` FK → `users.id` | Usuario |
| `wallet_address` | `text` | Dirección `ronin:0x...` del participante |
| `tickets_count` | `integer` | Cantidad de tickets comprados en este evento |

### 4.7 Tabla: `released_axies`

Registro permanente de cada Axie liberado en la fase de cierre. Cada fila es un Axie individual con su TX de liberación verificable.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `event_id` | `uuid` FK → `events.id` | Evento en el que fue liberado |
| `axie_id` | `text` | ID del Axie en el marketplace |
| `tx_hash` | `text` | Hash de la TX de liberación en Ronin |
| `tx_url` | `text` | URL al Ronin Explorer |
| `released_at` | `timestamptz` | Fecha y hora de liberación |

### 4.8 Tabla: `annual_keys`

Las Llaves Especiales que se mintean quemando 12 tickets (uno por cada mes del año). Solo usuarios con tickets de los 12 meses distintos pueden mintear una.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `user_id` | `uuid` FK → `users.id` | Usuario que minteó la llave |
| `token_id` | `text` | ID del NFT de la llave en Ronin |
| `tx_hash` | `text` | Hash de la TX de minteo |
| `year` | `integer` | Año de la llave (ej: 2025) |
| `used_in_draw` | `boolean` | Si fue usada en el sorteo anual |
| `minted_at` | `timestamptz` | Fecha y hora de minteo |

### 4.9 Tabla: `annual_event`

El evento especial de fin de año. Registra el pool acumulado y los tres ganadores con sus premios en SLP.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `year` | `integer` | Año del evento (ej: 2025) |
| `status` | `text` | `pendiente`, `activo`, `completado` |
| `pool_total_usd` | `numeric` | Total acumulado en el Pool Reward Anual |
| `winner_1_wallet` | `text` | Wallet del 1er ganador |
| `winner_2_wallet` | `text` | Wallet del 2do ganador |
| `winner_3_wallet` | `text` | Wallet del 3er ganador |
| `prize_1_slp` | `numeric` | Premio 1er lugar — 50% del pool en SLP |
| `prize_2_slp` | `numeric` | Premio 2do lugar — 30% del pool en SLP |
| `prize_3_slp` | `numeric` | Premio 3er lugar — 20% del pool en SLP |
| `draw_at` | `timestamptz` | Fecha y hora del sorteo (31 de diciembre) |

### 4.10 Tabla: `favorites`

Permite a los usuarios guardar eventos como favoritos. Es la tabla que alimenta la funcionalidad en tiempo real: cualquier INSERT o DELETE se propaga instantáneamente a todos los dispositivos del usuario via Supabase Realtime.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `user_id` | `uuid` FK → `users.id` | Usuario |
| `event_id` | `uuid` FK → `events.id` | Evento guardado como favorito |
| `created_at` | `timestamptz` | Fecha en que fue marcado como favorito |

---

## 5. Endpoints principales (API REST de Supabase)

Supabase genera automáticamente una API REST completa sobre cada tabla. No requiere código de servidor adicional.

**Base URL:** `https://<proyecto>.supabase.co/rest/v1/`  
**Header requerido:** `apikey: <anon_key>`

| Propósito | Método | Endpoint |
|-----------|--------|----------|
| Listar todos los eventos | GET | `/events?select=event_number,label,date_start,slp_burned,axies_released,ritual_level&order=event_number.desc` |
| Detalle de un evento | GET | `/events?id=eq.<uuid>&select=*` |
| Fondos de un evento | GET | `/event_funds?event_id=eq.<uuid>&select=name,total_usd,pct_of_ticket` |
| Milestones de un evento | GET | `/milestones?event_id=eq.<uuid>&order=level.asc` |
| Axies liberados de un evento | GET | `/released_axies?event_id=eq.<uuid>` |
| Participantes de un evento | GET | `/participants?event_id=eq.<uuid>&order=tickets_count.desc` |
| Tickets del usuario | GET | `/tickets?user_id=eq.<uuid>` |
| Agregar favorito | POST | `/favorites` |
| Quitar favorito | DELETE | `/favorites?user_id=eq.<uuid>&event_id=eq.<uuid>` |

---

## 6. Autenticación

Supabase Auth gestiona los tres métodos de login:

| Método | Implementación |
|--------|---------------|
| **Email / Password** | `supabase.auth.signUp()` / `signInWithPassword()` |
| **Google OAuth** | `supabase.auth.signInWithOAuth({ provider: 'google' })` via `expo-auth-session` |
| **Ronin Wallet** | Firma de mensaje con la wallet → verificación del mensaje → `signInWithPassword()` con wallet como identificador |

Todas las sesiones se almacenan en `SecureStore` de Expo para persistencia entre reinicios de la app.

---

## 7. Funcionalidad en tiempo real

La tabla `favorites` está habilitada para Realtime en Supabase. El cliente se suscribe al canal y recibe actualizaciones instantáneas:

```typescript
// Suscripción al canal de favoritos del usuario
const channel = supabase
  .channel('favorites-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'favorites',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Actualizar estado local inmediatamente
  })
  .subscribe();
```

---

## 8. Distribución de fondos por tipo de transacción

### Compra de ticket ($3 USD en SLP)

| Pool | % | Propósito |
|------|---|-----------|
| Pool de Recompensas | 25% | Adquisición de Axies/Lands para sorteos |
| Pool de Swap | 25% | Liquidez para comprar Axies de usuarios |
| Quema Directa | 25% | Envío irreversible a burn address |
| Operaciones y Devs | 15% | Mantenimiento e infraestructura |
| Pool Reward Anual | 10% | Acumulado para el evento de diciembre |

### Reset de cooldown (½ floor price en SLP)

| Pool | % | Propósito |
|------|---|-----------|
| Quema Directa | 50% | Envío irreversible a burn address |
| Operaciones y Devs | 40% | Mantenimiento e infraestructura |
| Pool Reward Anual | 10% | Acumulado para fin de año |

### Minteo de Llave Anual (12 tickets)

| Pool | % | Propósito |
|------|---|-----------|
| Pool de Recompensas | 40% | Adquisición de activos de alto valor |
| Quema Directa | 40% | Envío irreversible a burn address |
| Operaciones y Devs | 20% | Mantenimiento e infraestructura |

---

## 9. Stack tecnológico completo

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React Native + Expo | SDK 56 |
| Lenguaje | TypeScript | ~6.0 |
| Navegación | Expo Router (file-based) | ^56.2 |
| Backend / API | Supabase | — |
| Base de datos | PostgreSQL (via Supabase) | — |
| Autenticación | Supabase Auth | — |
| Realtime | Supabase Realtime (WebSocket) | — |
| Gráficos | TradingView (WebView) | — |
| QR | expo-camera + expo-barcode-scanner | — |
| Web3 / Wallet | WalletConnect + Web3Modal v2 | V2 |
| Blockchain | Ronin Network | Mainnet / Saigon Testnet |
| Smart Contracts | Solidity ^0.8.0 | V3 (planificado) |

---

*Documento generado para la entrega de Fynolt's Cult — Quema de SLP · Junio 2026*




