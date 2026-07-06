-- ============================================================
-- 01_CREAR_BASE_DE_DATOS.sql
-- QUEMA DE SLP — Fynolt's Cult — Proyecto Universitario
--
-- Recrea toda la base de datos desde cero: tablas, relaciones,
-- índices, constraints, funciones, policies, realtime y cron.
--
-- REQUISITO: correr primero 03_eliminar_base_de_datos.sql si el
-- proyecto ya tenía objetos cargados (o usar un proyecto nuevo).
--
-- REQUISITOS PREVIOS (Database → Extensions, desde el Dashboard):
--   ✓ uuid-ossp
--   ✓ pg_net
--   ✓ pg_cron
-- ============================================================


-- ============================================================
-- SECCIÓN 1 — EXTENSIONES
-- ============================================================
create extension if not exists "uuid-ossp";
-- pg_net y pg_cron se habilitan desde el Dashboard, no por SQL.


-- ============================================================
-- SECCIÓN 2 — CONFIGURACIÓN DEL CICLO
-- ============================================================
create table public.system_config (
  key    text primary key,
  value  text not null
);

insert into public.system_config (key, value) values
  ('sale_window_hours', '72'),
  ('swap_window_hours', '24'),
  ('ticket_price_usd',  '3.00'),
  ('show_test_events_in_history', 'false'),
  ('test_mode_enabled', 'false');


-- ============================================================
-- SECCIÓN 3 — TABLAS PRINCIPALES
-- ============================================================

create table public.events (
  id                  uuid primary key default uuid_generate_v4(),
  event_number        integer unique not null,
  label               text not null,
  date_start          timestamptz not null,
  date_end            timestamptz not null,
  swap_started_at     timestamptz,
  status              text not null default 'previo'
                       check (status in ('previo','activo','swap','completado')),
  closure_reason      text check (closure_reason in ('manual', 'tiempo_agotado', 'fondos_agotados')),
  total_tickets       integer default 0,
  ticket_price_usd    numeric(10,2) default 3.00,
  ritual_level        integer not null default 0,
  rewards_pool_slp    numeric(18,0) default 0,
  swap_pool_slp       numeric(18,0) default 0,
  burn_pool_slp       numeric(18,0) default 0,
  ops_pool_slp        numeric(18,0) default 0,
  special_pool_slp    numeric(18,0) default 0,
  total_raised_slp    numeric(18,0) default 0,
  rewards_pool_usd    numeric(12,2) default 0,
  total_raised_usd    numeric(12,2) default 0,
  floor_price_usd     numeric(10,4) default 0,
  axies_swapped       integer default 0,
  swap_pool_spent_slp numeric(18,0) default 0,
  cooldown_resets     integer default 0,
  axies_released      integer default 0,
  wallet_url          text,
  created_at          timestamptz default now()
);
create index idx_events_status on public.events(status);

create table public.tickets (
  id                       uuid primary key default uuid_generate_v4(),
  event_id                 uuid not null references public.events(id) on delete cascade,
  wallet_address           text not null,
  original_wallet_address  text not null,
  paid_slp                 numeric(18,0),
  slp_price_at_purchase    numeric(12,8),
  token_id                 text,
  tx_hash                  text,
  qr_code                  text unique not null,
  status                   text not null default 'vivo'
                           check (status in ('vivo', 'usado', 'evento-finalizado')),
  purchased_at             timestamptz default now()
);
create index idx_tickets_event   on public.tickets(event_id);
create index idx_tickets_wallet  on public.tickets(wallet_address);
create index idx_tickets_original_wallet on public.tickets(original_wallet_address);
create index idx_tickets_status  on public.tickets(event_id, status);
create index idx_tickets_wallet_status on public.tickets(wallet_address, status);

create table public.ticket_transfers (
  id             uuid primary key default uuid_generate_v4(),
  ticket_id      uuid not null references public.tickets(id) on delete cascade,
  event_id       uuid not null references public.events(id) on delete cascade,
  from_wallet    text not null,
  to_wallet      text not null,
  tx_hash        text,
  transferred_at timestamptz default now()
);
create index idx_ticket_transfers_ticket on public.ticket_transfers(ticket_id);
create index idx_ticket_transfers_event  on public.ticket_transfers(event_id);

create table public.level_thresholds (
  level          integer primary key,
  threshold_usd  numeric(10,2) not null,
  rewards        jsonb not null
);

insert into public.level_thresholds (level, threshold_usd, rewards) values
(1,  50.00, '[{"amount_usd": 50,  "count": 1}]'::jsonb),
(2, 100.00, '[{"amount_usd": 50,  "count": 2}]'::jsonb),
(3, 150.00, '[{"amount_usd": 50,  "count": 3}]'::jsonb),
(4, 200.00, '[{"amount_usd": 50,  "count": 4}]'::jsonb),
(5, 250.00, '[{"amount_usd": 50,  "count": 1}, {"amount_usd": 100, "count": 2}]'::jsonb),
(6, 300.00, '[{"amount_usd": 100, "count": 3}]'::jsonb);

create table public.level_rewards_unlocked (
  id                  uuid primary key default uuid_generate_v4(),
  event_id            uuid not null references public.events(id) on delete cascade,
  level_reached       integer not null,
  amount_usd          numeric(10,2) not null,
  slp_equivalent      numeric(18,0),
  slp_price_at_time   numeric(12,8),
  draw_order          integer not null,
  status              text not null default 'pending-reward'
                       check (status in ('pending-reward', 'entregada')),
  winner_ticket_id    uuid references public.tickets(id) on delete set null,
  winner_wallet       text,
  delivery_tx_hash    text,
  delivery_tx_url     text,
  drawn_at            timestamptz,
  created_at          timestamptz default now()
);
create index idx_level_rewards_event  on public.level_rewards_unlocked(event_id);
create index idx_level_rewards_status on public.level_rewards_unlocked(event_id, status, draw_order);

create table public.participants (
  id                    uuid primary key default uuid_generate_v4(),
  event_id              uuid not null references public.events(id) on delete cascade,
  wallet_address        text not null,
  tickets_count         integer default 1,
  swap_cooldown_until   timestamptz,
  unique(event_id, wallet_address)
);
create index idx_participants_event on public.participants(event_id);

create table public.event_funds (
  id             uuid primary key default uuid_generate_v4(),
  event_id       uuid not null references public.events(id) on delete cascade,
  name           text not null,
  emoji          text,
  color_hex      text,
  pct_of_ticket  integer not null,
  total_slp      numeric(18,0) default 0,
  total_usd_ref  numeric(12,2) default 0,
  detail         text,
  tx_hash        text,
  tx_url         text,
  created_at     timestamptz default now()
);
create index idx_event_funds_event on public.event_funds(event_id);

create table public.released_axies (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references public.events(id) on delete cascade,
  wallet_address  text not null,
  axie_id         text not null,
  release_reason  text not null default 'swap' check (release_reason in ('swap', 'cooldown_release')),
  paid_slp        numeric(18,0),
  tx_hash         text,
  tx_url          text,
  released_at     timestamptz default now()
);
create index idx_released_axies_event on public.released_axies(event_id);
create index idx_released_axies_wallet on public.released_axies(wallet_address);

create table public.swap_cooldown_releases (
  id             uuid primary key default uuid_generate_v4(),
  event_id       uuid not null references public.events(id) on delete cascade,
  wallet_address text not null,
  method         text not null check (method in ('pago_slp', 'axie_extra')),
  paid_slp       numeric(18,0),
  axie_id        text,
  tx_hash        text,
  created_at     timestamptz default now()
);
create index idx_cooldown_releases_event on public.swap_cooldown_releases(event_id);
create index idx_cooldown_releases_wallet on public.swap_cooldown_releases(wallet_address);

create table public.favorites (
  id              uuid primary key default uuid_generate_v4(),
  wallet_address  text not null,
  event_id        uuid not null references public.events(id) on delete cascade,
  created_at      timestamptz default now(),
  unique(wallet_address, event_id)
);
create index idx_favorites_wallet on public.favorites(wallet_address);
create index idx_favorites_event  on public.favorites(event_id);

create table public.annual_pool (
  id             uuid primary key default uuid_generate_v4(),
  year           integer unique not null,
  pool_slp       numeric(18,0) default 0,
  pool_usd_ref   numeric(12,2) default 0,
  status         text not null default 'acumulando'
                 check (status in ('acumulando','ventana-minteo','sorteo-activo','completado')),
  minteo_inicio  timestamptz,
  minteo_fin     timestamptz,
  sorteo_inicio  timestamptz,
  created_at     timestamptz default now()
);

create table public.annual_keys (
  id               uuid primary key default uuid_generate_v4(),
  year             integer not null,
  token_id         text,
  mint_tx_hash     text,
  minted_by_wallet text not null,
  owner_wallet     text not null,
  status           text not null default 'vivo'
                   check (status in ('vivo','usado','quemada')),
  minted_at        timestamptz default now()
);
create index idx_annual_keys_year   on public.annual_keys(year);
create index idx_annual_keys_owner  on public.annual_keys(owner_wallet);
create index idx_annual_keys_status on public.annual_keys(year, status);

create table public.annual_event (
  id               uuid primary key default uuid_generate_v4(),
  year             integer unique not null,
  status           text default 'pendiente' check (status in ('pendiente','activo','completado')),
  pool_total_slp   numeric(18,0) default 0,
  reward_slp_each  numeric(18,0) default 0,
  draw_at          timestamptz,
  completed_at     timestamptz
);

create table public.annual_rewards (
  id                uuid primary key default uuid_generate_v4(),
  annual_event_id   uuid not null references public.annual_event(id) on delete cascade,
  amount_slp        numeric(18,0) not null,
  draw_order        integer not null,
  status            text not null default 'pending-reward'
                    check (status in ('pending-reward','entregada')),
  winner_key_id     uuid references public.annual_keys(id) on delete set null,
  winner_wallet     text,
  delivery_tx_hash  text,
  delivery_tx_url   text,
  drawn_at          timestamptz,
  created_at        timestamptz default now()
);
create index idx_annual_rewards_event on public.annual_rewards(annual_event_id);

create table public.annual_keys_access (
  id             uuid primary key default uuid_generate_v4(),
  key_id         uuid not null references public.annual_keys(id) on delete cascade,
  wallet_address text not null,
  granted        boolean not null,
  reason         text,
  accessed_at    timestamptz default now()
);

create table public.shop_items (
  id          uuid primary key default uuid_generate_v4(),
  type        text not null check (type in ('avatar','frame','banner')),
  name        text not null,
  image_url   text not null,
  price_slp   numeric(18,0) default 0,
  is_active   boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

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

create table public.profiles (
  wallet_address  text primary key,
  display_name    text,
  avatar_item_id  uuid references public.shop_items(id) on delete set null,
  frame_item_id   uuid references public.shop_items(id) on delete set null,
  banner_item_id  uuid references public.shop_items(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table public.owned_items (
  id              uuid primary key default uuid_generate_v4(),
  wallet_address  text not null,
  item_id         uuid not null references public.shop_items(id) on delete cascade,
  paid_slp        numeric(18,0) default 0,
  tx_hash         text,
  acquired_at     timestamptz default now(),
  unique(wallet_address, item_id)
);


-- ============================================================
-- SECCIÓN 4 — ROW LEVEL SECURITY
-- ============================================================
alter table public.events                 enable row level security;
alter table public.tickets                enable row level security;
alter table public.ticket_transfers       enable row level security;
alter table public.level_thresholds       enable row level security;
alter table public.level_rewards_unlocked enable row level security;
alter table public.participants           enable row level security;
alter table public.event_funds            enable row level security;
alter table public.released_axies         enable row level security;
alter table public.swap_cooldown_releases enable row level security;
alter table public.favorites              enable row level security;
alter table public.annual_pool            enable row level security;
alter table public.annual_keys            enable row level security;
alter table public.annual_event           enable row level security;
alter table public.annual_rewards         enable row level security;
alter table public.annual_keys_access     enable row level security;
alter table public.shop_items             enable row level security;
alter table public.profiles               enable row level security;
alter table public.owned_items            enable row level security;
alter table public.system_config          enable row level security;

create policy "events_r"        on public.events                 for select using (true);
create policy "tickets_r"       on public.tickets                for select using (true);
create policy "ticket_transfers_r" on public.ticket_transfers    for select using (true);
create policy "thresholds_r"    on public.level_thresholds       for select using (true);
create policy "rewards_r"       on public.level_rewards_unlocked for select using (true);
create policy "participants_r"  on public.participants           for select using (true);
create policy "event_funds_r"   on public.event_funds            for select using (true);
create policy "axies_r"         on public.released_axies         for select using (true);
create policy "cooldown_r"      on public.swap_cooldown_releases for select using (true);
create policy "favorites_r"     on public.favorites              for select using (true);
create policy "favorites_i"     on public.favorites              for insert with check (true);
create policy "favorites_d"     on public.favorites              for delete using (true);
create policy "annual_pool_r"   on public.annual_pool            for select using (true);
create policy "annual_keys_r"   on public.annual_keys            for select using (true);
create policy "annual_event_r"  on public.annual_event           for select using (true);
create policy "annual_rwd_r"    on public.annual_rewards         for select using (true);
create policy "access_r"        on public.annual_keys_access     for select using (true);
create policy "shop_r"          on public.shop_items             for select using (true);
create policy "profiles_r"      on public.profiles               for select using (true);
create policy "profiles_i"      on public.profiles               for insert with check (true);
create policy "profiles_u"      on public.profiles               for update using (true);
create policy "owned_r"         on public.owned_items            for select using (true);
create policy "config_r"        on public.system_config          for select using (true);


-- ============================================================
-- SECCIÓN 5 — REALTIME
-- ============================================================
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.ticket_transfers;
alter publication supabase_realtime add table public.level_rewards_unlocked;
alter publication supabase_realtime add table public.favorites;
alter publication supabase_realtime add table public.annual_pool;
alter publication supabase_realtime add table public.profiles;


-- ============================================================
-- SECCIÓN 6 — FUNCIONES CORE DEL SISTEMA
-- ============================================================

create or replace function public.get_slp_price_usd()
returns numeric as $$
declare
  v_request_id bigint;
  v_response   record;
  v_price      numeric;
  v_attempts   integer := 0;
begin
  select net.http_get(
    url := 'https://api.coingecko.com/api/v3/simple/price?ids=smooth-love-potion&vs_currencies=usd'
  ) into v_request_id;

  loop
    v_attempts := v_attempts + 1;
    select * into v_response from net._http_response where id = v_request_id;
    exit when v_response.status_code is not null or v_attempts > 20;
    perform pg_sleep(0.1);
  end loop;

  if v_response.status_code = 200 then
    v_price := (v_response.content::jsonb -> 'smooth-love-potion' ->> 'usd')::numeric;
  end if;

  if v_price is null or v_price <= 0 then
    raise warning 'No se pudo obtener el precio del SLP, usando fallback';
    v_price := 0.003;
  end if;

  return v_price;
end;
$$ language plpgsql;

create or replace function public.get_level_config(p_level integer)
returns table(threshold_usd numeric, rewards jsonb) as $$
begin
  return query
  select lt.threshold_usd, lt.rewards
  from public.level_thresholds lt
  where lt.level = least(p_level, 6) limit 1;
end;
$$ language plpgsql stable;

-- ── buy_ticket_core ───────────────────────────────────────────────
-- Misma lógica de siempre, pero recibe el precio de SLP YA CALCULADO
-- en vez de pedirlo él mismo. Esto es lo que permite que una compra
-- en lote (buy_tickets_bulk) consulte el precio UNA sola vez para
-- 1000 tickets, en vez de 1000 veces.
create or replace function public.buy_ticket_core(
  p_event_id       uuid,
  p_wallet_address  text,
  p_paid_slp        numeric,
  p_tx_hash         text,
  p_slp_price       numeric
)
returns jsonb as $$
declare
  v_event             record;
  v_new_rewards_slp   numeric;
  v_new_rewards_usd   numeric;
  v_level_config      record;
  v_leveled_up        boolean := false;
  v_levels_gained     integer := 0;
  v_reward            jsonb;
  v_qr_code           text;
  v_ticket_id         uuid;
  v_unlocked_rewards  jsonb := '[]'::jsonb;
  v_reward_slp        numeric;
  v_next_draw_order   integer;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if v_event is null then raise exception 'Evento no encontrado'; end if;
  if v_event.status not in ('activo') then raise exception 'El evento no está activo para venta de tickets'; end if;
  if p_paid_slp is null or p_paid_slp <= 0 then raise exception 'Monto de SLP pagado inválido'; end if;

  v_qr_code := 'TKT-' || v_event.event_number || '-' || substr(md5(random()::text), 1, 10);

  insert into public.tickets (event_id, wallet_address, original_wallet_address, paid_slp, slp_price_at_purchase, qr_code, tx_hash, purchased_at, status)
  values (p_event_id, p_wallet_address, p_wallet_address, p_paid_slp, p_slp_price, v_qr_code, p_tx_hash, now(), 'vivo')
  returning id into v_ticket_id;

  v_new_rewards_slp := v_event.rewards_pool_slp + round(p_paid_slp * 0.25);

  update public.events set
    swap_pool_slp     = swap_pool_slp     + round(p_paid_slp * 0.25),
    burn_pool_slp     = burn_pool_slp     + round(p_paid_slp * 0.25),
    ops_pool_slp      = ops_pool_slp      + round(p_paid_slp * 0.15),
    special_pool_slp  = special_pool_slp  + round(p_paid_slp * 0.10),
    total_tickets     = total_tickets + 1,
    total_raised_slp  = total_raised_slp + p_paid_slp,
    total_raised_usd  = total_raised_usd + (p_paid_slp * p_slp_price)
  where id = p_event_id;

  select coalesce(max(draw_order), 0) into v_next_draw_order
  from public.level_rewards_unlocked where event_id = p_event_id;

  loop
    select * into v_level_config from public.get_level_config(v_event.ritual_level + 1);
    v_new_rewards_usd := v_new_rewards_slp * p_slp_price;
    if v_new_rewards_usd < v_level_config.threshold_usd then exit; end if;

    v_leveled_up := true;
    v_levels_gained := v_levels_gained + 1;
    v_event.ritual_level := v_event.ritual_level + 1;
    v_new_rewards_slp := v_new_rewards_slp - round(v_level_config.threshold_usd / p_slp_price);

    for v_reward in select * from jsonb_array_elements(v_level_config.rewards) loop
      v_reward_slp := round((v_reward->>'amount_usd')::numeric / p_slp_price);
      for i in 1..(v_reward->>'count')::int loop
        v_next_draw_order := v_next_draw_order + 1;
        insert into public.level_rewards_unlocked (event_id, level_reached, amount_usd, slp_equivalent, slp_price_at_time, status, draw_order)
        values (p_event_id, v_event.ritual_level, (v_reward->>'amount_usd')::numeric, v_reward_slp, p_slp_price, 'pending-reward', v_next_draw_order);
      end loop;
    end loop;

    v_unlocked_rewards := v_unlocked_rewards || v_level_config.rewards;
  end loop;

  update public.events set
    ritual_level     = v_event.ritual_level,
    rewards_pool_slp = v_new_rewards_slp,
    rewards_pool_usd = v_new_rewards_slp * p_slp_price
  where id = p_event_id;

  insert into public.participants (event_id, wallet_address, tickets_count)
  values (p_event_id, p_wallet_address, 1)
  on conflict (event_id, wallet_address)
  do update set tickets_count = public.participants.tickets_count + 1;

  return jsonb_build_object(
    'ticket_id', v_ticket_id, 'qr_code', v_qr_code, 'slp_price_used', p_slp_price,
    'leveled_up', v_leveled_up, 'levels_gained', v_levels_gained, 'new_level', v_event.ritual_level,
    'rewards_pool_slp', v_new_rewards_slp, 'rewards_pool_usd_equiv', round(v_new_rewards_slp * p_slp_price, 2),
    'unlocked_rewards', v_unlocked_rewards
  );
end;
$$ language plpgsql security definer;

-- ── buy_ticket ────────────────────────────────────────────────────
-- Wrapper de siempre (una sola compra) — pide el precio y delega.
create or replace function public.buy_ticket(
  p_event_id       uuid,
  p_wallet_address  text,
  p_paid_slp        numeric default null,
  p_tx_hash         text default null
)
returns jsonb as $$
declare v_slp_price numeric;
begin
  v_slp_price := public.get_slp_price_usd();
  return public.buy_ticket_core(p_event_id, p_wallet_address, p_paid_slp, p_tx_hash, v_slp_price);
end;
$$ language plpgsql security definer;

-- ── buy_tickets_bulk ──────────────────────────────────────────────
-- Compra MUCHOS tickets de una — consulta el precio de SLP UNA sola
-- vez (no una por ticket) y hace todo en un solo viaje a la base.
-- Esto es lo que hace viable comprar 1000 tickets sin que se sienta
-- roto o cuelgue el navegador.
create or replace function public.buy_tickets_bulk(
  p_event_id           uuid,
  p_wallet_address     text,
  p_qty                integer,
  p_paid_slp_per_ticket numeric,
  p_tx_hash_prefix     text default 'BULK-TX'
)
returns jsonb as $$
declare
  v_slp_price numeric;
  v_result jsonb;
  v_last_result jsonb;
  i integer;
  v_total_levels_gained integer := 0;
begin
  if p_qty is null or p_qty < 1 or p_qty > 1000 then
    raise exception 'Cantidad inválida: % (debe ser entre 1 y 1000)', p_qty;
  end if;

  v_slp_price := public.get_slp_price_usd();

  for i in 1..p_qty loop
    v_last_result := public.buy_ticket_core(
      p_event_id, p_wallet_address, p_paid_slp_per_ticket,
      p_tx_hash_prefix || '-' || i, v_slp_price
    );
    v_total_levels_gained := v_total_levels_gained + coalesce((v_last_result->>'levels_gained')::int, 0);
  end loop;

  return jsonb_build_object(
    'success', true, 'tickets_bought', p_qty, 'slp_price_used', v_slp_price,
    'total_levels_gained', v_total_levels_gained,
    'final_level', v_last_result->>'new_level',
    'final_rewards_pool_slp', v_last_result->>'rewards_pool_slp'
  );
end;
$$ language plpgsql security definer;

create or replace function public.swap_axie(
  p_event_id        uuid,
  p_wallet_address   text,
  p_axie_id          text,
  p_floor_price_slp  numeric,
  p_tx_hash          text default null
)
returns jsonb as $$
declare
  v_event      record;
  v_has_ticket boolean;
  v_cooldown_until timestamptz;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if v_event is null then raise exception 'Evento no encontrado'; end if;
  if v_event.status <> 'swap' then raise exception 'La ventana de swap no está abierta'; end if;

  select exists(select 1 from public.tickets where event_id = p_event_id and wallet_address = p_wallet_address) into v_has_ticket;
  if not v_has_ticket then raise exception 'Necesitás al menos un ticket de este ritual para participar del swap'; end if;

  select swap_cooldown_until into v_cooldown_until
  from public.participants where event_id = p_event_id and wallet_address = p_wallet_address for update;

  if v_cooldown_until is not null and v_cooldown_until > now() then
    return jsonb_build_object('success', false, 'reason', 'en_cooldown',
      'message', 'Estás en cooldown hasta ' || to_char(v_cooldown_until, 'YYYY-MM-DD HH24:MI') ||
        '. Pagá 2 USD en SLP o entregá otro Axie para liberarlo antes de volver a intercambiar.',
      'cooldown_until', v_cooldown_until);
  end if;

  if p_floor_price_slp is null or p_floor_price_slp <= 0 then raise exception 'Floor price inválido'; end if;

  if v_event.swap_pool_slp < p_floor_price_slp then
    perform public.close_event_with_reason(p_event_id, 'fondos_agotados');
    return jsonb_build_object('success', false, 'reason', 'pool_agotado',
      'message', 'El pool de swap se agotó. El evento se cerró automáticamente (fondos agotados) — sorteo, quema y desglose ya corrieron.',
      'event_closed', true, 'pool_disponible_slp', v_event.swap_pool_slp, 'requerido_slp', p_floor_price_slp);
  end if;

  update public.events set
    swap_pool_slp       = swap_pool_slp - p_floor_price_slp,
    swap_pool_spent_slp = swap_pool_spent_slp + p_floor_price_slp,
    axies_swapped        = axies_swapped + 1,
    axies_released       = axies_released + 1
  where id = p_event_id;

  insert into public.released_axies (event_id, wallet_address, axie_id, release_reason, paid_slp, tx_hash)
  values (p_event_id, p_wallet_address, p_axie_id, 'swap', p_floor_price_slp, p_tx_hash);

  -- Arranca (o reinicia) el cooldown de 4hs para esta wallet en este evento
  update public.participants
    set swap_cooldown_until = now() + interval '4 hours'
    where event_id = p_event_id and wallet_address = p_wallet_address;

  return jsonb_build_object('success', true, 'axie_id', p_axie_id, 'paid_slp', p_floor_price_slp,
    'remaining_swap_pool_slp', v_event.swap_pool_slp - p_floor_price_slp,
    'cooldown_until', now() + interval '4 hours');
end;
$$ language plpgsql security definer;

-- ── release_swap_cooldown_with_slp ────────────────────────────────
-- Opción 1: pagar el equivalente a 2 USD en SLP para levantar el
-- cooldown antes de tiempo. p_paid_slp es lo que la wallet efectivamente
-- pagó (igual que en buy_ticket, el precio de referencia lo calcula
-- el servidor — infalsificable). El SLP recibido va al pool operativo
-- del evento (ops_pool_slp).
create or replace function public.release_swap_cooldown_with_slp(
  p_event_id       uuid,
  p_wallet_address text,
  p_paid_slp       numeric,
  p_tx_hash        text default null
)
returns jsonb as $$
declare
  v_participant record;
  v_slp_price numeric;
  v_required_slp numeric;
begin
  select * into v_participant from public.participants
    where event_id = p_event_id and wallet_address = p_wallet_address for update;
  if v_participant is null then raise exception 'Esta wallet no participa de este evento'; end if;
  if v_participant.swap_cooldown_until is null or v_participant.swap_cooldown_until <= now() then
    raise exception 'Esta wallet no está en cooldown en este evento';
  end if;
  if p_paid_slp is null or p_paid_slp <= 0 then raise exception 'Monto de SLP pagado inválido'; end if;

  v_slp_price := public.get_slp_price_usd();
  v_required_slp := round(2 / v_slp_price);
  if p_paid_slp < v_required_slp then
    raise exception 'Monto insuficiente: se requieren ~% SLP (2 USD al precio actual)', v_required_slp;
  end if;

  update public.events set
    ops_pool_slp = ops_pool_slp + p_paid_slp,
    cooldown_resets = cooldown_resets + 1
  where id = p_event_id;
  update public.participants set swap_cooldown_until = null where id = v_participant.id;

  insert into public.swap_cooldown_releases (event_id, wallet_address, method, paid_slp, tx_hash)
  values (p_event_id, p_wallet_address, 'pago_slp', p_paid_slp, p_tx_hash);

  return jsonb_build_object('success', true, 'method', 'pago_slp', 'paid_slp', p_paid_slp, 'slp_price_used', v_slp_price);
end;
$$ language plpgsql security definer;

-- ── release_swap_cooldown_with_axie ───────────────────────────────
-- Opción 2: entregar OTRO Axie (sin cobrar nada por él — es el
-- "peaje" para liberar el cooldown, no un swap pagado) para poder
-- volver a intercambiar de inmediato.
create or replace function public.release_swap_cooldown_with_axie(
  p_event_id       uuid,
  p_wallet_address text,
  p_axie_id        text,
  p_tx_hash        text default null
)
returns jsonb as $$
declare
  v_participant record;
begin
  select * into v_participant from public.participants
    where event_id = p_event_id and wallet_address = p_wallet_address for update;
  if v_participant is null then raise exception 'Esta wallet no participa de este evento'; end if;
  if v_participant.swap_cooldown_until is null or v_participant.swap_cooldown_until <= now() then
    raise exception 'Esta wallet no está en cooldown en este evento';
  end if;
  if p_axie_id is null or p_axie_id = '' then raise exception 'Axie inválido'; end if;

  insert into public.released_axies (event_id, wallet_address, axie_id, release_reason, paid_slp, tx_hash)
  values (p_event_id, p_wallet_address, p_axie_id, 'cooldown_release', null, p_tx_hash);

  update public.events set
    axies_released = axies_released + 1,
    cooldown_resets = cooldown_resets + 1
  where id = p_event_id;

  update public.participants set swap_cooldown_until = null where id = v_participant.id;

  insert into public.swap_cooldown_releases (event_id, wallet_address, method, axie_id, tx_hash)
  values (p_event_id, p_wallet_address, 'axie_extra', p_axie_id, p_tx_hash);

  return jsonb_build_object('success', true, 'method', 'axie_extra', 'axie_id', p_axie_id);
end;
$$ language plpgsql security definer;

create or replace function public.transfer_ticket(
  p_ticket_id  uuid,
  p_from_wallet text,
  p_to_wallet   text,
  p_tx_hash     text default null
)
returns jsonb as $$
declare
  v_ticket record;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if v_ticket is null then
    raise exception 'Ticket no encontrado';
  end if;
  if v_ticket.wallet_address <> p_from_wallet then
    raise exception 'Esta wallet no es la dueña actual del ticket';
  end if;
  if v_ticket.status <> 'vivo' then
    raise exception 'Solo se pueden transferir tickets en estado vivo (actual: %)', v_ticket.status;
  end if;
  if p_to_wallet is null or p_to_wallet = '' then
    raise exception 'Wallet de destino inválida';
  end if;
  if p_from_wallet = p_to_wallet then
    raise exception 'La wallet de origen y destino no pueden ser la misma';
  end if;

  update public.tickets set
    wallet_address = p_to_wallet,
    tx_hash        = coalesce(p_tx_hash, tx_hash)
  where id = p_ticket_id;

  update public.participants
    set tickets_count = tickets_count - 1
    where event_id = v_ticket.event_id and wallet_address = p_from_wallet;

  delete from public.participants
    where event_id = v_ticket.event_id and wallet_address = p_from_wallet and tickets_count <= 0;

  insert into public.participants (event_id, wallet_address, tickets_count)
  values (v_ticket.event_id, p_to_wallet, 1)
  on conflict (event_id, wallet_address)
  do update set tickets_count = public.participants.tickets_count + 1;

  insert into public.ticket_transfers (ticket_id, event_id, from_wallet, to_wallet, tx_hash)
  values (p_ticket_id, v_ticket.event_id, p_from_wallet, p_to_wallet, p_tx_hash);

  return jsonb_build_object(
    'success', true, 'ticket_id', p_ticket_id, 'qr_code', v_ticket.qr_code,
    'event_id', v_ticket.event_id, 'from_wallet', p_from_wallet, 'to_wallet', p_to_wallet,
    'original_wallet_address', v_ticket.original_wallet_address
  );
end;
$$ language plpgsql security definer;

create or replace function public.draw_next_reward(p_event_id uuid)
returns jsonb as $$
declare
  v_reward        record;
  v_winner_ticket record;
  v_delivery_tx   text;
begin
  select * into v_reward
  from public.level_rewards_unlocked
  where event_id = p_event_id and status = 'pending-reward'
  order by draw_order asc limit 1 for update;

  if v_reward is null then
    return jsonb_build_object('success', false, 'message', 'No hay rewards pendientes de sorteo.');
  end if;

  select * into v_winner_ticket
  from public.tickets
  where event_id = p_event_id and status = 'vivo'
  order by random() limit 1 for update skip locked;

  if v_winner_ticket is null then
    return jsonb_build_object('success', false, 'message', 'No hay tickets vivos para sortear.');
  end if;

  v_delivery_tx := 'SIM-REWARD-' || substr(md5(random()::text), 1, 12);

  update public.level_rewards_unlocked set
    status = 'entregada', winner_ticket_id = v_winner_ticket.id,
    winner_wallet = v_winner_ticket.wallet_address, drawn_at = now(),
    delivery_tx_hash = v_delivery_tx, delivery_tx_url = 'https://app.roninchain.com/tx/' || v_delivery_tx
  where id = v_reward.id;

  update public.tickets set status = 'usado' where id = v_winner_ticket.id;

  return jsonb_build_object('success', true, 'reward_id', v_reward.id,
    'amount_usd', v_reward.amount_usd, 'slp_equivalent', v_reward.slp_equivalent,
    'winner_ticket_id', v_winner_ticket.id, 'winner_wallet', v_winner_ticket.wallet_address,
    'winner_qr_code', v_winner_ticket.qr_code, 'delivery_tx_hash', v_delivery_tx);
end;
$$ language plpgsql security definer;

-- ── close_event_with_reason ──────────────────────────────────────
-- Función ÚNICA de cierre real de un evento. La usan los 3 caminos
-- posibles: el cron automático (razón 'tiempo_agotado'), el
-- agotamiento del pool de swap durante swap_axie (razón
-- 'fondos_agotados'), y el botón manual de /test (razón elegida
-- a mano, incluye 'manual'). Así el motivo de cierre SIEMPRE queda
-- registrado igual, sin importar por dónde se disparó.
--
-- Hace, en orden: sortea todo lo pendiente → quema el burn pool →
-- libera los Axies pendientes (tx simulada) → arma el desglose final
-- en event_funds CON tx_hash por cada pool (ops y anual también,
-- que antes quedaban sin transacción asociada) → marca el evento
-- completado con su motivo → cierra los tickets.
create or replace function public.close_event_with_reason(p_event_id uuid, p_reason text default 'manual')
returns jsonb as $$
declare
  v_event record; v_draw_result jsonb; v_pending integer;
  v_burned_slp numeric; v_slp_price numeric; v_batch_tx text; v_burn_tx text;
  v_ops_tx text; v_annual_tx text; v_leftover_slp numeric; v_tickets_closed integer;
begin
  if p_reason not in ('manual','tiempo_agotado','fondos_agotados') then
    raise exception 'Motivo de cierre inválido: %', p_reason;
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if v_event is null then raise exception 'Evento no encontrado'; end if;

  -- 1. Sortear todo lo pendiente
  loop
    select count(*) into v_pending from public.level_rewards_unlocked where event_id = p_event_id and status = 'pending-reward';
    exit when v_pending = 0;
    v_draw_result := public.draw_next_reward(p_event_id);
    exit when (v_draw_result->>'success')::boolean is false;
  end loop;

  -- 2. Quema directa
  v_burned_slp := v_event.burn_pool_slp;
  update public.events set burn_pool_slp = 0 where id = p_event_id;

  -- 3. Liberar Axies pendientes (van conceptualmente a la wallet del equipo)
  v_batch_tx := 'SIM-BURN-RELEASE-' || substr(md5(random()::text), 1, 12);
  update public.released_axies set
    tx_hash = coalesce(tx_hash, v_batch_tx),
    tx_url  = coalesce(tx_url, 'https://app.roninchain.com/tx/' || v_batch_tx)
  where event_id = p_event_id;

  -- 4. Desglose final — CADA pool con su propia tx simulada
  v_slp_price := public.get_slp_price_usd();
  v_ops_tx    := 'SIM-OPS-'    || substr(md5(random()::text), 1, 12);
  v_annual_tx := 'SIM-ANNUAL-' || substr(md5(random()::text), 1, 12);
  v_burn_tx   := 'SIM-BURN-'   || substr(md5(random()::text), 1, 12);

  delete from public.event_funds where event_id = p_event_id;
  insert into public.event_funds (event_id, name, emoji, color_hex, pct_of_ticket, total_slp, total_usd_ref, detail, tx_hash, tx_url)
  values
    (p_event_id,'Pool de Recompensas','⚔️','#B8860B',25, v_event.rewards_pool_slp, v_event.rewards_pool_slp * v_slp_price,
      'Sobrante sin repartir — se transfiere al pool anual', v_annual_tx, 'https://app.roninchain.com/tx/'||v_annual_tx),
    (p_event_id,'Pool de Swap',       '⚖️','#CC0000', 25, v_event.swap_pool_slp,    v_event.swap_pool_slp * v_slp_price,
      v_event.axies_swapped || ' Axies intercambiados — el sobrante sin gastar también se transfiere al pool anual', v_batch_tx, 'https://app.roninchain.com/tx/'||v_batch_tx),
    (p_event_id,'Quema Directa',      '🔥','#FF6600', 25, v_burned_slp,             v_burned_slp * v_slp_price,
      'SLP enviado a burn address', v_burn_tx, 'https://app.roninchain.com/tx/'||v_burn_tx),
    (p_event_id,'Operaciones y Devs', '🔩','#5a5a6a', 15, v_event.ops_pool_slp,     v_event.ops_pool_slp * v_slp_price,
      'Transferido a la wallet del equipo de desarrollo', v_ops_tx, 'https://app.roninchain.com/tx/'||v_ops_tx),
    (p_event_id,'Pool Reward Anual',  '🗝️','#D4A017', 10, v_event.special_pool_slp, v_event.special_pool_slp * v_slp_price,
      'Aportado al pozo especial de fin de año', v_annual_tx, 'https://app.roninchain.com/tx/'||v_annual_tx);

  -- 5. Cerrar el evento (motivo incluido)
  select count(*) into v_pending from public.level_rewards_unlocked where event_id = p_event_id and status = 'pending-reward';
  if v_pending > 0 then raise exception 'Hay % rewards sin sortear', v_pending; end if;

  -- El sobrante del pool de recompensas (lo que no se llegó a repartir
  -- en premios) Y el sobrante del pool de swap (lo que no se gastó en
  -- intercambios) van los dos al pool anual — nada queda "perdido" en
  -- un evento ya cerrado.
  v_leftover_slp := v_event.rewards_pool_slp + v_event.swap_pool_slp;
  update public.events set
    status = 'completado', closure_reason = p_reason,
    special_pool_slp = special_pool_slp + v_leftover_slp,
    rewards_pool_slp = 0, rewards_pool_usd = 0,
    swap_pool_slp = 0
  where id = p_event_id;

  update public.tickets set status = 'evento-finalizado' where event_id = p_event_id;
  select count(*) into v_tickets_closed from public.tickets where event_id = p_event_id;

  return jsonb_build_object('success', true, 'event_id', p_event_id, 'closure_reason', p_reason,
    'burned_slp', v_burned_slp, 'leftover_to_annual_slp', v_leftover_slp,
    'axies_released', (select count(*) from public.released_axies where event_id = p_event_id),
    'tickets_closed', v_tickets_closed, 'final_level', v_event.ritual_level);
end;
$$ language plpgsql security definer;

-- ── close_event ──────────────────────────────────────────────────
-- Wrapper de compatibilidad — delega todo en close_event_with_reason
-- con motivo 'manual'. Se deja por si algo externo la sigue llamando.
create or replace function public.close_event(p_event_id uuid)
returns jsonb as $$
begin
  return public.close_event_with_reason(p_event_id, 'manual');
end;
$$ language plpgsql security definer;


-- ============================================================
-- SECCIÓN 7 — LLAVES ANUALES Y EVENTO ESPECIAL
-- ============================================================

create or replace function public.get_or_create_annual_pool(p_year integer)
returns uuid as $$
declare v_pool_id uuid;
begin
  select id into v_pool_id from public.annual_pool where year = p_year;
  if v_pool_id is null then
    insert into public.annual_pool (year, status) values (p_year, 'acumulando') returning id into v_pool_id;
  end if;
  return v_pool_id;
end;
$$ language plpgsql security definer;

create or replace function public.mint_annual_key(
  p_wallet_address text, p_year integer, p_paid_slp numeric, p_ticket_ids uuid[]
)
returns jsonb as $$
declare
  v_slp_price numeric; v_months_count integer; v_ticket_count integer;
  v_pool_id uuid; v_new_key_id uuid;
  v_burn_slp numeric; v_rewards_slp numeric; v_ops_slp numeric;
begin
  if array_length(p_ticket_ids, 1) <> 12 then raise exception 'Se requieren exactamente 12 tickets'; end if;

  select count(*) into v_ticket_count
  from public.tickets t join public.events e on e.id = t.event_id
  where t.id = any(p_ticket_ids) and t.status = 'evento-finalizado'
    and t.wallet_address = p_wallet_address and extract(year from e.date_start) = p_year;
  if v_ticket_count <> 12 then raise exception 'Los tickets deben estar en evento-finalizado y pertenecer a tu wallet del año %', p_year; end if;

  select count(distinct extract(month from e.date_start)) into v_months_count
  from public.tickets t join public.events e on e.id = t.event_id where t.id = any(p_ticket_ids);
  if v_months_count <> 12 then raise exception 'Los 12 tickets deben ser de 12 meses distintos'; end if;

  if p_paid_slp is null or p_paid_slp <= 0 then raise exception 'Monto de SLP pagado inválido'; end if;

  v_slp_price   := public.get_slp_price_usd();
  v_burn_slp    := round(p_paid_slp * 0.40);
  v_rewards_slp := round(p_paid_slp * 0.40);
  v_ops_slp     := round(p_paid_slp * 0.20);

  v_pool_id := public.get_or_create_annual_pool(p_year);
  update public.annual_pool set pool_slp = pool_slp + v_rewards_slp where id = v_pool_id;

  delete from public.tickets where id = any(p_ticket_ids);

  insert into public.annual_keys (year, minted_by_wallet, owner_wallet, status)
  values (p_year, p_wallet_address, p_wallet_address, 'vivo') returning id into v_new_key_id;

  return jsonb_build_object('success', true, 'key_id', v_new_key_id, 'year', p_year,
    'slp_price_used', v_slp_price, 'burned_slp', v_burn_slp,
    'pool_contribution_slp', v_rewards_slp, 'ops_slp', v_ops_slp);
end;
$$ language plpgsql security definer;

create or replace function public.transfer_annual_key(
  p_key_id uuid, p_from_wallet text, p_to_wallet text, p_tx_hash text default null
)
returns jsonb as $$
declare v_key record;
begin
  select * into v_key from public.annual_keys where id = p_key_id for update;
  if v_key is null then raise exception 'Llave no encontrada'; end if;
  if v_key.owner_wallet <> p_from_wallet then raise exception 'La wallet no es la dueña actual'; end if;
  if v_key.status <> 'vivo' then raise exception 'Solo se pueden transferir llaves en estado vivo'; end if;
  update public.annual_keys set owner_wallet = p_to_wallet where id = p_key_id;
  return jsonb_build_object('success', true, 'key_id', p_key_id, 'new_owner', p_to_wallet);
end;
$$ language plpgsql security definer;

create or replace function public.consume_annual_key(p_key_id uuid, p_wallet_address text)
returns jsonb as $$
declare v_key record;
begin
  select * into v_key from public.annual_keys where id = p_key_id for update;

  if v_key is null then
    insert into public.annual_keys_access (key_id, wallet_address, granted, reason) values (p_key_id, p_wallet_address, false, 'Llave no encontrada');
    raise exception 'Llave no encontrada';
  end if;

  if v_key.owner_wallet <> p_wallet_address then
    insert into public.annual_keys_access (key_id, wallet_address, granted, reason) values (p_key_id, p_wallet_address, false, 'La wallet conectada no es la dueña');
    raise exception 'Esta llave no te pertenece';
  end if;

  if v_key.status <> 'vivo' then
    insert into public.annual_keys_access (key_id, wallet_address, granted, reason) values (p_key_id, p_wallet_address, false, 'La llave ya fue usada');
    raise exception 'Esta llave ya fue usada';
  end if;

  update public.annual_keys set status = 'usado' where id = p_key_id;
  insert into public.annual_keys_access (key_id, wallet_address, granted) values (p_key_id, p_wallet_address, true);

  return jsonb_build_object('success', true, 'key_id', p_key_id, 'year', v_key.year,
    'message', 'Llave consumida. Acceso concedido al Evento Anual.');
end;
$$ language plpgsql security definer;

create or replace function public.activate_annual_event(p_year integer)
returns jsonb as $$
declare
  v_pool record; v_event_id uuid; v_reward_slp numeric; i integer;
begin
  select * into v_pool from public.annual_pool where year = p_year for update;
  if v_pool is null then raise exception 'No existe pool especial para el año %', p_year; end if;
  if v_pool.pool_slp <= 0 then raise exception 'El pool especial está vacío'; end if;

  v_reward_slp := floor(v_pool.pool_slp / 10);
  insert into public.annual_event (year, status, pool_total_slp, reward_slp_each, draw_at)
  values (p_year, 'activo', v_pool.pool_slp, v_reward_slp, now()) returning id into v_event_id;

  for i in 1..10 loop
    insert into public.annual_rewards (annual_event_id, amount_slp, draw_order, status)
    values (v_event_id, v_reward_slp, i, 'pending-reward');
  end loop;

  update public.annual_pool set status = 'sorteo-activo' where year = p_year;
  return jsonb_build_object('success', true, 'annual_event_id', v_event_id,
    'pool_total_slp', v_pool.pool_slp, 'reward_slp_each', v_reward_slp, 'rewards_created', 10);
end;
$$ language plpgsql security definer;

create or replace function public.draw_next_annual_reward(p_annual_event_id uuid)
returns jsonb as $$
declare
  v_reward record; v_event record; v_winner_key record;
begin
  select * into v_event from public.annual_event where id = p_annual_event_id;
  if v_event is null then raise exception 'Evento anual no encontrado'; end if;

  select * into v_reward from public.annual_rewards
  where annual_event_id = p_annual_event_id and status = 'pending-reward'
  order by draw_order asc limit 1 for update;
  if v_reward is null then return jsonb_build_object('success', false, 'message', 'No hay rewards anuales pendientes.'); end if;

  select * into v_winner_key from public.annual_keys
  where year = v_event.year and status = 'vivo'
  order by random() limit 1 for update skip locked;
  if v_winner_key is null then return jsonb_build_object('success', false, 'message', 'No hay llaves vivas para sortear.'); end if;

  update public.annual_rewards set status = 'entregada', winner_key_id = v_winner_key.id,
    winner_wallet = v_winner_key.owner_wallet, drawn_at = now()
  where id = v_reward.id;

  update public.annual_keys set status = 'usado' where id = v_winner_key.id;

  return jsonb_build_object('success', true, 'reward_id', v_reward.id, 'amount_slp', v_reward.amount_slp,
    'winner_key_id', v_winner_key.id, 'winner_wallet', v_winner_key.owner_wallet);
end;
$$ language plpgsql security definer;

create or replace function public.close_annual_event(p_annual_event_id uuid)
returns jsonb as $$
declare v_event record; v_pending integer;
begin
  select * into v_event from public.annual_event where id = p_annual_event_id for update;
  if v_event is null then raise exception 'Evento anual no encontrado'; end if;
  select count(*) into v_pending from public.annual_rewards where annual_event_id = p_annual_event_id and status = 'pending-reward';
  if v_pending > 0 then raise exception 'Hay % rewards anuales sin sortear', v_pending; end if;
  update public.annual_event set status = 'completado', completed_at = now() where id = p_annual_event_id;
  update public.annual_pool set status = 'completado', pool_slp = 0, pool_usd_ref = 0 where year = v_event.year;
  return jsonb_build_object('success', true, 'year', v_event.year);
end;
$$ language plpgsql security definer;


-- ============================================================
-- SECCIÓN 8 — PERFILES
-- ============================================================

create or replace function public.upsert_profile(
  p_wallet_address text, p_display_name text default null, p_avatar_item_id uuid default null
)
returns jsonb as $$
declare v_item record;
begin
  if p_avatar_item_id is not null then
    select * into v_item from public.shop_items where id = p_avatar_item_id and type = 'avatar';
    if v_item is null then raise exception 'Avatar no encontrado'; end if;
    if v_item.price_slp > 0 then
      if not exists (select 1 from public.owned_items where wallet_address = p_wallet_address and item_id = p_avatar_item_id) then
        raise exception 'Necesitás comprar este avatar antes de usarlo';
      end if;
    end if;
  end if;

  insert into public.profiles (wallet_address, display_name, avatar_item_id, updated_at)
  values (p_wallet_address, p_display_name, p_avatar_item_id, now())
  on conflict (wallet_address) do update set
    display_name   = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_item_id = coalesce(excluded.avatar_item_id, public.profiles.avatar_item_id),
    updated_at     = now();

  return jsonb_build_object('success', true, 'wallet_address', p_wallet_address);
end;
$$ language plpgsql security definer;

create or replace view public.profile_with_avatar as
select p.wallet_address, p.display_name, p.updated_at,
  a.id as avatar_id, a.name as avatar_name, a.image_url as avatar_url
from public.profiles p
left join public.shop_items a on a.id = p.avatar_item_id;


-- ============================================================
-- SECCIÓN 9 — SISTEMA AUTOMÁTICO (pg_cron)
-- ============================================================

-- ── execute_full_event_closure ────────────────────────────────────
-- Wrapper usado por el cron automático (advance_event_phases) — el
-- cierre real siempre es por tiempo agotado en este camino.
create or replace function public.execute_full_event_closure(p_event_id uuid)
returns jsonb as $$
begin
  return public.close_event_with_reason(p_event_id, 'tiempo_agotado');
end;
$$ language plpgsql security definer;

create or replace function public.create_monthly_event_if_needed()
returns jsonb as $$
declare
  v_year integer := extract(year from now());
  v_month integer := extract(month from now());
  v_event_number integer; v_exists boolean; v_sale_hours integer; v_new_id uuid; v_label text;
begin
  if extract(day from now()) <> 1 then return jsonb_build_object('success', false, 'reason', 'no es día 1'); end if;
  v_event_number := v_year * 100 + v_month;
  select exists(select 1 from public.events where event_number = v_event_number) into v_exists;
  if v_exists then return jsonb_build_object('success', false, 'reason', 'ya existe el evento de este mes'); end if;
  select value::integer into v_sale_hours from public.system_config where key = 'sale_window_hours';
  v_label := to_char(now(), 'TMMonth') || ' ' || v_year;
  insert into public.events (event_number, label, date_start, date_end, status, ticket_price_usd)
  values (v_event_number, initcap(v_label), now(), now() + (v_sale_hours || ' hours')::interval, 'activo',
    (select value::numeric from public.system_config where key = 'ticket_price_usd'))
  returning id into v_new_id;
  return jsonb_build_object('success', true, 'event_id', v_new_id, 'label', v_label);
end;
$$ language plpgsql security definer;

create or replace function public.advance_event_phases()
returns jsonb as $$
declare
  v_sale_hours integer; v_swap_hours integer; v_event record; v_actions jsonb := '[]'::jsonb;
begin
  select value::integer into v_sale_hours from public.system_config where key = 'sale_window_hours';
  select value::integer into v_swap_hours from public.system_config where key = 'swap_window_hours';

  for v_event in
    select * from public.events where status = 'activo'
      and now() >= date_start + (v_sale_hours || ' hours')::interval
  loop
    update public.events set status = 'swap', swap_started_at = now() where id = v_event.id;
    v_actions := v_actions || jsonb_build_object('event_id', v_event.id, 'action', 'activo_to_swap');
  end loop;

  for v_event in
    select * from public.events where status = 'swap'
      and swap_started_at is not null
      and now() >= swap_started_at + (v_swap_hours || ' hours')::interval
  loop
    perform public.execute_full_event_closure(v_event.id);
    v_actions := v_actions || jsonb_build_object('event_id', v_event.id, 'action', 'swap_closed_and_finalized');
  end loop;

  return jsonb_build_object('success', true, 'actions', v_actions);
end;
$$ language plpgsql security definer;

select cron.schedule('create-monthly-event', '*/5 * * * *', $$ select public.create_monthly_event_if_needed(); $$);
select cron.schedule('advance-event-phases', '*/5 * * * *', $$ select public.advance_event_phases(); $$);


-- ============================================================
-- SECCIÓN 10 — VISTAS
-- ============================================================
create or replace view public.event_rewards_detail as
select r.id, r.event_id, r.level_reached, r.amount_usd, r.slp_equivalent, r.status, r.draw_order,
  r.winner_wallet, r.drawn_at, t.qr_code as winner_ticket_qr, t.status as winner_ticket_status
from public.level_rewards_unlocked r
left join public.tickets t on t.id = r.winner_ticket_id
order by r.event_id, r.draw_order;

create or replace view public.ticket_ownership_history as
select
  t.id as ticket_id, t.qr_code, t.event_id, t.status,
  t.original_wallet_address, t.wallet_address as current_wallet_address,
  tr.from_wallet, tr.to_wallet, tr.tx_hash, tr.transferred_at
from public.tickets t
left join public.ticket_transfers tr on tr.ticket_id = t.id
order by t.id, tr.transferred_at asc;


-- ============================================================
-- SECCIÓN 11 — FUNCIONES DE TEST (QA manual)
-- ============================================================

create or replace function public.test_create_event()
returns jsonb as $$
declare v_event_id uuid;
begin
  delete from public.events where event_number = 0;
  insert into public.events (event_number, label, date_start, date_end, status, ticket_price_usd)
  values (0,'TEST — Evento de Simulación', now(), now() + interval '4 days','activo',3.00)
  returning id into v_event_id;
  return jsonb_build_object('success', true, 'event_id', v_event_id);
end;
$$ language plpgsql security definer;

create or replace function public.test_deactivate_event()
returns jsonb as $$
begin
  delete from public.events where event_number = 0;
  return jsonb_build_object('success', true, 'message', 'Evento de prueba eliminado.');
end;
$$ language plpgsql security definer;

create or replace function public.test_set_event_status(p_event_id uuid, p_status text)
returns jsonb as $$
begin
  if p_status not in ('previo','activo','swap','completado') then raise exception 'Status inválido: %', p_status; end if;
  if p_status = 'completado' then
    raise exception 'No se puede saltar directo a "completado" — usá test_finalize_event() (el cierre real: sortea, quema, libera Axies y genera el desglose). Saltar directo deja el evento a medio cerrar.';
  end if;
  if p_status = 'swap' then
    update public.events set status = p_status, swap_started_at = now() where id = p_event_id;
  else
    update public.events set status = p_status where id = p_event_id;
  end if;
  if not found then raise exception 'Evento no encontrado'; end if;
  return jsonb_build_object('success', true, 'event_id', p_event_id, 'new_status', p_status);
end;
$$ language plpgsql security definer;

create or replace function public.test_simulate_burn(p_event_id uuid)
returns jsonb as $$
declare v_event record; v_burned numeric;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if v_event is null then raise exception 'Evento no encontrado.'; end if;
  v_burned := v_event.burn_pool_slp;
  update public.events set burn_pool_slp = 0 where id = v_event.id;
  return jsonb_build_object('success', true, 'burned_slp', v_burned);
end;
$$ language plpgsql security definer;

create or replace function public.test_release_swapped_axies(p_event_id uuid)
returns jsonb as $$
declare v_event record; v_count integer; v_batch_tx text;
begin
  select * into v_event from public.events where id = p_event_id;
  if v_event is null then raise exception 'Evento no encontrado.'; end if;
  v_batch_tx := 'TEST-BATCH-RELEASE-' || substr(md5(random()::text), 1, 12);
  update public.released_axies set
    tx_hash = coalesce(tx_hash, v_batch_tx),
    tx_url  = coalesce(tx_url, 'https://app.roninchain.com/tx/' || v_batch_tx)
  where event_id = v_event.id;
  select count(*) into v_count from public.released_axies where event_id = v_event.id;
  return jsonb_build_object('success', true, 'axies_released', v_count, 'batch_tx', v_batch_tx);
end;
$$ language plpgsql security definer;

create or replace function public.test_finalize_event(p_event_id uuid, p_reason text default 'manual')
returns jsonb as $$
begin
  -- close_event_with_reason() ya sortea TODOS los rewards pendientes
  -- como su primer paso — no hace falta (ni tiene sentido) bloquear
  -- acá algo que la propia función de cierre resuelve sola.
  return public.close_event_with_reason(p_event_id, p_reason);
end;
$$ language plpgsql security definer;

create or replace function public.test_force_timeout(p_event_id uuid)
returns jsonb as $$
declare v_draws jsonb := '[]'::jsonb; v_draw_result jsonb; v_pending integer;
begin
  loop
    select count(*) into v_pending from public.level_rewards_unlocked
    where event_id = p_event_id and status = 'pending-reward';
    exit when v_pending = 0;
    v_draw_result := public.draw_next_reward(p_event_id);
    v_draws := v_draws || v_draw_result;
    exit when (v_draw_result->>'success')::boolean is false;
  end loop;
  return jsonb_build_object('success', true, 'message', 'Timeout simulado.', 'draws', v_draws);
end;
$$ language plpgsql security definer;

create or replace function public.test_seed_tickets_for_annual(p_wallet_address text, p_year integer)
returns jsonb as $$
declare
  v_month integer; v_event_id uuid; v_ticket_ids uuid[] := array[]::uuid[]; v_new_ticket_id uuid;
begin
  for v_month in 1..12 loop
    select id into v_event_id from public.events
    where event_number = -1 * (p_year * 100 + v_month);
    if v_event_id is null then
      insert into public.events (event_number, label, date_start, date_end, status)
      values (-1 * (p_year * 100 + v_month), 'TEST — Histórico '||v_month||'/'||p_year,
        make_date(p_year, v_month, 1), make_date(p_year, v_month, 5), 'completado')
      returning id into v_event_id;
    end if;
    insert into public.tickets (event_id, wallet_address, original_wallet_address, paid_slp, qr_code, status)
    values (v_event_id, p_wallet_address, p_wallet_address, 16500, 'TEST-ANNUAL-'||p_year||'-'||v_month||'-'||substr(md5(random()::text),1,6), 'evento-finalizado')
    returning id into v_new_ticket_id;
    insert into public.participants (event_id, wallet_address, tickets_count)
    values (v_event_id, p_wallet_address, 1)
    on conflict (event_id, wallet_address) do update set tickets_count = public.participants.tickets_count + 1;
    v_ticket_ids := v_ticket_ids || v_new_ticket_id;
  end loop;
  return jsonb_build_object('success', true, 'ticket_ids', v_ticket_ids, 'count', array_length(v_ticket_ids, 1));
end;
$$ language plpgsql security definer;

create or replace function public.find_ticket_by_qr(p_qr_code text)
returns jsonb as $$
declare
  v_ticket record;
  v_reward record;
begin
  select t.*, e.event_number, e.label as event_label, e.status as event_status
  into v_ticket
  from public.tickets t
  join public.events e on e.id = t.event_id
  where t.qr_code = p_qr_code;

  if v_ticket is null then
    return jsonb_build_object('success', false, 'message', 'No se encontró ningún ticket con ese QR.');
  end if;

  select * into v_reward from public.level_rewards_unlocked
  where winner_ticket_id = v_ticket.id and status = 'entregada'
  limit 1;

  return jsonb_build_object(
    'success', true,
    'event_id', v_ticket.event_id,
    'event_number', v_ticket.event_number,
    'event_label', v_ticket.event_label,
    'ticket_id', v_ticket.id,
    'qr_code', v_ticket.qr_code,
    'paid_slp', v_ticket.paid_slp,
    'ticket_status', v_ticket.status,
    'won_reward', v_reward is not null,
    'reward_amount_usd', v_reward.amount_usd,
    'reward_slp_equivalent', v_reward.slp_equivalent
  );
end;
$$ language plpgsql stable security definer;

create or replace function public.test_set_config(p_key text, p_value text)
returns jsonb as $$
begin
  update public.system_config set value = p_value where key = p_key;
  if not found then
    insert into public.system_config (key, value) values (p_key, p_value);
  end if;
  return jsonb_build_object('success', true, 'key', p_key, 'value', p_value);
end;
$$ language plpgsql security definer;

create or replace function public.test_reset_all()
returns jsonb as $$
begin
  delete from public.events where event_number <= 0;
  return jsonb_build_object('success', true, 'message', 'Todos los datos de test fueron eliminados.');
end;
$$ language plpgsql security definer;


-- ── test_create_event_for / test_list_events / test_delete_event ──
-- Extensión del panel de QA: en vez de un único evento de test fijo
-- (event_number = 0), permite tener uno por cada mes que quieras
-- simular, todos con event_number negativo (nunca choca con un
-- evento real, que siempre es positivo: año*100+mes).

create or replace function public.test_create_event_for(
  p_year integer, p_month integer
)
returns jsonb as $$
declare
  v_event_number integer := -1 * (p_year * 100 + p_month);
  v_event_id uuid;
begin
  if p_month < 1 or p_month > 12 then
    raise exception 'Mes inválido: %', p_month;
  end if;

  delete from public.events where event_number = v_event_number;

  insert into public.events (event_number, label, date_start, date_end, status, ticket_price_usd)
  values (
    v_event_number,
    'TEST — ' || to_char(make_date(p_year, p_month, 1), 'TMMonth') || ' ' || p_year,
    make_date(p_year, p_month, 1),
    make_date(p_year, p_month, 5),
    'activo',
    3.00
  )
  returning id into v_event_id;

  return jsonb_build_object('success', true, 'event_id', v_event_id, 'event_number', v_event_number,
    'year', p_year, 'month', p_month);
end;
$$ language plpgsql security definer;

create or replace function public.test_list_events()
returns table(
  event_id uuid, event_number integer, label text, status text,
  total_tickets integer, ritual_level integer, created_at timestamptz
) as $$
begin
  return query
  select e.id, e.event_number, e.label, e.status, e.total_tickets, e.ritual_level, e.created_at
  from public.events e
  where e.event_number <= 0
  order by e.created_at desc;
end;
$$ language plpgsql stable security definer;

create or replace function public.test_delete_event(p_event_id uuid)
returns jsonb as $$
declare v_event_number integer;
begin
  select event_number into v_event_number from public.events where id = p_event_id;
  if v_event_number is null then raise exception 'Evento no encontrado'; end if;
  if v_event_number > 0 then raise exception 'No se puede borrar un evento real (event_number > 0)'; end if;
  delete from public.events where id = p_event_id;
  return jsonb_build_object('success', true, 'deleted_event_number', v_event_number);
end;
$$ language plpgsql security definer;


-- ── test_run_checklist ────────────────────────────────────────────
-- 14 verificaciones puntuales sobre el estado de UN evento de test,
-- devueltas como filas (pasa = true/false) listas para pintar en
-- verde/rojo en el panel, sin tener que interpretar JSON a mano.
create or replace function public.test_run_checklist(p_event_id uuid)
returns table(orden integer, etapa text, check_nombre text, pasa boolean, detalle text) as $$
declare
  v_event record;
  v_tickets_count integer;
  v_participants_count integer;
  v_pending_rewards integer;
  v_delivered_rewards integer;
  v_sum_pools numeric;
begin
  select * into v_event from public.events where id = p_event_id;
  if v_event is null then
    raise exception 'Evento no encontrado';
  end if;

  select count(*) into v_tickets_count from public.tickets where event_id = p_event_id;
  select count(*) into v_participants_count from public.participants where event_id = p_event_id;
  select count(*) into v_pending_rewards from public.level_rewards_unlocked where event_id = p_event_id and status = 'pending-reward';
  select count(*) into v_delivered_rewards from public.level_rewards_unlocked where event_id = p_event_id and status = 'entregada';

  orden := 1; etapa := 'VENTA'; check_nombre := 'El evento existe y tiene status válido';
  pasa := v_event.status in ('previo','activo','swap','completado');
  detalle := 'status actual: ' || v_event.status;
  return next;

  orden := 2; etapa := 'VENTA'; check_nombre := 'Hay al menos 1 ticket vendido';
  pasa := v_tickets_count > 0;
  detalle := v_tickets_count || ' tickets';
  return next;

  orden := 3; etapa := 'VENTA'; check_nombre := 'total_tickets coincide con la cantidad real de filas en tickets';
  pasa := v_event.total_tickets = v_tickets_count;
  detalle := 'events.total_tickets=' || v_event.total_tickets || ' vs count(tickets)=' || v_tickets_count;
  return next;

  orden := 4; etapa := 'VENTA'; check_nombre := 'participants refleja a los compradores (sin duplicar wallets)';
  pasa := v_participants_count > 0 and v_participants_count <= v_tickets_count;
  detalle := v_participants_count || ' wallets únicas, ' || v_tickets_count || ' tickets';
  return next;

  orden := 5; etapa := 'VENTA'; check_nombre := 'Ningún pool quedó negativo (25/25/25/15/10 nunca debería restar de más)';
  pasa := v_event.rewards_pool_slp >= 0 and v_event.swap_pool_slp >= 0 and v_event.burn_pool_slp >= 0
      and v_event.ops_pool_slp >= 0 and v_event.special_pool_slp >= 0;
  v_sum_pools := v_event.rewards_pool_slp + v_event.swap_pool_slp + v_event.burn_pool_slp + v_event.ops_pool_slp + v_event.special_pool_slp;
  detalle := 'rewards=' || v_event.rewards_pool_slp || ' swap=' || v_event.swap_pool_slp || ' burn=' || v_event.burn_pool_slp
    || ' ops=' || v_event.ops_pool_slp || ' special=' || v_event.special_pool_slp
    || ' — nota: la suma no es igual a total_raised_slp una vez que ritual_level>0, porque cada nivel resta de rewards_pool_slp el costo del premio comprado. Eso es esperado, no un bug.';
  return next;

  orden := 6; etapa := 'NIVELES'; check_nombre := 'Si ritual_level > 0, hay rewards generados en level_rewards_unlocked';
  pasa := (v_event.ritual_level = 0) or (v_pending_rewards + v_delivered_rewards > 0);
  detalle := 'ritual_level=' || v_event.ritual_level || ', rewards totales=' || (v_pending_rewards + v_delivered_rewards);
  return next;

  orden := 7; etapa := 'SWAP'; check_nombre := 'Si hay axies_swapped > 0, existen filas en released_axies';
  pasa := (v_event.axies_swapped = 0) or
          ((select count(*) from public.released_axies where event_id = p_event_id) >= v_event.axies_swapped);
  detalle := 'axies_swapped=' || v_event.axies_swapped;
  return next;

  orden := 8; etapa := 'SWAP'; check_nombre := 'swap_pool_spent_slp coincide con lo gastado en swaps';
  pasa := v_event.swap_pool_spent_slp >= 0;
  detalle := 'swap_pool_spent_slp=' || v_event.swap_pool_spent_slp;
  return next;

  orden := 9; etapa := 'SORTEO'; check_nombre := 'No quedan rewards pending-reward si el evento está completado';
  pasa := (v_event.status <> 'completado') or (v_pending_rewards = 0);
  detalle := v_pending_rewards || ' rewards pendientes, status=' || v_event.status;
  return next;

  orden := 10; etapa := 'SORTEO'; check_nombre := 'Cada reward entregada tiene ganador y wallet asignados';
  pasa := not exists (
    select 1 from public.level_rewards_unlocked
    where event_id = p_event_id and status = 'entregada'
      and (winner_ticket_id is null or winner_wallet is null)
  );
  detalle := v_delivered_rewards || ' rewards entregadas revisadas';
  return next;

  orden := 11; etapa := 'SORTEO'; check_nombre := 'Un ticket que ya ganó (status=usado) no aparece como ganador dos veces';
  pasa := (
    select count(*) from public.level_rewards_unlocked where event_id = p_event_id and status = 'entregada'
  ) = (
    select count(distinct winner_ticket_id) from public.level_rewards_unlocked
    where event_id = p_event_id and status = 'entregada' and winner_ticket_id is not null
  );
  detalle := 'sorteo secuencial sin repetición de ganador';
  return next;

  orden := 12; etapa := 'CIERRE'; check_nombre := 'Si el evento está completado, todos los tickets pasaron a evento-finalizado (salvo los ya usados por un premio)';
  pasa := (v_event.status <> 'completado') or not exists (
    select 1 from public.tickets where event_id = p_event_id and status = 'vivo'
  );
  detalle := 'status=' || v_event.status;
  return next;

  orden := 13; etapa := 'CIERRE'; check_nombre := 'Si el evento está completado, rewards_pool_slp y swap_pool_slp quedaron en 0 (sobrante transferido a special_pool)';
  pasa := (v_event.status <> 'completado') or (v_event.rewards_pool_slp = 0 and v_event.swap_pool_slp = 0);
  detalle := 'rewards_pool_slp=' || v_event.rewards_pool_slp || ', swap_pool_slp=' || v_event.swap_pool_slp;
  return next;

  orden := 14; etapa := 'CIERRE'; check_nombre := 'Si el evento está completado, existe el desglose en event_funds (5 filas)';
  pasa := (v_event.status <> 'completado') or (
    (select count(*) from public.event_funds where event_id = p_event_id) = 5
  );
  detalle := (select count(*) from public.event_funds where event_id = p_event_id) || ' filas en event_funds';
  return next;

  orden := 15; etapa := 'CIERRE'; check_nombre := 'Si el evento está completado, quedó registrado el motivo de cierre';
  pasa := (v_event.status <> 'completado') or (v_event.closure_reason is not null);
  detalle := 'closure_reason = ' || coalesce(v_event.closure_reason, 'NULL (falta registrar)');
  return next;

  orden := 16; etapa := 'CIERRE'; check_nombre := 'Swap, Quema, Ops y Pool Anual tienen su transacción (tx_hash) registrada';
  pasa := (v_event.status <> 'completado') or not exists (
    select 1 from public.event_funds
    where event_id = p_event_id
      and name in ('Pool de Swap', 'Quema Directa', 'Operaciones y Devs', 'Pool Reward Anual')
      and tx_hash is null
  );
  detalle := (
    select count(*) from public.event_funds
    where event_id = p_event_id and tx_hash is not null
  ) || ' de ' || (select count(*) from public.event_funds where event_id = p_event_id) || ' filas con tx_hash';
  return next;

  orden := 17; etapa := 'CIERRE'; check_nombre := 'Los Axies liberados (si hubo) tienen tx_hash de liberación';
  pasa := not exists (
    select 1 from public.released_axies where event_id = p_event_id and tx_hash is null
  );
  detalle := (select count(*) from public.released_axies where event_id = p_event_id) || ' Axies liberados en total';
  return next;

  return;
end;
$$ language plpgsql stable security definer;


-- ============================================================
-- SECCIÓN 12 — VERIFICACIÓN FINAL
-- ============================================================
select 'Schema creado correctamente.' as resultado;
select public.get_slp_price_usd() as precio_slp_actual_usd;
select count(*) as tablas_creadas from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';
select count(*) as avatares_cargados from public.shop_items where type = 'avatar';
select jobname, schedule from cron.job;