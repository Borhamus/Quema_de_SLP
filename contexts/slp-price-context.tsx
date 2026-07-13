/**
 * contexts/slp-price-context.tsx
 *
 * Precio de SLP compartido por TODA la app — un solo poller, no uno
 * por pantalla. Antes, cada pantalla que usaba useSlpPrice() hacía su
 * propia consulta a CoinGecko cada 30s; con varias pantallas montadas
 * a la vez, eso multiplicaba los pedidos y CoinGecko terminaba
 * devolviendo 429 (Too Many Requests) — el error de "CORS" que se veía
 * en consola era solo un efecto secundario confuso de esa respuesta
 * de error, no el problema real.
 *
 * Con esto, sin importar cuántas pantallas estén usando el precio al
 * mismo tiempo, se pide UNA sola vez cada 60 segundos.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=smooth-love-potion&vs_currencies=usd";

const REFRESH_INTERVAL_MS = 60_000; // antes 30s en cada pantalla — ahora 60s, una sola vez para toda la app
const FALLBACK_PRICE = 0.0005; // usado solo si falla la consulta en vivo — actualizado jul/2026, revisar si queda vieja de nuevo

type SlpPriceState = {
  price: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
};

const SlpPriceContext = createContext<SlpPriceState | null>(null);

export function SlpPriceProvider({ children }: { children: React.ReactNode }) {
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
        // Si falla (rate limit, red caída, etc), nos quedamos con el
        // último precio bueno que tengamos — no pisamos un precio real
        // reciente con el fallback solo porque UN pedido falló.
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

  return <SlpPriceContext.Provider value={state}>{children}</SlpPriceContext.Provider>;
}

export function useSlpPrice() {
  const ctx = useContext(SlpPriceContext);
  if (!ctx) throw new Error("useSlpPrice debe usarse dentro de <SlpPriceProvider>");
  return ctx;
}