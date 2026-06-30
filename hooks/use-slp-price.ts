/**
 * hooks/use-slp-price.ts
 *
 * Precio en tiempo real del SLP (Smooth Love Potion) desde CoinGecko.
 * Se usa en cualquier pantalla que necesite mostrar "X SLP (~$Y USD)".
 *
 * Cachea el valor y lo refresca cada 30s mientras el hook está montado.
 * Sin API key — endpoint público y gratuito.
 */

import { useEffect, useRef, useState } from "react";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=smooth-love-potion&vs_currencies=usd";

const REFRESH_INTERVAL_MS = 30_000;
const FALLBACK_PRICE = 0.003; // usado solo si falla la primera carga

type SlpPriceState = {
  price: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
};

export function useSlpPrice() {
  const [state, setState] = useState<SlpPriceState>({
    price: FALLBACK_PRICE,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchPrice() {
      try {
        const res = await fetch(COINGECKO_URL);
        if (!res.ok) throw new Error(`CoinGecko respondió ${res.status}`);
        const json = await res.json();
        const price = json?.["smooth-love-potion"]?.usd;

        if (!mounted) return;

        if (typeof price === "number" && price > 0) {
          setState({ price, loading: false, error: null, lastUpdated: Date.now() });
        } else {
          throw new Error("Precio inválido en la respuesta");
        }
      } catch (err: any) {
        if (!mounted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err?.message ?? "Error al obtener el precio del SLP",
        }));
      }
    }

    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return state; // { price, loading, error, lastUpdated }
}

// ── HELPERS DE CONVERSIÓN/FORMATO ───────────────────────────────

/** Convierte un monto en USD a SLP, redondeado hacia arriba (entero) */
export function usdToSlp(usd: number, slpPrice: number): number {
  if (slpPrice <= 0) return 0;
  return Math.ceil(usd / slpPrice);
}

/** Formatea un número grande con separador de miles (es-AR) */
export function fmtSlp(n: number): string {
  return n.toLocaleString("es-AR");
}

/** Texto listo para UI: "16.304 SLP (~$50.00 USD)" */
export function slpWithUsdLabel(usd: number, slpPrice: number): string {
  const slp = usdToSlp(usd, slpPrice);
  return `${fmtSlp(slp)} SLP (~$${usd.toFixed(2)} USD)`;
}