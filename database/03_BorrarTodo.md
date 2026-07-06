-- ============================================================
-- 03_ELIMINAR_BASE_DE_DATOS.sql
-- QUEMA DE SLP — Fynolt's Cult
--
-- BORRA ABSOLUTAMENTE TODO lo que crea 01_crear_base_de_datos.sql:
-- cron jobs, funciones, vistas, tablas (con sus índices, FKs,
-- constraints y policies, que caen solas con CASCADE al borrar
-- la tabla). No hay tipos personalizados (enums/domains) en este
-- proyecto — los estados usan check constraints sobre text, así
-- que no hay nada extra que dropear ahí.
--
-- Después de correr esto, el esquema public queda vacío y se
-- puede recrear ejecutando únicamente 01_crear_base_de_datos.sql.
--
-- Las extensiones (uuid-ossp, pg_net, pg_cron) NO se deshabilitan
-- acá a propósito: son recursos del proyecto compartidos y
-- 01_crear_base_de_datos.sql las vuelve a pedir con "if not exists",
-- así que no hace falta tocarlas. Si de verdad querés desinstalar
-- pg_cron/pg_net, hacelo manualmente desde Database → Extensions.
-- ============================================================

-- ── 1. Cancelar cron jobs ───────────────────────────────────────
select cron.unschedule(jobname)
from cron.job
where jobname in ('create-monthly-event', 'advance-event-phases');

-- ── 2. Funciones (orden no importa gracias a CASCADE, pero se
--       agrupan por sección para que sea legible) ───────────────

-- Core del ciclo mensual
drop function if exists public.get_slp_price_usd() cascade;
drop function if exists public.get_level_config(integer) cascade;
drop function if exists public.buy_ticket(uuid, text, numeric, text) cascade;
drop function if exists public.buy_ticket_core(uuid, text, numeric, text, numeric) cascade;
drop function if exists public.buy_tickets_bulk(uuid, text, integer, numeric, text) cascade;
drop function if exists public.swap_axie(uuid, text, text, numeric, text) cascade;
drop function if exists public.release_swap_cooldown_with_slp(uuid, text, numeric, text) cascade;
drop function if exists public.release_swap_cooldown_with_axie(uuid, text, text, text) cascade;
drop function if exists public.transfer_ticket(uuid, text, text, text) cascade;
drop function if exists public.draw_next_reward(uuid) cascade;
drop function if exists public.close_event(uuid) cascade;
drop function if exists public.close_event_with_reason(uuid, text) cascade;

-- Llaves anuales y evento especial
drop function if exists public.get_or_create_annual_pool(integer) cascade;
drop function if exists public.mint_annual_key(text, integer, numeric, uuid[]) cascade;
drop function if exists public.transfer_annual_key(uuid, text, text, text) cascade;
drop function if exists public.consume_annual_key(uuid, text) cascade;
drop function if exists public.activate_annual_event(integer) cascade;
drop function if exists public.draw_next_annual_reward(uuid) cascade;
drop function if exists public.close_annual_event(uuid) cascade;

-- Perfiles
drop function if exists public.upsert_profile(text, text, uuid) cascade;

-- Sistema automático (pg_cron)
drop function if exists public.create_monthly_event_if_needed() cascade;
drop function if exists public.advance_event_phases() cascade;
drop function if exists public.execute_full_event_closure(uuid) cascade;

-- Funciones de test (QA manual)
drop function if exists public.test_create_event() cascade;
drop function if exists public.test_deactivate_event() cascade;
drop function if exists public.test_set_event_status(uuid, text) cascade;
drop function if exists public.test_simulate_burn(uuid) cascade;
drop function if exists public.test_release_swapped_axies(uuid) cascade;
drop function if exists public.test_finalize_event(uuid, text) cascade;
drop function if exists public.test_force_timeout(uuid) cascade;
drop function if exists public.test_set_config(text, text) cascade;
drop function if exists public.find_ticket_by_qr(text) cascade;
drop function if exists public.test_seed_tickets_for_annual(text, integer) cascade;
drop function if exists public.test_reset_all() cascade;
drop function if exists public.test_create_event_for(integer, integer) cascade;
drop function if exists public.test_list_events() cascade;
drop function if exists public.test_delete_event(uuid) cascade;
drop function if exists public.test_run_checklist(uuid) cascade;

-- ── 3. Vistas ────────────────────────────────────────────────────
drop view if exists public.event_rewards_detail cascade;
drop view if exists public.ticket_ownership_history cascade;
drop view if exists public.profile_with_avatar cascade;

-- ── 4. Tablas (CASCADE se lleva FKs, índices, policies y triggers) ──
drop table if exists public.annual_keys_access cascade;
drop table if exists public.owned_items cascade;
drop table if exists public.profiles cascade;
drop table if exists public.shop_items cascade;
drop table if exists public.annual_rewards cascade;
drop table if exists public.annual_event cascade;
drop table if exists public.annual_keys cascade;
drop table if exists public.annual_pool cascade;
drop table if exists public.favorites cascade;
drop table if exists public.released_axies cascade;
drop table if exists public.swap_cooldown_releases cascade;
drop table if exists public.event_funds cascade;
drop table if exists public.participants cascade;
drop table if exists public.level_rewards_unlocked cascade;
drop table if exists public.level_thresholds cascade;
drop table if exists public.tickets cascade;
drop table if exists public.ticket_transfers cascade;
drop table if exists public.events cascade;
drop table if exists public.system_config cascade;

-- ── 5. Verificación final ───────────────────────────────────────
select 'Esquema public vaciado por completo.' as resultado;
select count(*) as tablas_restantes from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';
select count(*) as funciones_restantes from information_schema.routines where routine_schema = 'public';
select count(*) as cron_jobs_restantes from cron.job where jobname in ('create-monthly-event', 'advance-event-phases');