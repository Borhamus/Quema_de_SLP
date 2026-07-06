-- ============================================================
-- seed_4_eventos_enero_a_abril.sql
-- QUEMA DE SLP — carga 4 eventos YA COMPLETADOS, para tener algo
-- que ver en Home (últimos 3) y en /ritual (historial) sin tener
-- que armar eventos de a uno desde /test.
--
-- Usa buy_tickets_bulk() (consulta el precio de SLP UNA vez por
-- evento, no por ticket) — por eso esto corre rápido incluso con
-- 1000 tickets en total, a diferencia de la primera vez que
-- probamos algo así.
--
-- Qué crea (todos en 2026, mes 1 a 4, status='completado'):
--   Enero   — 100 tickets, 10 Axies liberados
--   Febrero — 200 tickets, 20 Axies liberados
--   Marzo   — 300 tickets, 30 Axies liberados
--   Abril   — 400 tickets, 40 Axies liberados
--
-- ⚠️ Reemplazá 'PASTE_TU_WALLET_AQUI' por tu wallet conectada,
-- si no vas a ver las compras/QR bien asociados a vos en /profile.
-- ============================================================

do $$
declare
  v_wallet text := 'PASTE_TU_WALLET_AQUI';
  v_event_id uuid;
  v_plan jsonb := '[
    {"year":2026,"month":1,"tickets":100,"axies":10},
    {"year":2026,"month":2,"tickets":200,"axies":20},
    {"year":2026,"month":3,"tickets":300,"axies":30},
    {"year":2026,"month":4,"tickets":400,"axies":40}
  ]'::jsonb;
  v_item jsonb;
  v_year int; v_month int; v_qty int; v_axies int;
  v_floor_slp numeric := 150; -- SLP por Axie liberado (mismo default que usás en /test)
  v_paid_slp_per_ticket numeric := 16500; -- SLP por ticket (mismo default de siempre)
  i int;
  v_axie_id text;
  v_tx text;
begin
  for v_item in select * from jsonb_array_elements(v_plan) loop
    v_year := (v_item->>'year')::int;
    v_month := (v_item->>'month')::int;
    v_qty := (v_item->>'tickets')::int;
    v_axies := (v_item->>'axies')::int;

    -- 1. Crear el evento (queda en 'activo', número negativo automático)
    perform public.test_create_event_for(v_year, v_month);
    select id into v_event_id from public.events where event_number = -1 * (v_year * 100 + v_month);

    -- 2. Comprar todos los tickets de una — un solo precio consultado
    perform public.buy_tickets_bulk(
      v_event_id, v_wallet, v_qty, v_paid_slp_per_ticket,
      'SEED-TX-' || v_year || '-' || v_month
    );

    -- 3. Simular los Axies liberados directo (sin pasar por el cooldown
    -- real de 4hs, que bloquearía repetir swaps con la misma wallet en
    -- loop) — se insertan como si hubiesen sido swaps normales, y se
    -- descuenta el SLP correspondiente del pool de swap del evento.
    for i in 1..v_axies loop
      v_axie_id := 'SEED-AXIE-' || v_year || '-' || v_month || '-' || i;
      v_tx := 'SIM-SEED-SWAP-' || substr(md5(random()::text), 1, 10);
      insert into public.released_axies (event_id, wallet_address, axie_id, release_reason, paid_slp, tx_hash, tx_url)
      values (v_event_id, v_wallet, v_axie_id, 'swap', v_floor_slp, v_tx, 'https://app.roninchain.com/tx/' || v_tx);
    end loop;

    update public.events set
      axies_swapped        = v_axies,
      axies_released        = v_axies,
      swap_pool_slp         = greatest(swap_pool_slp - (v_axies * v_floor_slp), 0),
      swap_pool_spent_slp   = v_axies * v_floor_slp
    where id = v_event_id;

    -- 4. Cerrar el evento de verdad — sortea lo pendiente, quema,
    -- arma el desglose de fondos con transacción por pool, y transfiere
    -- los sobrantes al pool anual. Motivo: manual (fue simulado a propósito).
    perform public.close_event_with_reason(v_event_id, 'manual');

    raise notice 'Evento %/% listo: % tickets, % Axies liberados, event_id = %',
      v_month, v_year, v_qty, v_axies, v_event_id;
  end loop;
end $$;

-- ── Verificación ────────────────────────────────────────────────
select event_number, label, status, total_tickets, axies_released, ritual_level, total_raised_slp, closure_reason
from public.events
where event_number <= 0
order by event_number;