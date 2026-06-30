-- ============================================================
-- QUEMA DE SLP — Supabase Schema completo
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── EXTENSIONES ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── LIMPIAR (si necesitás resetear) ─────────────────────────
-- drop table if exists favorites cascade;
-- drop table if exists annual_keys cascade;
-- drop table if exists annual_event cascade;
-- drop table if exists released_axies cascade;
-- drop table if exists participants cascade;
-- drop table if exists tickets cascade;
-- drop table if exists milestones cascade;
-- drop table if exists event_funds cascade;
-- drop table if exists events cascade;
-- drop table if exists users cascade;

-- ─── TABLA: users ────────────────────────────────────────────
create table public.users (
  id            uuid primary key default uuid_generate_v4(),
  email         text,
  display_name  text,
  avatar_url    text,
  ronin_wallet  text unique,
  provider      text check (provider in ('email', 'google', 'ronin')),
  created_at    timestamptz default now()
);

-- ─── TABLA: events ───────────────────────────────────────────
create table public.events (
  id                uuid primary key default uuid_generate_v4(),
  event_number      integer unique not null,
  label             text not null,
  date_start        date not null,
  date_end          date not null,
  status            text default 'completado' check (status in ('previo','activo','swap','completado')),
  total_tickets     integer default 0,
  ticket_price_slp  integer default 1000,
  slp_price_usd     numeric(10,6) default 0.003,
  total_raised_usd  numeric(10,2) default 0,
  ritual_level      integer default 0,
  slp_burned        integer default 0,
  axies_released    integer default 0,
  axies_swapped     integer default 0,
  floor_price_usd   numeric(10,4) default 0,
  swap_pool_spent   numeric(10,2) default 0,
  cooldown_resets   integer default 0,
  wallet_url        text,
  created_at        timestamptz default now()
);

-- ─── TABLA: event_funds ──────────────────────────────────────
create table public.event_funds (
  id             uuid primary key default uuid_generate_v4(),
  event_id       uuid not null references public.events(id) on delete cascade,
  name           text not null,
  emoji          text,
  color_hex      text,
  pct_of_ticket  integer not null,
  total_usd      numeric(10,2) default 0,
  detail         text,
  tx_hash        text,
  tx_url         text,
  created_at     timestamptz default now()
);

-- ─── TABLA: milestones ───────────────────────────────────────
create table public.milestones (
  id                  uuid primary key default uuid_generate_v4(),
  event_id            uuid not null references public.events(id) on delete cascade,
  level               integer not null,
  threshold_usd       numeric(10,2) not null,
  slp_equivalent      integer,
  slp_price_at_time   numeric(10,6),
  item_name           text not null,
  item_type           text check (item_type in ('axie','land')),
  market_url          text,
  purchase_tx_hash    text,
  purchase_tx_url     text,
  winner_wallet       text,
  delivery_tx_hash    text,
  delivery_tx_url     text,
  created_at          timestamptz default now()
);

-- ─── TABLA: tickets ──────────────────────────────────────────
create table public.tickets (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references public.events(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  token_id        text,
  tx_hash         text,
  qr_code         text unique not null,
  purchased_at    timestamptz default now(),
  used_in_annual  boolean default false
);

-- ─── TABLA: participants ─────────────────────────────────────
create table public.participants (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references public.events(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  wallet_address  text not null,
  tickets_count   integer default 1,
  unique(event_id, wallet_address)
);

-- ─── TABLA: released_axies ───────────────────────────────────
create table public.released_axies (
  id           uuid primary key default uuid_generate_v4(),
  event_id     uuid not null references public.events(id) on delete cascade,
  axie_id      text not null,
  tx_hash      text,
  tx_url       text,
  released_at  timestamptz default now()
);

-- ─── TABLA: annual_keys ──────────────────────────────────────
create table public.annual_keys (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.users(id) on delete cascade,
  token_id     text,
  tx_hash      text,
  year         integer not null,
  used_in_draw boolean default false,
  minted_at    timestamptz default now()
);

-- ─── TABLA: annual_event ─────────────────────────────────────
create table public.annual_event (
  id               uuid primary key default uuid_generate_v4(),
  year             integer unique not null,
  status           text default 'pendiente' check (status in ('pendiente','activo','completado')),
  pool_total_usd   numeric(10,2) default 0,
  winner_1_wallet  text,
  winner_2_wallet  text,
  winner_3_wallet  text,
  prize_1_slp      numeric(12,0),
  prize_2_slp      numeric(12,0),
  prize_3_slp      numeric(12,0),
  draw_at          timestamptz
);

-- ─── TABLA: favorites ────────────────────────────────────────
create table public.favorites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, event_id)
);

-- ─── ÍNDICES ─────────────────────────────────────────────────
create index idx_event_funds_event    on public.event_funds(event_id);
create index idx_milestones_event     on public.milestones(event_id);
create index idx_tickets_event        on public.tickets(event_id);
create index idx_tickets_user         on public.tickets(user_id);
create index idx_participants_event   on public.participants(event_id);
create index idx_released_axies_event on public.released_axies(event_id);
create index idx_favorites_user       on public.favorites(user_id);
create index idx_favorites_event      on public.favorites(event_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table public.users         enable row level security;
alter table public.events        enable row level security;
alter table public.event_funds   enable row level security;
alter table public.milestones    enable row level security;
alter table public.tickets       enable row level security;
alter table public.participants  enable row level security;
alter table public.released_axies enable row level security;
alter table public.annual_keys   enable row level security;
alter table public.annual_event  enable row level security;
alter table public.favorites     enable row level security;

-- Políticas: lectura pública para datos del evento
create policy "events_public_read"         on public.events         for select using (true);
create policy "event_funds_public_read"    on public.event_funds    for select using (true);
create policy "milestones_public_read"     on public.milestones     for select using (true);
create policy "participants_public_read"   on public.participants   for select using (true);
create policy "released_axies_public_read" on public.released_axies for select using (true);
create policy "annual_event_public_read"   on public.annual_event   for select using (true);

-- Políticas: tickets — solo el dueño los ve
create policy "tickets_own_read" on public.tickets
  for select using (auth.uid() = user_id);

-- Políticas: users — cada uno ve y edita solo el suyo
create policy "users_own_read" on public.users
  for select using (auth.uid() = id);
create policy "users_own_update" on public.users
  for update using (auth.uid() = id);
create policy "users_insert" on public.users
  for insert with check (auth.uid() = id);

-- Políticas: favorites — cada uno maneja los suyos
create policy "favorites_own_read" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites_own_insert" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites_own_delete" on public.favorites
  for delete using (auth.uid() = user_id);

-- ─── REALTIME ────────────────────────────────────────────────
alter publication supabase_realtime add table public.favorites;
alter publication supabase_realtime add table public.events;

-- ============================================================
-- DATOS: 5 EVENTOS
-- ============================================================

-- Variables de referencia
-- WALLET: https://app.axieinfinity.com/profile/0x771faac23673fba19a414064def8a4aacf43fcfd/activities/
-- TX BASE: https://app.roninchain.com/tx/
-- AXIE URL: https://app.axieinfinity.com/marketplace/axies/
-- LAND URL: https://app.axieinfinity.com/marketplace/lands/

insert into public.events (
  event_number, label, date_start, date_end, status,
  total_tickets, ticket_price_slp, slp_price_usd, total_raised_usd,
  ritual_level, slp_burned, axies_released, axies_swapped,
  floor_price_usd, swap_pool_spent, cooldown_resets, wallet_url
) values
-- Evento 1 — Enero 2025
(1, 'Enero 2025 — Primer Ritual', '2025-01-01', '2025-01-05', 'completado',
 350, 1000, 0.003, 3150.00,
 2, 310000, 85, 85,
 0.60, 51.00, 8,
 'https://app.axieinfinity.com/profile/0x771faac23673fba19a414064def8a4aacf43fcfd/activities/'),

-- Evento 2 — Febrero 2025
(2, 'Febrero 2025', '2025-02-01', '2025-02-05', 'completado',
 420, 857, 0.0035, 3780.00,
 2, 380000, 110, 110,
 0.55, 60.50, 12,
 'https://app.axieinfinity.com/profile/0x771faac23673fba19a414064def8a4aacf43fcfd/activities/'),

-- Evento 3 — Marzo 2025
(3, 'Marzo 2025', '2025-03-01', '2025-03-05', 'completado',
 520, 1000, 0.003, 4680.00,
 3, 520000, 145, 145,
 0.52, 75.40, 18,
 'https://app.axieinfinity.com/profile/0x771faac23673fba19a414064def8a4aacf43fcfd/activities/'),

-- Evento 4 — Abril 2025
(4, 'Abril 2025', '2025-04-01', '2025-04-05', 'completado',
 680, 909, 0.0033, 6120.00,
 4, 640000, 188, 188,
 0.48, 90.24, 23,
 'https://app.axieinfinity.com/profile/0x771faac23673fba19a414064def8a4aacf43fcfd/activities/'),

-- Evento 5 — Mayo 2025
(5, 'Mayo 2025', '2025-05-01', '2025-05-05', 'completado',
 810, 833, 0.0036, 7290.00,
 5, 780000, 224, 224,
 0.45, 100.80, 31,
 'https://app.axieinfinity.com/profile/0x771faac23673fba19a414064def8a4aacf43fcfd/activities/');

-- ─── FONDOS — Evento 1 ───────────────────────────────────────
insert into public.event_funds (event_id, name, emoji, color_hex, pct_of_ticket, total_usd, detail, tx_hash, tx_url)
select id, name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url
from public.events e,
lateral (values
  ('Pool de Recompensas','⚔️','#B8860B', 25, 787.50, 'Primer ritual. 2 milestones alcanzados. Axie Beast y Axie Aquatic comprados y sorteados.','0xaa11bb22cc33dd44ee55ff66aa11bb22cc33dd44ee55ff66aa11bb22cc33dd44','https://app.roninchain.com/tx/0xaa11bb22cc33dd44ee55ff66aa11bb22cc33dd44ee55ff66aa11bb22cc33dd44'),
  ('Pool de Swap',       '⚖️','#CC0000', 25, 787.50, '85 Axies comprados al floor price de $0.60. Pool agotado al cierre.','0xbb22cc33dd44ee55ff660077aa11bb22cc33dd44ee55ff660077aa11bb22cc33','https://app.roninchain.com/tx/0xbb22cc33dd44ee55ff660077aa11bb22cc33dd44ee55ff660077aa11bb22cc33'),
  ('Quema Directa',      '🔥','#FF6600', 25, 787.50, '310.000 SLP enviados a burn address. Primera quema del proyecto.','0xcc33dd44ee55ff660077aa11bb22cc33dd44ee55ff660077aa11bb22cc33dd44','https://app.roninchain.com/tx/0xcc33dd44ee55ff660077aa11bb22cc33dd44ee55ff660077aa11bb22cc33dd44'),
  ('Operaciones y Devs', '🔩','#5a5a6a', 15, 472.50, 'Setup inicial del proyecto, deploy de infraestructura y contratos de prueba.','0xdd44ee55ff660077aa11bb22cc33dd44ee55ff660077aa11bb22cc33dd44ee55','https://app.roninchain.com/tx/0xdd44ee55ff660077aa11bb22cc33dd44ee55ff660077aa11bb22cc33dd44ee55'),
  ('Pool Reward Anual',  '🗝️','#D4A017', 10, 315.00, 'Primera contribución al pool anual de diciembre.','0xee55ff660077aa11bb22cc33dd44ee55ff660077aa11bb22cc33dd44ee55ff66','https://app.roninchain.com/tx/0xee55ff660077aa11bb22cc33dd44ee55ff660077aa11bb22cc33dd44ee55ff66')
) as v(name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url)
where e.event_number = 1;

-- ─── FONDOS — Evento 2 ───────────────────────────────────────
insert into public.event_funds (event_id, name, emoji, color_hex, pct_of_ticket, total_usd, detail, tx_hash, tx_url)
select id, name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url
from public.events e,
lateral (values
  ('Pool de Recompensas','⚔️','#B8860B', 25,  945.00, '2 milestones. Land Savannah y Axie Plant comprados y sorteados.','0x1122334455667788990011223344556677889900112233445566778899001122','https://app.roninchain.com/tx/0x1122334455667788990011223344556677889900112233445566778899001122'),
  ('Pool de Swap',       '⚖️','#CC0000', 25,  945.00, '110 Axies comprados al floor price de $0.55. 12 resets de cooldown.','0x2233445566778899001122334455667788990011223344556677889900112233','https://app.roninchain.com/tx/0x2233445566778899001122334455667788990011223344556677889900112233'),
  ('Quema Directa',      '🔥','#FF6600', 25,  945.00, '380.000 SLP enviados a burn address. TX irreversible verificable.','0x3344556677889900112233445566778899001122334455667788990011223344','https://app.roninchain.com/tx/0x3344556677889900112233445566778899001122334455667788990011223344'),
  ('Operaciones y Devs', '🔩','#5a5a6a', 15,  567.00, 'Mantenimiento de infraestructura y servidor.','0x4455667788990011223344556677889900112233445566778899001122334455','https://app.roninchain.com/tx/0x4455667788990011223344556677889900112233445566778899001122334455'),
  ('Pool Reward Anual',  '🗝️','#D4A017', 10,  378.00, 'Acumulado para el evento de diciembre.','0x5566778899001122334455667788990011223344556677889900112233445566','https://app.roninchain.com/tx/0x5566778899001122334455667788990011223344556677889900112233445566')
) as v(name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url)
where e.event_number = 2;

-- ─── FONDOS — Evento 3 ───────────────────────────────────────
insert into public.event_funds (event_id, name, emoji, color_hex, pct_of_ticket, total_usd, detail, tx_hash, tx_url)
select id, name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url
from public.events e,
lateral (values
  ('Pool de Recompensas','⚔️','#B8860B', 25, 1170.00, '3 milestones. Axie Beast, Land Savannah y Axie Aquatic Mystic comprados y sorteados.','0x6677889900112233445566778899001122334455667788990011223344556677','https://app.roninchain.com/tx/0x6677889900112233445566778899001122334455667788990011223344556677'),
  ('Pool de Swap',       '⚖️','#CC0000', 25, 1170.00, '145 Axies comprados al floor price de $0.52. Pool agotado en 18 hs.','0x7788990011223344556677889900112233445566778899001122334455667788','https://app.roninchain.com/tx/0x7788990011223344556677889900112233445566778899001122334455667788'),
  ('Quema Directa',      '🔥','#FF6600', 25, 1170.00, '520.000 SLP enviados a burn address. TX irreversible.','0x8899001122334455667788990011223344556677889900112233445566778899','https://app.roninchain.com/tx/0x8899001122334455667788990011223344556677889900112233445566778899'),
  ('Operaciones y Devs', '🔩','#5a5a6a', 15,  702.00, 'Gas fees, servidor y mantenimiento de contratos.','0x9900112233445566778899001122334455667788990011223344556677889900','https://app.roninchain.com/tx/0x9900112233445566778899001122334455667788990011223344556677889900'),
  ('Pool Reward Anual',  '🗝️','#D4A017', 10,  468.00, 'Acumulado para el evento de diciembre 2025.','0x0011223344556677889900112233445566778899001122334455667788990011','https://app.roninchain.com/tx/0x0011223344556677889900112233445566778899001122334455667788990011')
) as v(name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url)
where e.event_number = 3;

-- ─── FONDOS — Evento 4 ───────────────────────────────────────
insert into public.event_funds (event_id, name, emoji, color_hex, pct_of_ticket, total_usd, detail, tx_hash, tx_url)
select id, name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url
from public.events e,
lateral (values
  ('Pool de Recompensas','⚔️','#B8860B', 25, 1530.00, '4 milestones. Axie Origin, Land Forest, Axie Mystic y Land Lunacia comprados.','0xaabb1122cc3344dd5566ee7788ff9900aabb1122cc3344dd5566ee7788ff9900','https://app.roninchain.com/tx/0xaabb1122cc3344dd5566ee7788ff9900aabb1122cc3344dd5566ee7788ff9900'),
  ('Pool de Swap',       '⚖️','#CC0000', 25, 1530.00, '188 Axies comprados al floor price de $0.48. Mayor volumen de swap hasta la fecha.','0xbbcc2233dd4455ee6677ff8899001122aabbccdd2233445566778899001122aa','https://app.roninchain.com/tx/0xbbcc2233dd4455ee6677ff8899001122aabbccdd2233445566778899001122aa'),
  ('Quema Directa',      '🔥','#FF6600', 25, 1530.00, '640.000 SLP enviados a burn address. Mayor quema mensual hasta la fecha.','0xccdd3344ee5566ff7788990011aabb22ccdd3344ee5566ff7788990011aabb22','https://app.roninchain.com/tx/0xccdd3344ee5566ff7788990011aabb22ccdd3344ee5566ff7788990011aabb22'),
  ('Operaciones y Devs', '🔩','#5a5a6a', 15,  918.00, 'Expansión de infraestructura ante el crecimiento del evento.','0xddee4455ff6677881199001122aabbccddee4455ff66778899001122aabbccdd','https://app.roninchain.com/tx/0xddee4455ff6677881199001122aabbccddee4455ff66778899001122aabbccdd'),
  ('Pool Reward Anual',  '🗝️','#D4A017', 10,  612.00, 'Contribución al pool anual. Acumulado total: $1.773 USD.','0xeeff5566778899001122aabbccdd3344eeff5566778899001122aabbccdd3344','https://app.roninchain.com/tx/0xeeff5566778899001122aabbccdd3344eeff5566778899001122aabbccdd3344')
) as v(name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url)
where e.event_number = 4;

-- ─── FONDOS — Evento 5 ───────────────────────────────────────
insert into public.event_funds (event_id, name, emoji, color_hex, pct_of_ticket, total_usd, detail, tx_hash, tx_url)
select id, name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url
from public.events e,
lateral (values
  ('Pool de Recompensas','⚔️','#B8860B', 25, 1822.50, '5 milestones. Record histórico. Axie Mystic raro, 2 Lands Lunacia y 2 Axies Origin.','0xff00112233445566778899aabbccddeeff00112233445566778899aabbccddee','https://app.roninchain.com/tx/0xff00112233445566778899aabbccddeeff00112233445566778899aabbccddee'),
  ('Pool de Swap',       '⚖️','#CC0000', 25, 1822.50, '224 Axies comprados al floor price de $0.45. Nuevo record de participación.','0x0011aabbccdd2233445566778899eeff0011aabbccdd2233445566778899eeff','https://app.roninchain.com/tx/0x0011aabbccdd2233445566778899eeff0011aabbccdd2233445566778899eeff'),
  ('Quema Directa',      '🔥','#FF6600', 25, 1822.50, '780.000 SLP quemados. Acumulado histórico supera 2.6M SLP destruidos.','0x1122ccddee334455667788ff99001122ccddee334455667788ff99001122ccdd','https://app.roninchain.com/tx/0x1122ccddee334455667788ff99001122ccddee334455667788ff99001122ccdd'),
  ('Operaciones y Devs', '🔩','#5a5a6a', 15, 1093.50, 'Auditoría de contratos, mejoras de seguridad y nueva infraestructura.','0x2233ddeeff4455667788990011aabb2233ddeeff4455667788990011aabb2233','https://app.roninchain.com/tx/0x2233ddeeff4455667788990011aabb2233ddeeff4455667788990011aabb2233'),
  ('Pool Reward Anual',  '🗝️','#D4A017', 10,  729.00, 'Contribución mayo. Pool anual acumulado: $2.502 USD para el evento de diciembre.','0x3344eeff556677889900112233aabb3344eeff556677889900112233aabb3344','https://app.roninchain.com/tx/0x3344eeff556677889900112233aabb3344eeff556677889900112233aabb3344')
) as v(name, emoji, color_hex, pct, total_usd, detail, tx_hash, tx_url)
where e.event_number = 5;

-- ─── MILESTONES — Evento 1 ───────────────────────────────────
insert into public.milestones (event_id, level, threshold_usd, slp_equivalent, slp_price_at_time, item_name, item_type, market_url, purchase_tx_hash, purchase_tx_url, winner_wallet, delivery_tx_hash, delivery_tx_url)
select e.id, v.level, v.threshold_usd, v.slp_eq, v.slp_price, v.item_name, v.item_type::text, v.market_url, v.ptx, v.ptx_url, v.winner, v.dtx, v.dtx_url
from public.events e,
lateral (values
  (1, 100.00, 33333, 0.003, 'Axie Beast #11822913 — Reptile Purity 4/6', 'axie', 'https://app.axieinfinity.com/marketplace/axies/11822913/', '0xaa00bb11cc22dd33ee44ff5500aa00bb11cc22dd33ee44ff5500aa00bb11cc22','https://app.roninchain.com/tx/0xaa00bb11cc22dd33ee44ff5500aa00bb11cc22dd33ee44ff5500aa00bb11cc22','ronin:0xDe67abc5Fg412Ij9Kl3Mn6Op1Qr8St2Uv5Wx7Yz0', '0xbb11cc22dd33ee44ff5500aa11bb11cc22dd33ee44ff5500aa11bb11cc22dd33','https://app.roninchain.com/tx/0xbb11cc22dd33ee44ff5500aa11bb11cc22dd33ee44ff5500aa11bb11cc22dd33'),
  (2, 200.00, 66666, 0.003, 'Axie Aquatic #11900234 — Origin Purity 3/6', 'axie', 'https://app.axieinfinity.com/marketplace/axies/11900234/', '0xcc22dd33ee44ff5500aa11bb22cc22dd33ee44ff5500aa11bb22cc22dd33ee44','https://app.roninchain.com/tx/0xcc22dd33ee44ff5500aa11bb22cc22dd33ee44ff5500aa11bb22cc22dd33ee44','ronin:0xHi78xyz6Ij3Kl9Mn1Op4Qr7St0Uv2Wx5Yz8Ab3', '0xdd33ee44ff5500aa11bb22cc33dd33ee44ff5500aa11bb22cc33dd33ee44ff55','https://app.roninchain.com/tx/0xdd33ee44ff5500aa11bb22cc33dd33ee44ff5500aa11bb22cc33dd33ee44ff55')
) as v(level, threshold_usd, slp_eq, slp_price, item_name, item_type, market_url, ptx, ptx_url, winner, dtx, dtx_url)
where e.event_number = 1;

-- ─── MILESTONES — Evento 2 ───────────────────────────────────
insert into public.milestones (event_id, level, threshold_usd, slp_equivalent, slp_price_at_time, item_name, item_type, market_url, purchase_tx_hash, purchase_tx_url, winner_wallet, delivery_tx_hash, delivery_tx_url)
select e.id, v.level, v.threshold_usd, v.slp_eq, v.slp_price, v.item_name, v.item_type::text, v.market_url, v.ptx, v.ptx_url, v.winner, v.dtx, v.dtx_url
from public.events e,
lateral (values
  (1, 100.00, 28571, 0.0035, 'Land Plot — Savannah (-145,-109)', 'land', 'https://app.axieinfinity.com/marketplace/lands/-145/-109/', '0xf1e2d3c4b5a60011223344556677f1e2d3c4b5a60011223344556677f1e2d3c4','https://app.roninchain.com/tx/0xf1e2d3c4b5a60011223344556677f1e2d3c4b5a60011223344556677f1e2d3c4','ronin:0xBc45def3De2Fg7Hi1Jk4Lm9No2Pq5Rt8Uv0Wx3', '0xa8b9c0d1e2f3001122334455a8b9c0d1e2f3001122334455a8b9c0d1e2f30011','https://app.roninchain.com/tx/0xa8b9c0d1e2f3001122334455a8b9c0d1e2f3001122334455a8b9c0d1e2f30011'),
  (2, 200.00, 57142, 0.0035, 'Axie Plant #12033456 — Purity 5/6 Summer', 'axie', 'https://app.axieinfinity.com/marketplace/axies/12033456/', '0xe2d3c4b5a600112233445566e2d3c4b5a600112233445566e2d3c4b5a6001122','https://app.roninchain.com/tx/0xe2d3c4b5a600112233445566e2d3c4b5a600112233445566e2d3c4b5a6001122','ronin:0xFg23hij7Kl4Mn1Op8Qr5St2Uv9Wx6Yz3Ab0Cd7', '0xb9c0d1e2f300112233b9c0d1e2f300112233b9c0d1e2f300112233b9c0d1e2f3','https://app.roninchain.com/tx/0xb9c0d1e2f300112233b9c0d1e2f300112233b9c0d1e2f300112233b9c0d1e2f3')
) as v(level, threshold_usd, slp_eq, slp_price, item_name, item_type, market_url, ptx, ptx_url, winner, dtx, dtx_url)
where e.event_number = 2;

-- ─── MILESTONES — Evento 3 ───────────────────────────────────
insert into public.milestones (event_id, level, threshold_usd, slp_equivalent, slp_price_at_time, item_name, item_type, market_url, purchase_tx_hash, purchase_tx_url, winner_wallet, delivery_tx_hash, delivery_tx_url)
select e.id, v.level, v.threshold_usd, v.slp_eq, v.slp_price, v.item_name, v.item_type::text, v.market_url, v.ptx, v.ptx_url, v.winner, v.dtx, v.dtx_url
from public.events e,
lateral (values
  (1, 100.00, 33333, 0.003, 'Axie Beast #11822913 — Purity 4/6 Hot Butt', 'axie', 'https://app.axieinfinity.com/marketplace/axies/11822913/', '0xa1b2c3d4e5f60011223344556677a1b2c3d4e5f60011223344556677a1b2c3d4','https://app.roninchain.com/tx/0xa1b2c3d4e5f60011223344556677a1b2c3d4e5f60011223344556677a1b2c3d4','ronin:0xAb3f2Cd1Ef5Gh8Ij2Kl6Mn9Op3Qr7St0Uv4Wx8', '0xd4e5f6a7b8c900112233d4e5f6a7b8c900112233d4e5f6a7b8c900112233d4e5','https://app.roninchain.com/tx/0xd4e5f6a7b8c900112233d4e5f6a7b8c900112233d4e5f6a7b8c900112233d4e5'),
  (2, 200.00, 66666, 0.003, 'Land Plot — Savannah (-148,-112)', 'land', 'https://app.axieinfinity.com/marketplace/lands/-148/-112/', '0xb2c3d4e5f6a700112233445566b2c3d4e5f6a700112233445566b2c3d4e5f6a7','https://app.roninchain.com/tx/0xb2c3d4e5f6a700112233445566b2c3d4e5f6a700112233445566b2c3d4e5f6a7','ronin:0xEf12Gh9Ij3Kl6Mn0Op4Qr8St2Uv5Wx9Yz1Ab4Cd', '0xe5f6a7b8c9001122334455e5f6a7b8c9001122334455e5f6a7b8c90011223344','https://app.roninchain.com/tx/0xe5f6a7b8c9001122334455e5f6a7b8c9001122334455e5f6a7b8c90011223344'),
  (3, 300.00,100000, 0.003, 'Axie Aquatic #12100789 — Mystic 1/6 Risky Fish', 'axie', 'https://app.axieinfinity.com/marketplace/axies/12100789/', '0xc3d4e5f6a7b800112233445566c3d4e5f6a7b800112233445566c3d4e5f6a7b8','https://app.roninchain.com/tx/0xc3d4e5f6a7b800112233445566c3d4e5f6a7b800112233445566c3d4e5f6a7b8','ronin:0xGh56Ij0Kl3Mn7Op1Qr5St9Uv2Wx6Yz4Ab7Cd1Ef', '0xf6a7b8c9001122334455f6a7b8c9001122334455f6a7b8c9001122334455f6a7','https://app.roninchain.com/tx/0xf6a7b8c9001122334455f6a7b8c9001122334455f6a7b8c9001122334455f6a7')
) as v(level, threshold_usd, slp_eq, slp_price, item_name, item_type, market_url, ptx, ptx_url, winner, dtx, dtx_url)
where e.event_number = 3;

-- ─── MILESTONES — Evento 4 ───────────────────────────────────
insert into public.milestones (event_id, level, threshold_usd, slp_equivalent, slp_price_at_time, item_name, item_type, market_url, purchase_tx_hash, purchase_tx_url, winner_wallet, delivery_tx_hash, delivery_tx_url)
select e.id, v.level, v.threshold_usd, v.slp_eq, v.slp_price, v.item_name, v.item_type::text, v.market_url, v.ptx, v.ptx_url, v.winner, v.dtx, v.dtx_url
from public.events e,
lateral (values
  (1, 100.00,  30303, 0.0033, 'Axie Beast #12250100 — Origin Purity 4/6',   'axie', 'https://app.axieinfinity.com/marketplace/axies/12250100/', '0x1a2b3c4d5e6f00112233441a2b3c4d5e6f00112233441a2b3c4d5e6f00112233','https://app.roninchain.com/tx/0x1a2b3c4d5e6f00112233441a2b3c4d5e6f00112233441a2b3c4d5e6f00112233','ronin:0xIj78Kl5Mn9Op2Qr6St0Uv3Wx7Yz1Ab4Cd8Ef2Gh', '0x2b3c4d5e6f0011223344552b3c4d5e6f0011223344552b3c4d5e6f001122334455','https://app.roninchain.com/tx/0x2b3c4d5e6f0011223344552b3c4d5e6f0011223344552b3c4d5e6f001122334455'),
  (2, 200.00,  60606, 0.0033, 'Land Plot — Forest (-52,-87)',               'land', 'https://app.axieinfinity.com/marketplace/lands/-52/-87/',   '0x3c4d5e6f00112233445566773c4d5e6f00112233445566773c4d5e6f001122334','https://app.roninchain.com/tx/0x3c4d5e6f00112233445566773c4d5e6f00112233445566773c4d5e6f001122334','ronin:0xKl90Mn3Op7Qr1St5Uv8Wx2Yz6Ab0Cd4Ef9Gh3Ij', '0x4d5e6f001122334455664d5e6f001122334455664d5e6f001122334455664d5e6f','https://app.roninchain.com/tx/0x4d5e6f001122334455664d5e6f001122334455664d5e6f001122334455664d5e6f'),
  (3, 300.00,  90909, 0.0033, 'Axie Aquatic #12380045 — Mystic 2/6 Anemone','axie', 'https://app.axieinfinity.com/marketplace/axies/12380045/', '0x5e6f0011223344556677885e6f0011223344556677885e6f001122334455667788','https://app.roninchain.com/tx/0x5e6f0011223344556677885e6f0011223344556677885e6f001122334455667788','ronin:0xMn12Op5Qr9St3Uv7Wx1Yz4Ab8Cd2Ef6Gh0Ij5Kl', '0x6f00112233445566778899006f00112233445566778899006f001122334455667788','https://app.roninchain.com/tx/0x6f00112233445566778899006f00112233445566778899006f001122334455667788'),
  (4, 400.00, 121212, 0.0033, 'Land Plot — Lunacia (-10,-22)',              'land', 'https://app.axieinfinity.com/marketplace/lands/-10/-22/',   '0x7f00112233445566778899aa7f00112233445566778899aa7f00112233445566778','https://app.roninchain.com/tx/0x7f00112233445566778899aa7f00112233445566778899aa7f00112233445566778','ronin:0xOp34Qr7St1Uv5Wx9Yz2Ab6Cd0Ef4Gh8Ij3Kl7Mn', '0x8000112233445566778899aa8000112233445566778899aa8000112233445566778','https://app.roninchain.com/tx/0x8000112233445566778899aa8000112233445566778899aa8000112233445566778')
) as v(level, threshold_usd, slp_eq, slp_price, item_name, item_type, market_url, ptx, ptx_url, winner, dtx, dtx_url)
where e.event_number = 4;

-- ─── MILESTONES — Evento 5 ───────────────────────────────────
insert into public.milestones (event_id, level, threshold_usd, slp_equivalent, slp_price_at_time, item_name, item_type, market_url, purchase_tx_hash, purchase_tx_url, winner_wallet, delivery_tx_hash, delivery_tx_url)
select e.id, v.level, v.threshold_usd, v.slp_eq, v.slp_price, v.item_name, v.item_type::text, v.market_url, v.ptx, v.ptx_url, v.winner, v.dtx, v.dtx_url
from public.events e,
lateral (values
  (1, 100.00,  27777, 0.0036, 'Axie Plant #12500678 — Purity 6/6 Rare',     'axie', 'https://app.axieinfinity.com/marketplace/axies/12500678/', '0xaa11223344556677889900bbaa11223344556677889900bbaa11223344556677','https://app.roninchain.com/tx/0xaa11223344556677889900bbaa11223344556677889900bbaa11223344556677','ronin:0xQr56St9Uv3Wx7Yz1Ab5Cd8Ef2Gh6Ij0Kl4Mn9Op', '0xbb22334455667788990011ccbb22334455667788990011ccbb22334455667788','https://app.roninchain.com/tx/0xbb22334455667788990011ccbb22334455667788990011ccbb22334455667788'),
  (2, 200.00,  55555, 0.0036, 'Land Plot — Lunacia (-8,-19)',               'land', 'https://app.axieinfinity.com/marketplace/lands/-8/-19/',    '0xcc33445566778899001122ddcc33445566778899001122ddcc33445566778899','https://app.roninchain.com/tx/0xcc33445566778899001122ddcc33445566778899001122ddcc33445566778899','ronin:0xSt78Uv1Wx5Yz9Ab3Cd7Ef1Gh4Ij8Kl2Mn6Op0Qr', '0xdd44556677889900112233eedd44556677889900112233eedd4455667788990011','https://app.roninchain.com/tx/0xdd44556677889900112233eedd44556677889900112233eedd4455667788990011'),
  (3, 300.00,  83333, 0.0036, 'Axie Beast #12634900 — Mystic 1/6 Nut Cracker','axie','https://app.axieinfinity.com/marketplace/axies/12634900/','0xee55667788990011223344ffee55667788990011223344ffee55667788990011','https://app.roninchain.com/tx/0xee55667788990011223344ffee55667788990011223344ffee55667788990011','ronin:0xUv90Wx3Yz7Ab1Cd5Ef9Gh2Ij6Kl0Mn4Op8Qr3St', '0xff66778899001122334455ff66778899001122334455ff66778899001122334455','https://app.roninchain.com/tx/0xff66778899001122334455ff66778899001122334455ff66778899001122334455'),
  (4, 400.00, 111111, 0.0036, 'Land Plot — Lunacia (-5,-14)',               'land', 'https://app.axieinfinity.com/marketplace/lands/-5/-14/',    '0x0077889900112233445566aa0077889900112233445566aa0077889900112233','https://app.roninchain.com/tx/0x0077889900112233445566aa0077889900112233445566aa0077889900112233','ronin:0xWx12Yz5Ab9Cd3Ef7Gh1Ij4Kl8Mn2Op6Qr0St5Uv', '0x1188990011223344556677bb1188990011223344556677bb118899001122334455','https://app.roninchain.com/tx/0x1188990011223344556677bb1188990011223344556677bb118899001122334455'),
  (5, 500.00, 138888, 0.0036, 'Axie Aquatic #12780123 — Mystic 3/6 Risky Fish','axie','https://app.axieinfinity.com/marketplace/axies/12780123/','0x2299001122334455667788cc2299001122334455667788cc2299001122334455','https://app.roninchain.com/tx/0x2299001122334455667788cc2299001122334455667788cc2299001122334455','ronin:0xYz34Ab7Cd1Ef5Gh9Ij3Kl6Mn0Op4Qr8St2Uv7Wx', '0x33aa001122334455667788dd33aa001122334455667788dd33aa001122334455667788','https://app.roninchain.com/tx/0x33aa001122334455667788dd33aa001122334455667788dd33aa001122334455667788')
) as v(level, threshold_usd, slp_eq, slp_price, item_name, item_type, market_url, ptx, ptx_url, winner, dtx, dtx_url)
where e.event_number = 5;

-- ─── VERIFICACIÓN ─────────────────────────────────────────────
select 
  e.event_number,
  e.label,
  e.total_tickets,
  e.slp_burned,
  e.axies_released,
  count(distinct f.id) as fondos,
  count(distinct m.id) as milestones
from public.events e
left join public.event_funds f on f.event_id = e.id
left join public.milestones m on m.event_id = e.id
group by e.event_number, e.label, e.total_tickets, e.slp_burned, e.axies_released
order by e.event_number;
