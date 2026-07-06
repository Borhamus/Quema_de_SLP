/**
 * lib/supabase.ts
 * Cliente de Supabase — única fuente de acceso a la base de datos.
 *
 * Todas las pantallas usan directamente supabase.from(...) / .rpc(...)
 * con los nombres de tablas y funciones reales del schema (ver
 * 01_crear_base_de_datos.sql). No hay helpers intermedios acá a
 * propósito.
 *
 * No usamos supabase.auth para nada: no hay email, no hay OAuth.
 * El login es 100% wallet Ronin (ver contexts/wallet-context.tsx),
 * con sesión efímera en memoria — nunca en supabase.auth.
 *
 * Las credenciales viven SOLO en .env (ver .env.example) — nunca
 * hardcodeadas acá. Si falta el .env, falla fuerte y explícito en
 * vez de usar un valor de respaldo silencioso.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_ANON_KEY.\n' +
    'Copiá .env.example a .env, completá los valores reales del proyecto ' +
    'y reiniciá el servidor de Expo (npx expo start -c).'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
