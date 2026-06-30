/**
 * lib/supabase.ts
 * Cliente de Supabase + helpers de datos para Quema de SLP
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// ─── CONFIGURACIÓN ────────────────────────────────────────────
const SUPABASE_URL = 'https://yacdiwuwtdvicxmimyzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JTFhHxQaZpyu3gKBv89C-w_jvx9NlKh';

// Storage adaptado a la plataforma (web usa localStorage, nativo usa memoria)
const storage = Platform.OS === 'web'
  ? undefined  // Supabase usa localStorage por defecto en web
  : undefined; // En Android/iOS instalar expo-secure-store y usarlo acá

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// ─── TIPOS ───────────────────────────────────────────────────
export type EventSummary = {
  id: string;
  event_number: number;
  label: string;
  date_start: string;
  date_end: string;
  status: string;
  total_tickets: number;
  slp_burned: number;
  axies_released: number;
  ritual_level: number;
  total_raised_usd: number;
};

export type EventDetail = EventSummary & {
  ticket_price_slp: number;
  slp_price_usd: number;
  axies_swapped: number;
  floor_price_usd: number;
  swap_pool_spent: number;
  cooldown_resets: number;
  wallet_url: string;
};

export type EventFund = {
  id: string;
  name: string;
  emoji: string;
  color_hex: string;
  pct_of_ticket: number;
  total_usd: number;
  detail: string;
  tx_hash: string;
  tx_url: string;
};

export type Milestone = {
  id: string;
  level: number;
  threshold_usd: number;
  slp_equivalent: number;
  slp_price_at_time: number;
  item_name: string;
  item_type: 'axie' | 'land';
  market_url: string;
  purchase_tx_hash: string;
  purchase_tx_url: string;
  winner_wallet: string;
  delivery_tx_hash: string;
  delivery_tx_url: string;
};

export type ReleasedAxie = {
  id: string;
  axie_id: string;
  tx_hash: string;
  tx_url: string;
};

export type Participant = {
  id: string;
  wallet_address: string;
  tickets_count: number;
};

// ─── HELPERS DE EVENTOS ───────────────────────────────────────

/**
 * Lista todos los eventos — los 4 campos para el endpoint principal
 * Equivale a GET /rest/v1/events
 */
export async function getEvents(): Promise<EventSummary[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, event_number, label, date_start, date_end, status, total_tickets, slp_burned, axies_released, ritual_level, total_raised_usd')
    .order('event_number', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Detalle completo de un evento por su event_number (1, 2, 3...)
 */
export async function getEventByNumber(eventNumber: number): Promise<EventDetail | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_number', eventNumber)
    .single();

  if (error) return null;
  return data;
}

/**
 * Detalle completo de un evento por UUID
 */
export async function getEventById(id: string): Promise<EventDetail | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// ─── HELPERS DE FONDOS ────────────────────────────────────────

/**
 * Fondos de un evento por UUID
 * Equivale a GET /rest/v1/event_funds?event_id=eq.<uuid>
 */
export async function getEventFunds(eventId: string): Promise<EventFund[]> {
  const { data, error } = await supabase
    .from('event_funds')
    .select('id, name, emoji, color_hex, pct_of_ticket, total_usd, detail, tx_hash, tx_url')
    .eq('event_id', eventId)
    .order('pct_of_ticket', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── HELPERS DE MILESTONES ────────────────────────────────────

export async function getMilestones(eventId: string): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('event_id', eventId)
    .order('level', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ─── HELPERS DE AXIES LIBERADOS ───────────────────────────────

export async function getReleasedAxies(eventId: string): Promise<ReleasedAxie[]> {
  const { data, error } = await supabase
    .from('released_axies')
    .select('id, axie_id, tx_hash, tx_url')
    .eq('event_id', eventId)
    .order('released_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ─── HELPERS DE PARTICIPANTES ─────────────────────────────────

export async function getParticipants(eventId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('id, wallet_address, tickets_count')
    .eq('event_id', eventId)
    .order('tickets_count', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── HELPERS DE FAVORITOS ─────────────────────────────────────

export async function getFavorites(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('event_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map(f => f.event_id);
}

export async function addFavorite(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, event_id: eventId });
  if (error) throw error;
}

export async function removeFavorite(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);
  if (error) throw error;
}

// ─── REALTIME — Favoritos ─────────────────────────────────────

/**
 * Suscripción en tiempo real a los favoritos de un usuario.
 * Retorna una función para cancelar la suscripción.
 */
export function subscribeFavorites(
  userId: string,
  onChange: (eventId: string, action: 'added' | 'removed') => void
) {
  const channel = supabase
    .channel(`favorites-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onChange(payload.new.event_id, 'added')
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onChange(payload.old.event_id, 'removed')
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ─── AUTH HELPERS ─────────────────────────────────────────────

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Upsert del perfil de usuario en la tabla users.
 * Se llama después de cualquier login exitoso.
 */
export async function upsertUser(params: {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  ronin_wallet?: string;
  provider: 'email' | 'google' | 'ronin';
}) {
  const { error } = await supabase
    .from('users')
    .upsert(params, { onConflict: 'id' });
  if (error) throw error;
}
