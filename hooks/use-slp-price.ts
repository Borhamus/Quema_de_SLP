/**
 * hooks/use-slp-price.ts
 *
 * El precio en sí ahora vive en un solo lugar compartido por toda la
 * app (contexts/slp-price-context.tsx) — antes cada pantalla tenía su
 * propio poller independiente, lo que multiplicaba los pedidos a
 * CoinGecko y terminaba en error 429 (demasiados pedidos). Este
 * archivo se deja como puente para no tener que cambiar el import en
 * cada pantalla que ya usa `useSlpPrice` desde acá.
 */
export { useSlpPrice } from "@/contexts/slp-price-context";

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