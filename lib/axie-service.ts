/**
 * lib/axie-service.ts
 *
 * Servicio para traer los Axies REALES de una wallet en Ronin,
 * vía Moralis (NFT API) — el camino que el propio Sky Mavis
 * recomienda ahora que discontinuó su API vieja de NFTs (Skynet).
 *
 * Se activa solo con poner EXPO_PUBLIC_MORALIS_API_KEY en tu .env.
 * Sin esa variable, cae a datos de ejemplo y lo avisa explícitamente
 * (nunca finge ser data real cuando no lo es).
 */

export type Axie = {
  id: string;
  name: string;
  imageUrl: string;
  class: string;
  breedCount: number;
};

// Contrato oficial de la colección Axie en Ronin (mainnet).
const AXIE_CONTRACT_ADDRESS = "0x32950db2a7164ae833121501c797d79e7b79d74c";

const MORALIS_API_KEY = process.env.EXPO_PUBLIC_MORALIS_API_KEY;

/**
 * Devuelve los Axies que la wallet TIENE REALMENTE en Ronin.
 * Si no hay API key configurada, devuelve datos de ejemplo — pero
 * marcados como tales (isMock: true en consola), nunca silenciosos.
 */
export async function getAxiesForWallet(walletAddress: string): Promise<Axie[]> {
  if (!MORALIS_API_KEY) {
    console.warn(
      "[axie-service] Falta EXPO_PUBLIC_MORALIS_API_KEY en tu .env — " +
      "mostrando Axies de EJEMPLO, no los reales de la wallet. " +
      "Registrate gratis en moralis.com y agregá la key para ver los reales."
    );
    return getPlaceholderAxies();
  }

  const url =
    `https://deep-index.moralis.io/api/v2.2/${walletAddress}/nft` +
    `?chain=ronin&format=decimal&token_addresses%5B%5D=${AXIE_CONTRACT_ADDRESS}`;

  const res = await fetch(url, {
    headers: { "X-API-Key": MORALIS_API_KEY, accept: "application/json" },
  });

  if (!res.ok) {
    console.error("[axie-service] Moralis respondió", res.status, await res.text());
    throw new Error(`No se pudo consultar los Axies de la wallet (Moralis ${res.status})`);
  }

  const json = await res.json();
  const items = json?.result ?? [];

  return items.map((nft: any): Axie => {
    let metadata: any = {};
    try {
      metadata = typeof nft.metadata === "string" ? JSON.parse(nft.metadata) : (nft.metadata ?? {});
    } catch {
      metadata = {};
    }
    return {
      id: nft.token_id,
      name: metadata.name ?? `Axie #${nft.token_id}`,
      imageUrl: metadata.image ?? `https://axiecdn.axieinfinity.com/axies/${nft.token_id}/axie/axie-full-transparent.png`,
      class: metadata.properties?.class ?? "desconocida",
      breedCount: metadata.properties?.breed_count ?? 0,
    };
  });
}

// ── Solo se usa si falta la API key — para que la pantalla no se
// rompa mientras la configurás, pero SIEMPRE avisando en consola. ──
function getPlaceholderAxies(): Axie[] {
  return [
    { id: "0000000", name: "Axie de ejemplo (configurá Moralis)", imageUrl: "https://axiecdn.axieinfinity.com/axies/11822913/axie/axie-full-transparent.png", class: "desconocida", breedCount: 0 },
  ];
}