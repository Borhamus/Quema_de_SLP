/**
 * lib/waypoint.ts
 * Configuración de Ronin Waypoint para autenticación
 *
 * Web:     usa @sky-mavis/waypoint (popup en browser)
 * Android: usa @sky-mavis/waypoint-native (deeplink)
 *
 * Por ahora está configurado para WEB.
 * Cuando migremos a Android, reemplazar por waypoint-native.
 */

import { Platform } from 'react-native';
import { supabase, upsertUser } from './supabase'; // ajustar path si es necesario

// ─── CONFIGURACIÓN ────────────────────────────────────────────
export const WAYPOINT_CONFIG = {
  clientId:      'c4d9837e-cc22-4ad8-bfc7-51390aa5b5e5',
  chainId:       2020,   // Ronin Mainnet (usar 2021 para Saigon Testnet)
  rpcUrl:        'https://api.roninchain.com/rpc',
  waypointOrigin:'https://waypoint.roninchain.com',
};

// ─── RESULTADO DE AUTH ────────────────────────────────────────
export type WaypointAuthResult = {
  success: boolean;
  address?: string;
  token?: string;
  error?: string;
};

// ─── LOGIN CON WAYPOINT (WEB) ─────────────────────────────────
/**
 * Abre el popup de Ronin Waypoint y autentica al usuario.
 * Solo funciona en web (window.open).
 * Para Android usar loginWithWaypointNative().
 */
export async function loginWithWaypointWeb(): Promise<WaypointAuthResult> {
  if (Platform.OS !== 'web') {
    return { success: false, error: 'Usar loginWithWaypointNative en Android' };
  }

  try {
    // Importación dinámica — solo se carga en web
    const { authorize } = await import('@sky-mavis/waypoint');

    const result = await authorize({
      mode: 'popup',
      clientId: WAYPOINT_CONFIG.clientId,
      scopes: ['openid', 'wallet'],
    });

    if (!result?.token || !result?.address) {
      return { success: false, error: 'No se recibió token o address de Waypoint' };
    }

    // Conectar con Supabase usando la wallet como identificador
    await connectWalletToSupabase(result.address, result.token);

    return {
      success: true,
      address: result.address,
      token: result.token,
    };
  } catch (err: any) {
    console.error('[Waypoint Web] Error:', err);
    return { success: false, error: err?.message ?? 'Error desconocido' };
  }
}

// ─── LOGIN CON WAYPOINT (ANDROID — próximamente) ─────────────
/**
 * Placeholder para la versión Android.
 * Se implementa cuando migremos a @sky-mavis/waypoint-native.
 */
export async function loginWithWaypointNative(): Promise<WaypointAuthResult> {
  // TODO: implementar con @sky-mavis/waypoint-native
  // import Waypoint from '@sky-mavis/waypoint-native';
  // const wp = new Waypoint({ ...WAYPOINT_CONFIG, redirectUri: 'fynoltscult://' });
  // const state = uuidv4();
  // const result = await wp.authorize(state);
  return { success: false, error: 'Android auth — próximamente' };
}

// ─── CONECTAR WALLET A SUPABASE ───────────────────────────────
/**
 * Crea o actualiza la sesión en Supabase usando la wallet address.
 * Usamos el patrón: email = address@ronin.wallet, password = token.
 * Esto permite tener sesión persistente en Supabase sin backend propio.
 */
async function connectWalletToSupabase(address: string, token: string): Promise<void> {
  const email = `${address.toLowerCase()}@ronin.wallet`;
  // Usamos los primeros 72 chars del token como password (límite de Supabase)
  const password = token.slice(0, 72);

  // Intentar login primero
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    // Si no existe, registrar
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) throw signUpError;

    // Crear perfil en tabla users
    if (data.user) {
      await upsertUser({
        id: data.user.id,
        ronin_wallet: address,
        provider: 'ronin',
        display_name: `${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    }
  }
}

// ─── HELPER: dirección abreviada ─────────────────────────────
export function shortAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
