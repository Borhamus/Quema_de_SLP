/**
 * lib/axie-service.ts
 *
 * Servicio para traer los Axies de una wallet en Ronin.
 *
 * HOY: usa datos MOCK (mismo shape que devolvería Moralis) para
 * poder construir y probar todo el flujo de Swap sin esperar la
 * API key.
 *
 * CUANDO TENGAMOS LA API KEY: se reemplaza el cuerpo de
 * getAxiesForWallet() por la llamada real a Moralis (NFT API,
 * chain=ronin). La firma de la función y el tipo Axie NO cambian,
 * así que ningún componente que la use necesita tocarse.
 */

export type Axie = {
  id: string;           // Axie ID en el marketplace
  name: string;
  imageUrl: string;
  class: "Beast" | "Aquatic" | "Plant" | "Bird" | "Bug" | "Reptile" | "Mech" | "Dawn" | "Dusk";
  breedCount: number;
};

// ── MOCK DATA — mismo shape que Moralis NFT API devolvería ───────
const MOCK_AXIES: Axie[] = [
  { id: "11822913", name: "Axie Beast #11822913", imageUrl: "https://axiecdn.axieinfinity.com/axies/11822913/axie/axie-full-transparent.png", class: "Beast", breedCount: 3 },
  { id: "11900234", name: "Axie Aquatic #11900234", imageUrl: "https://axiecdn.axieinfinity.com/axies/11900234/axie/axie-full-transparent.png", class: "Aquatic", breedCount: 1 },
  { id: "12033456", name: "Axie Plant #12033456", imageUrl: "https://axiecdn.axieinfinity.com/axies/12033456/axie/axie-full-transparent.png", class: "Plant", breedCount: 5 },
  { id: "12100789", name: "Axie Reptile #12100789", imageUrl: "https://axiecdn.axieinfinity.com/axies/12100789/axie/axie-full-transparent.png", class: "Reptile", breedCount: 0 },
  { id: "12250100", name: "Axie Bird #12250100", imageUrl: "https://axiecdn.axieinfinity.com/axies/12250100/axie/axie-full-transparent.png", class: "Bird", breedCount: 2 },
];

const USE_MOCK = true; // ← cambiar a false cuando esté la API key de Moralis

/**
 * Devuelve los Axies que posee una wallet en Ronin.
 * Mismo shape de datos sin importar la fuente (mock o Moralis real).
 */
export async function getAxiesForWallet(walletAddress: string): Promise<Axie[]> {
  if (USE_MOCK) {
    // Simula latencia de red real
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_AXIES;
  }

  // ── IMPLEMENTACIÓN REAL (Moralis) — se activa con USE_MOCK=false ──
  // const MORALIS_API_KEY = "TU_API_KEY_ACA";
  // const res = await fetch(
  //   `https://deep-index.moralis.io/api/v2.2/${walletAddress}/nft?chain=ronin&format=decimal`,
  //   { headers: { "X-API-Key": MORALIS_API_KEY, accept: "application/json" } }
  // );
  // const json = await res.json();
  // return (json.result ?? []).map((nft: any) => ({
  //   id: nft.token_id,
  //   name: nft.name ?? `Axie #${nft.token_id}`,
  //   imageUrl: nft.normalized_metadata?.image ?? "",
  //   class: nft.normalized_metadata?.attributes?.find((a: any) => a.trait_type === "class")?.value ?? "Beast",
  //   breedCount: 0,
  // }));

  throw new Error("Moralis no configurado todavía — USE_MOCK debe estar en true");
}