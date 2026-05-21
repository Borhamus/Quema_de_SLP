/**
 * constants/ritualData.ts
 * Data compartida. En V2 esto viene de la API.
 */

// ─── PALETA ──────────────────────────────────
export const C = {
  bg: "#000000", surface: "#0b0000", surface2: "#130000",
  border: "#2a0000", borderMid: "#550000",
  crimson: "#CC0000", crimsonBrt: "#FF2200", crimsonGlow: "#CC000025",
  ember: "#FF6600", emberDim: "#FF660018",
  gold: "#B8860B", goldBrt: "#D4A017", goldDim: "#B8860B18",
  green: "#4a7c3f", greenBrt: "#6abf5e",
  slate: "#5a5a6a", parchment: "#C8BEB0",
};

// ─── TYPES ───────────────────────────────────
export type MilestoneReward = {
  level: number;
  thresholdUsd: number;
  slpEquivalent: number;      // cuánto SLP costaba ese USD al momento
  slpPriceAtTime: number;     // precio del SLP en USD en ese momento
  item: string;
  type: "axie" | "land";
  marketUrl: string;
  purchaseTxHash: string;     // TX de compra desde wallet empresa
  purchaseTxUrl: string;
  winnerWallet: string;
  deliveryTxHash: string;     // TX de entrega al ganador
  deliveryTxUrl: string;
};

export type ReleasedAxie = {
  axieId: string;
  txHash: string;
  txUrl: string;
};

export type Participant = {
  wallet: string;
  tickets: number;
};

export type PoolSnapshot = {
  name: string; emoji: string; color: string;
  pctOfTicket: number;
  totalUsd: number;
  detail: string;
  txHash: string; txUrl: string;
};

export type EventData = {
  id: number;
  label: string;
  date: string;
  status: "completado" | "activo";
  // Fase 1: Tickets
  totalTickets: number;
  ticketPriceSlp: number;
  slpPriceUsd: number;
  totalRaisedUsd: number;
  // Milestones (nivel del ritual)
  milestones: MilestoneReward[];
  // Fase 2: Swap
  axiesSwapped: number;
  floorPriceUsd: number;
  swapPoolSpent: number;
  cooldownResets: number;
  // Fase 3: Cierre
  slpBurned: number;
  axiesReleased: number;
  releasedAxies: ReleasedAxie[];
  // Pools finales
  pools: PoolSnapshot[];
  // Participantes
  participantList: Participant[];
  // Wallet pública
  walletUrl: string;
};

// ─── LINKS DE EJEMPLO ────────────────────────
const AXIE_URL = "https://app.axieinfinity.com/marketplace/axies/11822913/";
const LAND_URL = "https://app.axieinfinity.com/marketplace/lands/-145/-109/";
const TX_BASE  = "https://app.roninchain.com/tx/";
const TX_EXAMPLE = "0xc5f252666cfb47250d0708dcd9474e89a1f12ddd659a7bd4d50cc337265d610e";
const WALLET_URL = "https://app.axieinfinity.com/profile/0x771faac23673fba19a414064def8a4aacf43fcfd/activities/";
const txUrl = () => `${TX_BASE}${TX_EXAMPLE}`;

function mockAxies(n: number, start: number): ReleasedAxie[] {
  return Array.from({ length: n }, (_, i) => ({
    axieId: String(start + i * 37),
    txHash: `0x${(start + i).toString(16).padStart(6, "0")}...${((start + i) * 7).toString(16).padStart(4, "0")}`,
    txUrl: txUrl(),
  }));
}
function mockParticipants(n: number): Participant[] {
  return Array.from({ length: n }, (_, i) => ({
    wallet: `ronin:0x${(i * 1117 + 4521).toString(16).padStart(6, "0")}...${((i + 1) * 331).toString(16).padStart(4, "0")}`,
    tickets: Math.floor(Math.random() * 4) + 1,
  }));
}

// ─── 3 EVENTOS DE DEMOSTRACIÓN ───────────────
export const PAST_EVENTS: EventData[] = [
  {
    id: 3, label: "Marzo 2025", date: "2025-03-01", status: "completado",
    totalTickets: 520, ticketPriceSlp: 1000, slpPriceUsd: 0.003, totalRaisedUsd: 4680,
    milestones: [
      { level: 1, thresholdUsd: 100, slpEquivalent: 33333, slpPriceAtTime: 0.003,
        item: "Axie Beast — #11822913 Purity 4/6", type: "axie", marketUrl: AXIE_URL,
        purchaseTxHash: "0xa1b2...c3d4", purchaseTxUrl: txUrl(),
        winnerWallet: "ronin:0xAb3f...2Cd1", deliveryTxHash: "0xd4e5...f6a7", deliveryTxUrl: txUrl() },
      { level: 2, thresholdUsd: 200, slpEquivalent: 66666, slpPriceAtTime: 0.003,
        item: "Land Plot — Savannah (-145,-109)", type: "land", marketUrl: LAND_URL,
        purchaseTxHash: "0xb2c3...d4e5", purchaseTxUrl: txUrl(),
        winnerWallet: "ronin:0xEf12...9Aa3", deliveryTxHash: "0xe5f6...a7b8", deliveryTxUrl: txUrl() },
      { level: 3, thresholdUsd: 300, slpEquivalent: 100000, slpPriceAtTime: 0.003,
        item: "Axie Aquatic — #11822913 Mystic", type: "axie", marketUrl: AXIE_URL,
        purchaseTxHash: "0xc3d4...e5f6", purchaseTxUrl: txUrl(),
        winnerWallet: "ronin:0xGh56...3Bb7", deliveryTxHash: "0xf6a7...b8c9", deliveryTxUrl: txUrl() },
    ],
    axiesSwapped: 145, floorPriceUsd: 0.52, swapPoolSpent: 75.4, cooldownResets: 18,
    slpBurned: 520000, axiesReleased: 145,
    releasedAxies: mockAxies(145, 11800000),
    pools: [
      { name: "Pool de Recompensas", emoji: "⚔️", color: C.gold,    pctOfTicket: 25, totalUsd: 1170, detail: "3 milestones alcanzados. 3 items comprados y sorteados.", txHash: "0xaa11...bb22", txUrl: txUrl() },
      { name: "Pool de Swap",        emoji: "⚖️", color: C.crimson, pctOfTicket: 25, totalUsd: 1170, detail: "145 Axies comprados al floor price de $0.52. Pool agotado en 18 hs.", txHash: "0xbb22...cc33", txUrl: txUrl() },
      { name: "Quema Directa",       emoji: "🔥", color: C.ember,   pctOfTicket: 25, totalUsd: 1170, detail: "520.000 SLP enviados a burn address. TX irreversible.", txHash: "0xcc33...dd44", txUrl: txUrl() },
      { name: "Operaciones y Devs",   emoji: "🔩", color: C.slate,   pctOfTicket: 15, totalUsd: 702,  detail: "Gas fees, servidor, mantenimiento de contratos.", txHash: "0xdd44...ee55", txUrl: txUrl() },
      { name: "Pool Reward Anual",    emoji: "🗝️", color: C.goldBrt, pctOfTicket: 10, totalUsd: 468,  detail: "Acumulado para el evento de Diciembre 2025.", txHash: "0xee55...ff66", txUrl: txUrl() },
    ],
    participantList: mockParticipants(174),
    walletUrl: WALLET_URL,
  },
  {
    id: 2, label: "Febrero 2025", date: "2025-02-01", status: "completado",
    totalTickets: 420, ticketPriceSlp: 857, slpPriceUsd: 0.0035, totalRaisedUsd: 3780,
    milestones: [
      { level: 1, thresholdUsd: 100, slpEquivalent: 28571, slpPriceAtTime: 0.0035,
        item: "Land Plot — Savannah (-145,-109)", type: "land", marketUrl: LAND_URL,
        purchaseTxHash: "0xf1e2...d3c4", purchaseTxUrl: txUrl(),
        winnerWallet: "ronin:0xBc45...3De2", deliveryTxHash: "0xa8b9...c0d1", deliveryTxUrl: txUrl() },
      { level: 2, thresholdUsd: 200, slpEquivalent: 57142, slpPriceAtTime: 0.0035,
        item: "Axie Plant — #11822913 Purity 5/6", type: "axie", marketUrl: AXIE_URL,
        purchaseTxHash: "0xe2d3...c4b5", purchaseTxUrl: txUrl(),
        winnerWallet: "ronin:0xFg23...7Gh4", deliveryTxHash: "0xb9c0...d1e2", deliveryTxUrl: txUrl() },
    ],
    axiesSwapped: 110, floorPriceUsd: 0.55, swapPoolSpent: 60.5, cooldownResets: 12,
    slpBurned: 380000, axiesReleased: 110,
    releasedAxies: mockAxies(110, 11600000),
    pools: [
      { name: "Pool de Recompensas", emoji: "⚔️", color: C.gold,    pctOfTicket: 25, totalUsd: 945,  detail: "2 milestones. Land Savannah y Axie Plant comprados y sorteados.", txHash: "0x1122...3344", txUrl: txUrl() },
      { name: "Pool de Swap",        emoji: "⚖️", color: C.crimson, pctOfTicket: 25, totalUsd: 945,  detail: "110 Axies comprados al floor price de $0.55.", txHash: "0x3344...5566", txUrl: txUrl() },
      { name: "Quema Directa",       emoji: "🔥", color: C.ember,   pctOfTicket: 25, totalUsd: 945,  detail: "380.000 SLP enviados a burn address.", txHash: "0x5566...7788", txUrl: txUrl() },
      { name: "Operaciones y Devs",   emoji: "🔩", color: C.slate,   pctOfTicket: 15, totalUsd: 567,  detail: "Operaciones y mantenimiento.", txHash: "0x7788...99aa", txUrl: txUrl() },
      { name: "Pool Reward Anual",    emoji: "🗝️", color: C.goldBrt, pctOfTicket: 10, totalUsd: 378,  detail: "Acumulado para Diciembre.", txHash: "0x99aa...bbcc", txUrl: txUrl() },
    ],
    participantList: mockParticipants(140),
    walletUrl: WALLET_URL,
  },
  {
    id: 1, label: "Enero 2025 — Primer Ritual", date: "2025-01-01", status: "completado",
    totalTickets: 350, ticketPriceSlp: 1000, slpPriceUsd: 0.003, totalRaisedUsd: 3150,
    milestones: [
      { level: 1, thresholdUsd: 100, slpEquivalent: 33333, slpPriceAtTime: 0.003,
        item: "Axie Beast — #11822913 Reptile", type: "axie", marketUrl: AXIE_URL,
        purchaseTxHash: "0xaa00...bb11", purchaseTxUrl: txUrl(),
        winnerWallet: "ronin:0xDe67...5Fg4", deliveryTxHash: "0xcc22...dd33", deliveryTxUrl: txUrl() },
      { level: 2, thresholdUsd: 200, slpEquivalent: 66666, slpPriceAtTime: 0.003,
        item: "Axie Aquatic — #11822913 Origin", type: "axie", marketUrl: AXIE_URL,
        purchaseTxHash: "0xbb11...cc22", purchaseTxUrl: txUrl(),
        winnerWallet: "ronin:0xHi78...6Ij7", deliveryTxHash: "0xdd33...ee44", deliveryTxUrl: txUrl() },
    ],
    axiesSwapped: 85, floorPriceUsd: 0.60, swapPoolSpent: 51.0, cooldownResets: 8,
    slpBurned: 310000, axiesReleased: 85,
    releasedAxies: mockAxies(85, 11400000),
    pools: [
      { name: "Pool de Recompensas", emoji: "⚔️", color: C.gold,    pctOfTicket: 25, totalUsd: 787.5, detail: "2 milestones. Primer ritual del proyecto.", txHash: "0xdd44...ee55", txUrl: txUrl() },
      { name: "Pool de Swap",        emoji: "⚖️", color: C.crimson, pctOfTicket: 25, totalUsd: 787.5, detail: "85 Axies comprados al floor price de $0.60.", txHash: "0xee55...ff66", txUrl: txUrl() },
      { name: "Quema Directa",       emoji: "🔥", color: C.ember,   pctOfTicket: 25, totalUsd: 787.5, detail: "310.000 SLP enviados a burn address. Primera quema.", txHash: "0xff66...0077", txUrl: txUrl() },
      { name: "Operaciones y Devs",   emoji: "🔩", color: C.slate,   pctOfTicket: 15, totalUsd: 472.5, detail: "Setup inicial, deploy de contratos.", txHash: "0x0077...1188", txUrl: txUrl() },
      { name: "Pool Reward Anual",    emoji: "🗝️", color: C.goldBrt, pctOfTicket: 10, totalUsd: 315,   detail: "Primera contribución al pool anual.", txHash: "0x1188...2299", txUrl: txUrl() },
    ],
    participantList: mockParticipants(117),
    walletUrl: WALLET_URL,
  },
];

export const GLOBAL_STATS = {
  totalSlpBurned:     PAST_EVENTS.reduce((a, e) => a + e.slpBurned, 0),
  totalAxiesReleased: PAST_EVENTS.reduce((a, e) => a + e.axiesReleased, 0),
  totalEvents:        PAST_EVENTS.length,
  totalRaised:        PAST_EVENTS.reduce((a, e) => a + e.totalRaisedUsd, 0),
};

// ─── HELPERS ─────────────────────────────────
export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
export function getEvent(id: number): EventData | undefined {
  return PAST_EVENTS.find(e => e.id === id);
}
export function chartHtml(eventDate: string): string {
  const d = new Date(eventDate);
  const from = new Date(d.getTime() - 2 * 86400000).toISOString().split("T")[0];
  const to   = new Date(d.getTime() + 2 * 86400000).toISOString().split("T")[0];
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0}body{background:#000;overflow:hidden}.l{color:#CC0000;font-family:monospace;font-size:10px;text-align:center;padding:6px 0 2px;letter-spacing:2px}.s{color:#550000;font-family:monospace;font-size:9px;text-align:center;padding:0 0 4px}</style></head><body><p class="l">⬡ SLP/USD — ${from} a ${to} ⬡</p><p class="s">Ventana del ritual · Fuente: TradingView</p><div id="tv"></div><script src="https://s3.tradingview.com/tv.js"></script><script>new TradingView.widget({container_id:"tv",autosize:true,symbol:"BINANCE:SLPUSDT",interval:"60",timezone:"America/Argentina/Buenos_Aires",theme:"dark",style:"1",locale:"es",toolbar_bg:"#000",enable_publishing:false,hide_top_toolbar:true,save_image:false,backgroundColor:"#000",gridColor:"#1a0000",height:220,width:"100%"});</script></body></html>`;
}
