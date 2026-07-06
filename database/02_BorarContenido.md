-- ============================================================
-- 02_VACIAR_BASE_DE_DATOS.sql
-- QUEMA DE SLP — Fynolt's Cult
--
-- Borra TODO el contenido de las tablas (datos), sin tocar la
-- estructura (tablas, índices, constraints, funciones, policies,
-- cron jobs siguen intactos). Deja la base lista para otra ronda
-- de pruebas, con los datos de referencia (system_config,
-- level_thresholds, shop_items) reinsertados igual que en la
-- creación original.
--
-- Requiere que 01_crear_base_de_datos.sql ya se haya corrido.
-- ============================================================

-- ── 1. Vaciar tablas transaccionales ───────────────────────────
-- CASCADE porque hay FKs entre ellas; RESTART IDENTITY no aplica
-- (usamos uuid, no serial), se deja igual por si se agregan
-- columnas serial en el futuro.
truncate table
  public.owned_items,
  public.profiles,
  public.annual_keys_access,
  public.annual_rewards,
  public.annual_event,
  public.annual_keys,
  public.annual_pool,
  public.favorites,
  public.swap_cooldown_releases,
  public.released_axies,
  public.event_funds,
  public.participants,
  public.level_rewards_unlocked,
  public.ticket_transfers,
  public.tickets,
  public.events
restart identity cascade;

-- ── 2. Vaciar tablas de referencia/config ──────────────────────
-- (se truncan y se reinsertan para garantizar que queden
-- exactamente como en un proyecto recién creado)
truncate table public.shop_items restart identity cascade;
truncate table public.level_thresholds restart identity cascade;
truncate table public.system_config restart identity cascade;

-- ── 3. Reinsertar datos de referencia ──────────────────────────
insert into public.system_config (key, value) values
  ('sale_window_hours', '72'),
  ('swap_window_hours', '24'),
  ('ticket_price_usd',  '3.00'),
  ('show_test_events_in_history', 'false'),
  ('test_mode_enabled', 'false');

insert into public.level_thresholds (level, threshold_usd, rewards) values
(1,  50.00, '[{"amount_usd": 50,  "count": 1}]'::jsonb),
(2, 100.00, '[{"amount_usd": 50,  "count": 2}]'::jsonb),
(3, 150.00, '[{"amount_usd": 50,  "count": 3}]'::jsonb),
(4, 200.00, '[{"amount_usd": 50,  "count": 4}]'::jsonb),
(5, 250.00, '[{"amount_usd": 50,  "count": 1}, {"amount_usd": 100, "count": 2}]'::jsonb),
(6, 300.00, '[{"amount_usd": 100, "count": 3}]'::jsonb);

insert into public.shop_items (type, name, image_url, price_slp, sort_order) values
('avatar','Cultista Rojo',   'https://api.dicebear.com/9.x/pixel-art/png?seed=cultist-red&backgroundColor=cc0000',   0,1),
('avatar','Cultista Dorado', 'https://api.dicebear.com/9.x/pixel-art/png?seed=cultist-gold&backgroundColor=b8860b',  0,2),
('avatar','Wallet Guardian', 'https://api.dicebear.com/9.x/pixel-art/png?seed=wallet-guard&backgroundColor=1a0008',  0,3),
('avatar','Ticket Master',   'https://api.dicebear.com/9.x/pixel-art/png?seed=ticket-master&backgroundColor=6b4a00', 0,4),
('avatar','Key Keeper',      'https://api.dicebear.com/9.x/pixel-art/png?seed=key-keeper&backgroundColor=3a0510',    0,5),
('avatar','Axie Liberator',  'https://api.dicebear.com/9.x/pixel-art/png?seed=axie-lib&backgroundColor=4a7c3f',      0,6),
('avatar','SLP Burner',      'https://api.dicebear.com/9.x/pixel-art/png?seed=slp-burn&backgroundColor=ff6600',      0,7),
('avatar','Ritual Master',   'https://api.dicebear.com/9.x/pixel-art/png?seed=ritual-master&backgroundColor=ff0033', 0,8),
('avatar','Annual Champion', 'https://api.dicebear.com/9.x/pixel-art/png?seed=annual-champ&backgroundColor=ffb300',  0,9),
('avatar','Anon Cultist',    'https://api.dicebear.com/9.x/pixel-art/png?seed=anon-cultist&backgroundColor=5a4040',  0,10);

-- ── 4. Verificación ─────────────────────────────────────────────
select 'Base vaciada. Estructura intacta.' as resultado;
select
  (select count(*) from public.events)            as eventos,
  (select count(*) from public.tickets)           as tickets,
  (select count(*) from public.annual_keys)        as llaves_anuales,
  (select count(*) from public.shop_items)         as items_tienda,
  (select count(*) from public.level_thresholds)   as niveles,
  (select count(*) from public.system_config)      as config;

-- Nota: los cron jobs (create-monthly-event, advance-event-phases)
-- NO se tocan con este script — siguen corriendo. Si el día actual
-- es "1", el sistema puede crear un evento real de nuevo dentro de
-- los próximos 5 minutos. Si vas a hacer pruebas manuales, usá
-- test_create_event() en vez de esperar al evento real.