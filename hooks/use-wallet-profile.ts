/**
 * hooks/use-wallet-profile.ts
 *
 * Hook reutilizable para mostrar nombre + avatar de cualquier
 * wallet en cualquier pantalla — Profile, históricos de eventos,
 * lista de ganadores, participantes, etc.
 *
 * Si la wallet no configuró perfil, devuelve null y el componente
 * que lo use debe mostrar la wallet abreviada como fallback.
 */

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export type WalletProfile = {
  wallet_address: string;
  display_name: string | null;
  avatar_id: string | null;
  avatar_url: string | null;
  avatar_name: string | null;
};

/** Hook para una sola wallet (ej: el perfil propio en Profile.tsx) */
export function useWalletProfile(walletAddress: string | null | undefined) {
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!walletAddress) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    supabase
      .from("profile_with_avatar")
      .select("wallet_address, display_name, avatar_id, avatar_url, avatar_name")
      .eq("wallet_address", walletAddress)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) {
          setProfile(data ?? null);
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [walletAddress, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  return { profile, loading, refetch };
}

/**
 * Helper para resolver MUCHOS perfiles a la vez (ej: lista de
 * participantes o ganadores de un evento). Devuelve un Map
 * wallet_address -> WalletProfile para lookup O(1).
 */
export async function fetchProfilesForWallets(wallets: string[]): Promise<Map<string, WalletProfile>> {
  const unique = Array.from(new Set(wallets.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profile_with_avatar")
    .select("wallet_address, display_name, avatar_id, avatar_url, avatar_name")
    .in("wallet_address", unique);

  const map = new Map<string, WalletProfile>();
  (data ?? []).forEach((p) => map.set(p.wallet_address, p));
  return map;
}

/** Texto a mostrar: nombre elegido, o wallet abreviada como fallback */
export function displayNameFor(profile: WalletProfile | null | undefined, wallet: string): string {
  if (profile?.display_name) return profile.display_name;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}