/**
 * Home Screen — Evento de Quema de SLP
 *
 * Estética: Dark Retro Arcane — inspiración en Wizardry, FF1 NES, Warhammer 40k 90s
 * Paleta:   Negro puro + rojo carmesí + gris pizarra + dorado oscuro
 * Shapes:   Bordes angulares, corner-brackets tipo RPG, geometría 3D simulada
 * Chart:    TradingView WebView embebido en el modal de evento (requiere react-native-webview)
 */

import { GothicExpandButton } from "@/components/GothicExpandButton";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  Image,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import AxiesGif from "../../assets/images/AxiesCaminando.gif";

// ─────────────────────────────────────────────
// PALETA ARCANA
// ─────────────────────────────────────────────
const C = {
  bg: "#000000", // negro absoluto
  surface: "#0b0000", // superficie — casi negro, tinte carmesí
  surface2: "#130000", // superficie elevada
  border: "#2a0000", // borde oscuro
  borderMid: "#550000", // borde medio
  crimson: "#CC0000", // rojo carmesí — acento primario
  crimsonBrt: "#FF2200", // rojo brillante — highlights
  crimsonGlow: "#CC000030", // rojo translúcido — fondos
  ember: "#FF6600", // naranja fuego — quema/burn
  emberDim: "#FF660020",
  gold: "#B8860B", // dorado oscuro — premios
  goldBrt: "#D4A017", // dorado brillante
  goldDim: "#B8860B18",
  slate: "#5a5a6a", // gris azulado — texto secundario
  parchment: "#C8BEB0", // blanco cálido — texto principal
  scan: "#ffffff08", // scanline overlay
};

// ─────────────────────────────────────────────
// RESPONSIVE
// ─────────────────────────────────────────────
function useLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 600;
  const hPad = isWide ? 32 : 16;
  const cardW = isWide ? Math.min(width * 0.44, 360) : width - 56;
  return { width, isWide, hPad, cardW };
}

// ─────────────────────────────────────────────
// CORNER BRACKETS — efecto UI de RPG
// ─────────────────────────────────────────────
function CornerBrackets({ color = C.crimson, size = 10, thickness = 2 }) {
  const base: object = { position: "absolute", width: size, height: size };
  const s = { borderColor: color, borderWidth: thickness };
  return (
    <>
      <View
        style={[
          base,
          {
            top: 0,
            left: 0,
            borderTopWidth: thickness,
            borderLeftWidth: thickness,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          base,
          {
            top: 0,
            right: 0,
            borderTopWidth: thickness,
            borderRightWidth: thickness,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          base,
          {
            bottom: 0,
            left: 0,
            borderBottomWidth: thickness,
            borderLeftWidth: thickness,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          base,
          {
            bottom: 0,
            right: 0,
            borderBottomWidth: thickness,
            borderRightWidth: thickness,
            borderColor: color,
          },
        ]}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// ARCANE CARD — con efecto 3D offset y brackets
// ─────────────────────────────────────────────
function ArcaneCard({
  children,
  style,
  accentColor = C.crimson,
  elevated = false,
}: {
  children: React.ReactNode;
  style?: object;
  accentColor?: string;
  elevated?: boolean;
}) {
  return (
    <View style={[arc.wrapper, style]}>
      {/* Sombra 3D — el "offset" inferior derecho */}
      <View style={[arc.shadow3d, { borderColor: accentColor + "44" }]} />
      {/* Card real */}
      <View
        style={[
          arc.card,
          elevated && arc.cardElevated,
          { borderColor: accentColor + "55" },
        ]}
      >
        <CornerBrackets color={accentColor} size={9} thickness={1} />
        {children}
      </View>
    </View>
  );
}
const arc = StyleSheet.create({
  wrapper: { position: "relative", marginBottom: 4 },
  shadow3d: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderRadius: 0,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderRadius: 0,
    padding: 14,
    position: "relative",
  },
  cardElevated: { backgroundColor: C.surface2 },
});

// ─────────────────────────────────────────────
// RUNE DIVIDER — separador de sección estilo grimoiro
// ─────────────────────────────────────────────
function RuneDivider({ label }: { label: string }) {
  return (
    <View style={rd.wrap}>
      <View style={rd.line} />
      <View style={rd.center}>
        <ThemedText style={rd.rune}>⬡</ThemedText>
        <ThemedText style={rd.label}>{label.toUpperCase()}</ThemedText>
        <ThemedText style={rd.rune}>⬡</ThemedText>
      </View>
      <View style={rd.line} />
    </View>
  );
}
const rd = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: C.borderMid },
  center: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 10,
  },
  rune: { color: C.crimson, fontSize: 10 },
  label: {
    color: C.crimson,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
  },
});

// ─────────────────────────────────────────────
// HEXAGRAM DECORATION — Sello de Salomón simplificado
// Dos triángulos: ▲ y ▽ superpuestos
// ─────────────────────────────────────────────
function HexSeal({
  size = 28,
  color = C.crimson,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ThemedText
        style={{ fontSize: size * 0.9, color, lineHeight: size, opacity: 0.85 }}
      >
        ✡
      </ThemedText>
    </View>
  );
}

// ─────────────────────────────────────────────
// DATA — POOLS
// ─────────────────────────────────────────────
const POOLS = [
  {
    id: 1,
    name: "CÁMARA DE RECOMPENSAS",
    emoji: "⚔️",
    pct: 25,
    balance: 312.5,
    description:
      "Financia la adquisición de premios para los sorteos. Cada activo adquirido es registrado on-chain.",
    color: C.gold,
    dimColor: C.goldDim,
  },
  {
    id: 2,
    name: "CÁMARA DE INTERCAMBIO",
    emoji: "⚖️",
    pct: 25,
    balance: 312.5,
    description:
      "Liquidez para comprar los Axies que los usuarios entreguen al floor price del marketplace.",
    color: C.crimson,
    dimColor: C.crimsonGlow,
  },
  {
    id: 3,
    name: "ALTAR DE LA QUEMA",
    emoji: "🔥",
    pct: 25,
    balance: 312.5,
    description:
      "SLP enviado a la burn address. El ritual es irreversible y permanente en la red Ronin.",
    color: C.ember,
    dimColor: C.emberDim,
  },
  {
    id: 4,
    name: "GREMIO DE FORJADORES",
    emoji: "🔩",
    pct: 15,
    balance: 187.5,
    description:
      "Infraestructura, mantenimiento de contratos y desarrollo continuo de la plataforma.",
    color: C.slate,
    dimColor: "#5a5a6a18",
  },
  {
    id: 5,
    name: "BÓVEDA ANUAL",
    emoji: "🗝️",
    pct: 10,
    balance: 125.0,
    description:
      "Se acumula durante el año. En diciembre financia el gran ritual legendario.",
    color: C.goldBrt,
    dimColor: C.goldDim,
  },
];

// ─────────────────────────────────────────────
// DATA — EVENTOS
// ─────────────────────────────────────────────
type Prize = {
  rank: number;
  item: string;
  wallet: string;
  txHash: string;
  value: string;
};
type PoolMove = {
  name: string;
  emoji: string;
  color: string;
  usd: number;
  detail: string;
  txHash: string;
};
type EventData = {
  id: number;
  label: string;
  date: string;
  slpBurned: number;
  axiesReleased: number;
  totalRaised: number;
  participants: number;
  txBurn: string;
  prizes: Prize[];
  poolMovements: PoolMove[];
};

const PAST_EVENTS: EventData[] = [
  {
    id: 6,
    label: "Junio 2025",
    date: "2025-06-01",
    slpBurned: 620_000,
    axiesReleased: 180,
    totalRaised: 412,
    participants: 138,
    txBurn: "0xab12...fe34",
    prizes: [
      {
        rank: 1,
        item: "Land Mystic — Savannah #008",
        wallet: "ronin:0xAb3f...2Cd1",
        txHash: "0xbc23...de45",
        value: "$420 USD",
      },
      {
        rank: 2,
        item: "Axie Beast — Purity 6/6",
        wallet: "ronin:0xEf12...9Aa3",
        txHash: "0xcd34...ef56",
        value: "$85 USD",
      },
      {
        rank: 3,
        item: "Item Pack Épico x3",
        wallet: "ronin:0xGh56...3Bb7",
        txHash: "0xde45...fg67",
        value: "$35 USD",
      },
      {
        rank: 4,
        item: "SLP Drop — 50.000 SLP",
        wallet: "ronin:0xIj78...4Cc9",
        txHash: "0xef56...gh78",
        value: "$18 USD",
      },
    ],
    poolMovements: [
      {
        name: "Cámara de Recompensas",
        emoji: "⚔️",
        color: C.gold,
        usd: 103.0,
        detail:
          "4 premios entregados. Land Savannah, Beast Purity 6/6, Item Pack y SLP Drop.",
        txHash: "0xbc23...de45",
      },
      {
        name: "Cámara de Intercambio",
        emoji: "⚖️",
        color: C.crimson,
        usd: 103.0,
        detail:
          "180 Axies comprados al floor price de $0.57 USD. Todos liberados del ecosistema.",
        txHash: "0xcd34...ef56",
      },
      {
        name: "Altar de la Quema",
        emoji: "🔥",
        color: C.ember,
        usd: 103.0,
        detail:
          "620.000 SLP enviados a burn address. Transacción permanente e irreversible.",
        txHash: "0xab12...fe34",
      },
      {
        name: "Gremio de Forjadores",
        emoji: "🔩",
        color: C.slate,
        usd: 61.8,
        detail: "Servidor, dominio, gas fees y mantenimiento de contratos.",
        txHash: "0xef56...gh78",
      },
      {
        name: "Bóveda Anual",
        emoji: "🗝️",
        color: C.goldBrt,
        usd: 41.2,
        detail: "Acumulado total: $189.4 USD para el ritual de Diciembre 2025.",
        txHash: "0xfg67...hi89",
      },
    ],
  },
  {
    id: 5,
    label: "Mayo 2025",
    date: "2025-05-01",
    slpBurned: 540_000,
    axiesReleased: 160,
    totalRaised: 360,
    participants: 120,
    txBurn: "0xcc44...aa11",
    prizes: [
      {
        rank: 1,
        item: "Axie Mystic — Koi #1122",
        wallet: "ronin:0xBc45...3De2",
        txHash: "0xde56...ef67",
        value: "$380 USD",
      },
      {
        rank: 2,
        item: "Land Savannah Standard #445",
        wallet: "ronin:0xFg23...7Gh4",
        txHash: "0xef67...fg78",
        value: "$60 USD",
      },
      {
        rank: 3,
        item: "SLP Drop — 30.000 SLP",
        wallet: "ronin:0xHi34...8Ij5",
        txHash: "0xfg78...gh89",
        value: "$11 USD",
      },
    ],
    poolMovements: [
      {
        name: "Cámara de Recompensas",
        emoji: "⚔️",
        color: C.gold,
        usd: 90.0,
        detail:
          "3 premios entregados. Axie Mystic Koi, Land Standard y SLP Drop.",
        txHash: "0xde56...ef67",
      },
      {
        name: "Cámara de Intercambio",
        emoji: "⚖️",
        color: C.crimson,
        usd: 90.0,
        detail: "160 Axies comprados al floor price de $0.56 USD.",
        txHash: "0xef67...fg78",
      },
      {
        name: "Altar de la Quema",
        emoji: "🔥",
        color: C.ember,
        usd: 90.0,
        detail: "540.000 SLP enviados a burn address en Ronin.",
        txHash: "0xcc44...aa11",
      },
      {
        name: "Gremio de Forjadores",
        emoji: "🔩",
        color: C.slate,
        usd: 54.0,
        detail: "Operaciones y mantenimiento.",
        txHash: "0xfg78...gh89",
      },
      {
        name: "Bóveda Anual",
        emoji: "🗝️",
        color: C.goldBrt,
        usd: 36.0,
        detail: "Acumulado total antes de este evento: $148.2 USD.",
        txHash: "0xgh89...hi90",
      },
    ],
  },
  {
    id: 4,
    label: "Abril 2025",
    date: "2025-04-01",
    slpBurned: 490_000,
    axiesReleased: 142,
    totalRaised: 327,
    participants: 109,
    txBurn: "0xdd99...bb22",
    prizes: [
      {
        rank: 1,
        item: "Item: Espada Legendaria",
        wallet: "ronin:0xCd56...4Ef3",
        txHash: "0xef78...fg89",
        value: "$310 USD",
      },
      {
        rank: 2,
        item: "Axie Plant — Purity 5/6",
        wallet: "ronin:0xGh67...5Hi6",
        txHash: "0xfg89...gh90",
        value: "$55 USD",
      },
      {
        rank: 3,
        item: "SLP Drop — 20.000 SLP",
        wallet: "ronin:0xIj78...6Jk7",
        txHash: "0xgh90...hi01",
        value: "$7 USD",
      },
    ],
    poolMovements: [
      {
        name: "Cámara de Recompensas",
        emoji: "⚔️",
        color: C.gold,
        usd: 81.75,
        detail: "3 premios: Espada Legendaria, Plant Purity 5/6, SLP Drop.",
        txHash: "0xef78...fg89",
      },
      {
        name: "Cámara de Intercambio",
        emoji: "⚖️",
        color: C.crimson,
        usd: 81.75,
        detail: "142 Axies comprados al floor price.",
        txHash: "0xfg89...gh90",
      },
      {
        name: "Altar de la Quema",
        emoji: "🔥",
        color: C.ember,
        usd: 81.75,
        detail: "490.000 SLP enviados a burn address.",
        txHash: "0xdd99...bb22",
      },
      {
        name: "Gremio de Forjadores",
        emoji: "🔩",
        color: C.slate,
        usd: 49.05,
        detail: "Operaciones y mantenimiento.",
        txHash: "0xgh90...hi01",
      },
      {
        name: "Bóveda Anual",
        emoji: "🗝️",
        color: C.goldBrt,
        usd: 32.7,
        detail: "Acumulado total: $112.2 USD.",
        txHash: "0xhi01...ij12",
      },
    ],
  },
  {
    id: 3,
    label: "Marzo 2025",
    date: "2025-03-01",
    slpBurned: 430_000,
    axiesReleased: 125,
    totalRaised: 287,
    participants: 96,
    txBurn: "0xee77...cc33",
    prizes: [
      {
        rank: 1,
        item: "Axie Mystic — Fishball #455",
        wallet: "ronin:0xDe67...5Fg4",
        txHash: "0xfg90...gh01",
        value: "$270 USD",
      },
      {
        rank: 2,
        item: "SLP Drop — 15.000 SLP",
        wallet: "ronin:0xHi78...6Ij7",
        txHash: "0xgh01...hi12",
        value: "$5 USD",
      },
    ],
    poolMovements: [
      {
        name: "Cámara de Recompensas",
        emoji: "⚔️",
        color: C.gold,
        usd: 71.75,
        detail: "2 premios: Axie Fishball Mystic y SLP Drop.",
        txHash: "0xfg90...gh01",
      },
      {
        name: "Cámara de Intercambio",
        emoji: "⚖️",
        color: C.crimson,
        usd: 71.75,
        detail: "125 Axies comprados al floor price.",
        txHash: "0xgh01...hi12",
      },
      {
        name: "Altar de la Quema",
        emoji: "🔥",
        color: C.ember,
        usd: 71.75,
        detail: "430.000 SLP enviados a burn address.",
        txHash: "0xee77...cc33",
      },
      {
        name: "Gremio de Forjadores",
        emoji: "🔩",
        color: C.slate,
        usd: 43.05,
        detail: "Operaciones.",
        txHash: "0xhi12...ij23",
      },
      {
        name: "Bóveda Anual",
        emoji: "🗝️",
        color: C.goldBrt,
        usd: 28.7,
        detail: "Acumulado total: $79.5 USD.",
        txHash: "0xij23...jk34",
      },
    ],
  },
  {
    id: 2,
    label: "Febrero 2025",
    date: "2025-02-01",
    slpBurned: 267_500,
    axiesReleased: 116,
    totalRaised: 178,
    participants: 59,
    txBurn: "0xff55...dd44",
    prizes: [
      {
        rank: 1,
        item: "Pack de Items Raros x5",
        wallet: "ronin:0xEf78...6Gh5",
        txHash: "0xgh12...hi23",
        value: "$155 USD",
      },
      {
        rank: 2,
        item: "SLP Drop — 10.000 SLP",
        wallet: "ronin:0xIj89...7Jk8",
        txHash: "0xhi23...ij34",
        value: "$4 USD",
      },
    ],
    poolMovements: [
      {
        name: "Cámara de Recompensas",
        emoji: "⚔️",
        color: C.gold,
        usd: 44.5,
        detail: "2 premios: Items Raros x5 y SLP Drop.",
        txHash: "0xgh12...hi23",
      },
      {
        name: "Cámara de Intercambio",
        emoji: "⚖️",
        color: C.crimson,
        usd: 44.5,
        detail: "116 Axies comprados al floor price.",
        txHash: "0xhi23...ij34",
      },
      {
        name: "Altar de la Quema",
        emoji: "🔥",
        color: C.ember,
        usd: 44.5,
        detail: "267.500 SLP enviados a burn address.",
        txHash: "0xff55...dd44",
      },
      {
        name: "Gremio de Forjadores",
        emoji: "🔩",
        color: C.slate,
        usd: 26.7,
        detail: "Operaciones.",
        txHash: "0xij34...jk45",
      },
      {
        name: "Bóveda Anual",
        emoji: "🗝️",
        color: C.goldBrt,
        usd: 17.8,
        detail: "Acumulado total: $50.8 USD.",
        txHash: "0xjk45...kl56",
      },
    ],
  },
  {
    id: 1,
    label: "Enero 2025 — Primer Ritual",
    date: "2025-01-01",
    slpBurned: 500_000,
    axiesReleased: 120,
    totalRaised: 333,
    participants: 111,
    txBurn: "0x8a3f...4b2c",
    prizes: [
      {
        rank: 1,
        item: "Mystic Axie — Aquatic #1234",
        wallet: "ronin:0xFg89...7Hi6",
        txHash: "0xhi34...ij45",
        value: "$300 USD",
      },
      {
        rank: 2,
        item: "Land Savannah Standard #112",
        wallet: "ronin:0xJk90...8Kl9",
        txHash: "0xij45...jk56",
        value: "$55 USD",
      },
      {
        rank: 3,
        item: "Item: Escudo Raro",
        wallet: "ronin:0xLm01...9Mn0",
        txHash: "0xjk56...kl67",
        value: "$20 USD",
      },
      {
        rank: 4,
        item: "SLP Drop — 25.000 SLP",
        wallet: "ronin:0xNo12...0Op1",
        txHash: "0xkl67...lm78",
        value: "$9 USD",
      },
    ],
    poolMovements: [
      {
        name: "Cámara de Recompensas",
        emoji: "⚔️",
        color: C.gold,
        usd: 83.25,
        detail:
          "4 premios: Mystic Axie, Land, Escudo y SLP Drop. Primer ritual.",
        txHash: "0xhi34...ij45",
      },
      {
        name: "Cámara de Intercambio",
        emoji: "⚖️",
        color: C.crimson,
        usd: 83.25,
        detail: "120 Axies comprados al floor price de $0.69 USD.",
        txHash: "0xij45...jk56",
      },
      {
        name: "Altar de la Quema",
        emoji: "🔥",
        color: C.ember,
        usd: 83.25,
        detail:
          "500.000 SLP enviados a burn address. Primera quema del proyecto.",
        txHash: "0x8a3f...4b2c",
      },
      {
        name: "Gremio de Forjadores",
        emoji: "🔩",
        color: C.slate,
        usd: 49.95,
        detail: "Setup inicial, deploy de contratos y operaciones.",
        txHash: "0xkl67...lm78",
      },
      {
        name: "Bóveda Anual",
        emoji: "🗝️",
        color: C.goldBrt,
        usd: 33.3,
        detail: "Primera contribución al ritual anual de Diciembre.",
        txHash: "0xlm78...mn89",
      },
    ],
  },
];

const GLOBAL_STATS = {
  totalSlpBurned: PAST_EVENTS.reduce((a, e) => a + e.slpBurned, 0),
  totalAxiesReleased: PAST_EVENTS.reduce((a, e) => a + e.axiesReleased, 0),
  totalEvents: PAST_EVENTS.length,
};

const HOW_IT_WORKS = [
  {
    id: 1,
    icon: "🎟️",
    title: "I. ADQUIRÍS EL SELLO",
    body: "Ventana de 72 hs al inicio de cada mes. Pagás 3 USD en SLP. El sello (ticket) es un NFT en tu wallet Ronin.",
  },
  {
    id: 2,
    icon: "⚖️",
    title: "II. LOS FONDOS SE DIVIDEN",
    body: "El contrato inteligente distribuye cada compra en los 5 fondos automáticamente. Todo verificable on-chain.",
  },
  {
    id: 3,
    icon: "📜",
    title: "III. SE DESBLOQUEAN RITUALES",
    body: "A medida que la comunidad aporta, se desbloquean hitos. El sistema adquiere premios automáticamente.",
  },
  {
    id: 4,
    icon: "🔥",
    title: "IV. EL ALTAR CONSUME",
    body: "El SLP es enviado al altar de quema permanente. Los Axies del intercambio son liberados del ecosistema.",
  },
  {
    id: 5,
    icon: "🗝️",
    title: "V. LA LLAVE LEGENDARIA",
    body: "12 sellos del año desbloquean la Llave Anual. Acceso al gran ritual de Diciembre con premios de alto valor.",
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

// Genera HTML para TradingView widget centrado en la fecha del evento
function chartHtml(eventDate: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; }
  .label {
    color: #CC0000;
    font-family: monospace;
    font-size: 11px;
    text-align: center;
    padding: 6px 0 2px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .sublabel {
    color: #550000;
    font-family: monospace;
    font-size: 9px;
    text-align: center;
    padding: 0 0 4px;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
<p class="label">⬡ PRECIO SLP/USD — PERÍODO DEL EVENTO ⬡</p>
<p class="sublabel">Fuente: TradingView — BINANCE:SLPUSDT</p>
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" async>
  {
    "symbol": "BINANCE:SLPUSDT",
    "width": "100%",
    "height": 200,
    "locale": "es",
    "dateRange": "3M",
    "colorTheme": "dark",
    "isTransparent": true,
    "autosize": false,
    "largeChartUrl": "https://coinmarketcap.com/currencies/smooth-love-potion/"
  }
  </script>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// POOL CARD — estética arcana
// ─────────────────────────────────────────────
function PoolCard({
  pool,
  width: cardWidth,
}: {
  pool: (typeof POOLS)[0];
  width: number;
}) {
  return (
    <ArcaneCard
      style={{ width: cardWidth, marginBottom: 10 }}
      accentColor={pool.color}
    >
      <View style={pl.topRow}>
        <View
          style={[
            pl.iconBg,
            { backgroundColor: pool.dimColor, borderColor: pool.color + "44" },
          ]}
        >
          <ThemedText style={pl.icon}>{pool.emoji}</ThemedText>
        </View>
        <View style={[pl.badge, { borderColor: pool.color + "80" }]}>
          <ThemedText style={[pl.badgeText, { color: pool.color }]}>
            {pool.pct}%
          </ThemedText>
        </View>
      </View>
      <ThemedText style={[pl.name, { color: pool.color }]}>
        {pool.name}
      </ThemedText>
      <ThemedText style={pl.desc}>{pool.description}</ThemedText>
      <View style={[pl.barBg]}>
        <View
          style={[
            pl.barFill,
            { width: `${pool.pct * 2}%` as any, backgroundColor: pool.color },
          ]}
        />
      </View>
      <View style={pl.balRow}>
        <ThemedText style={pl.balLabel}>ACUMULADO EN FONDO</ThemedText>
        <ThemedText style={[pl.balVal, { color: pool.color }]}>
          ${pool.balance.toFixed(0)} USD
        </ThemedText>
      </View>
    </ArcaneCard>
  );
}
const pl = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 16 },
  badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontWeight: "700", fontSize: 11, letterSpacing: 1 },
  name: {
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  desc: { color: C.slate, fontSize: 11, lineHeight: 16, marginBottom: 12 },
  barBg: { height: 3, backgroundColor: C.border, marginBottom: 8 },
  barFill: { height: "100%" },
  balRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balLabel: { color: C.slate, fontSize: 8, letterSpacing: 1.5 },
  balVal: { fontWeight: "800", fontSize: 13 },
});

// ─────────────────────────────────────────────
// POOL CAROUSEL (mobile)
// ─────────────────────────────────────────────
function PoolCarousel({ cardW }: { cardW: number }) {
  const GAP = 12;
  const scrollRef = useRef<ScrollView>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTo = useCallback(
    (idx: number) => {
      scrollRef.current?.scrollTo({ x: idx * (cardW + GAP), animated: true });
    },
    [cardW],
  );

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % POOLS.length;
        scrollTo(next);
        return next;
      });
    }, 3500);
  }, [scrollTo]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (cardW + GAP));
    setActiveIdx(idx);
    resetTimer();
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, gap: GAP }}
        onMomentumScrollEnd={onScrollEnd}
      >
        {POOLS.map((p) => (
          <PoolCard key={p.id} pool={p} width={cardW} />
        ))}
      </ScrollView>
      <View style={car.dots}>
        {POOLS.map((p, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              scrollTo(i);
              setActiveIdx(i);
              resetTimer();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <View
              style={[
                car.dot,
                i === activeIdx
                  ? { backgroundColor: POOLS[i].color, width: 18 }
                  : { backgroundColor: C.borderMid, width: 5 },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const car = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: { height: 3 },
});

// Pool Grid (web)
function PoolGrid({ hPad }: { hPad: number }) {
  const { width } = useWindowDimensions();
  const cardW = (width - hPad * 2 - 12) / 2;
  return (
    <View style={{ paddingHorizontal: hPad }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {POOLS.map((p) => (
          <PoolCard key={p.id} pool={p} width={cardW} />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// ACCORDION
// ─────────────────────────────────────────────
function Accordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={ac.header}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        <ThemedText style={ac.title}>{title}</ThemedText>
        <ThemedText style={[ac.chevron, { color: C.crimson }]}>
          {open ? "▲" : "▼"}
        </ThemedText>
      </TouchableOpacity>
      {open && <View style={ac.body}>{children}</View>}
    </>
  );
}
const ac = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
  },
  title: {
    color: C.parchment,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.8,
  },
  chevron: { fontSize: 10 },
  body: { paddingTop: 14 },
});

// ─────────────────────────────────────────────
// EVENT ROW
// ─────────────────────────────────────────────
function EventRow({
  event,
  onPress,
}: {
  event: EventData;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <ArcaneCard style={{ marginBottom: 8 }} accentColor={C.crimson}>
        <View style={er.header}>
          <HexSeal size={20} color={C.crimson} />
          <ThemedText style={er.label}>{event.label}</ThemedText>
          <IconSymbol name="chevron.right" size={12} color={C.crimson} />
        </View>
        <View style={er.pills}>
          <View
            style={[
              er.pill,
              { backgroundColor: C.emberDim, borderColor: C.ember },
            ]}
          >
            <ThemedText style={[er.pt, { color: C.ember }]}>
              🔥 {fmt(event.slpBurned)} SLP
            </ThemedText>
          </View>
          <View
            style={[
              er.pill,
              { backgroundColor: C.crimsonGlow, borderColor: C.crimson },
            ]}
          >
            <ThemedText style={[er.pt, { color: C.crimson }]}>
              ⚡ {event.axiesReleased} AXIES
            </ThemedText>
          </View>
          <View
            style={[
              er.pill,
              { backgroundColor: C.goldDim, borderColor: C.gold },
            ]}
          >
            <ThemedText style={[er.pt, { color: C.goldBrt }]}>
              ⚔️ {event.prizes.length} PREMIOS
            </ThemedText>
          </View>
        </View>
      </ArcaneCard>
    </TouchableOpacity>
  );
}
const er = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    flex: 1,
    color: C.parchment,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  pt: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
});

// ─────────────────────────────────────────────
// EVENT MODAL — con tabs y chart TradingView
// ─────────────────────────────────────────────
type ModalTab = "resumen" | "premios" | "pools" | "chart";

function EventModal({
  event,
  visible,
  onClose,
}: {
  event: EventData | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ModalTab>("resumen");
  useEffect(() => {
    if (visible) setTab("resumen");
  }, [visible]);
  if (!event) return null;

  const tabs: { key: ModalTab; label: string }[] = [
    { key: "resumen", label: "ACTAS" },
    { key: "premios", label: "PREMIOS" },
    { key: "pools", label: "FONDOS" },
    { key: "chart", label: "GRÁFICO" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={mo.overlay} onPress={onClose}>
        <Pressable style={mo.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle + Header */}
          <View style={mo.handle} />
          <View style={mo.headerRow}>
            <HexSeal size={22} color={C.crimson} />
            <View style={{ flex: 1 }}>
              <ThemedText style={mo.title}>REGISTRO #{event.id}</ThemedText>
              <ThemedText style={mo.sub}>
                {event.label.toUpperCase()}
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ThemedText
                style={{ color: C.crimson, fontSize: 16, fontWeight: "900" }}
              >
                ✕
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 2 }}
          >
            <View style={mo.tabs}>
              {tabs.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[mo.tabBtn, tab === t.key && mo.tabBtnActive]}
                  onPress={() => setTab(t.key)}
                >
                  <ThemedText
                    style={[mo.tabTxt, tab === t.key && mo.tabTxtActive]}
                  >
                    {t.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Tab content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 380 }}
          >
            {/* ── ACTAS / RESUMEN ── */}
            {tab === "resumen" && (
              <View style={{ paddingTop: 12 }}>
                <View style={mo.grid}>
                  {[
                    {
                      val: `🔥 ${fmt(event.slpBurned)}`,
                      key: "SLP QUEMADO",
                      color: C.ember,
                    },
                    {
                      val: `⚡ ${event.axiesReleased}`,
                      key: "AXIES LIBERADOS",
                      color: C.crimson,
                    },
                    {
                      val: `💵 $${event.totalRaised}`,
                      key: "USD RECAUDADOS",
                      color: C.goldBrt,
                    },
                    {
                      val: `👥 ${event.participants}`,
                      key: "PARTICIPANTES",
                      color: C.slate,
                    },
                  ].map((s) => (
                    <ArcaneCard
                      key={s.key}
                      style={{ width: "47%" }}
                      accentColor={s.color}
                      elevated
                    >
                      <ThemedText style={[mo.statVal, { color: s.color }]}>
                        {s.val}
                      </ThemedText>
                      <ThemedText style={mo.statKey}>{s.key}</ThemedText>
                    </ArcaneCard>
                  ))}
                </View>
                <View style={mo.txBox}>
                  <ThemedText style={mo.txLabel}>TX QUEMA ON-CHAIN</ThemedText>
                  <ThemedText style={mo.txVal}>{event.txBurn}</ThemedText>
                </View>
              </View>
            )}

            {/* ── PREMIOS ── */}
            {tab === "premios" && (
              <View style={{ paddingTop: 12 }}>
                <ThemedText style={mo.tabNote}>
                  Cada entrega es verificable on-chain. El hash de transacción
                  certifica la transferencia a la wallet ganadora.
                </ThemedText>
                {event.prizes.map((p) => (
                  <ArcaneCard
                    key={p.rank}
                    style={{ marginBottom: 8 }}
                    accentColor={p.rank === 1 ? C.goldBrt : C.borderMid}
                    elevated
                  >
                    <View style={mo.prizeHeader}>
                      <View
                        style={[
                          mo.rankBox,
                          { borderColor: p.rank === 1 ? C.goldBrt : C.slate },
                        ]}
                      >
                        <ThemedText
                          style={[
                            mo.rankTxt,
                            { color: p.rank === 1 ? C.goldBrt : C.slate },
                          ]}
                        >
                          #{p.rank}
                        </ThemedText>
                      </View>
                      <ThemedText style={mo.prizeItem}>{p.item}</ThemedText>
                      <ThemedText
                        style={[
                          mo.prizeValue,
                          { color: p.rank === 1 ? C.goldBrt : C.crimson },
                        ]}
                      >
                        {p.value}
                      </ThemedText>
                    </View>
                    <ThemedText style={mo.walletLine}>
                      WALLET:{" "}
                      <ThemedText style={mo.walletAddr}>
                        {p.wallet.replace("ronin:", "")}
                      </ThemedText>
                    </ThemedText>
                    <ThemedText style={mo.walletLine}>
                      TX:{" "}
                      <ThemedText style={mo.txInline}>{p.txHash}</ThemedText>
                    </ThemedText>
                  </ArcaneCard>
                ))}
              </View>
            )}

            {/* ── FONDOS / POOLS ── */}
            {tab === "pools" && (
              <View style={{ paddingTop: 12 }}>
                <ThemedText style={mo.tabNote}>
                  Distribución de los ${event.totalRaised} USD recaudados. Cada
                  movimiento tiene su hash de transacción.
                </ThemedText>
                {event.poolMovements.map((pm) => (
                  <View
                    key={pm.name}
                    style={[mo.poolRow, { borderLeftColor: pm.color }]}
                  >
                    <View style={mo.poolRowTop}>
                      <ThemedText style={{ fontSize: 14 }}>
                        {pm.emoji}
                      </ThemedText>
                      <ThemedText style={[mo.poolRowName, { color: pm.color }]}>
                        {pm.name}
                      </ThemedText>
                      <ThemedText style={[mo.poolRowUsd, { color: pm.color }]}>
                        ${pm.usd.toFixed(2)}
                      </ThemedText>
                    </View>
                    <ThemedText style={mo.poolRowDetail}>
                      {pm.detail}
                    </ThemedText>
                    <ThemedText style={mo.walletLine}>
                      TX:{" "}
                      <ThemedText style={mo.txInline}>{pm.txHash}</ThemedText>
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* ── GRÁFICO ── */}
            {tab === "chart" && (
              <View style={{ paddingTop: 12 }}>
                <ThemedText style={mo.tabNote}>
                  Precio del SLP/USD durante el período del evento. Observá el
                  impacto de la quema en el mercado.
                </ThemedText>
                <View style={mo.chartContainer}>
                  <WebView
                    source={{ html: chartHtml(event.date) }}
                    style={mo.webview}
                    scrollEnabled={false}
                    javaScriptEnabled
                    domStorageEnabled
                    backgroundColor="#000000"
                  />
                </View>
                <TouchableOpacity
                  style={mo.chartLink}
                  onPress={() =>
                    Linking.openURL(
                      "https://coinmarketcap.com/currencies/smooth-love-potion/",
                    )
                  }
                >
                  <ThemedText style={mo.chartLinkTxt}>
                    ⬡ VER HISTÓRICO COMPLETO EN COINMARKETCAP →
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const mo = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000bb",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.crimson + "60",
    padding: 18,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
  },
  handle: {
    width: 32,
    height: 2,
    backgroundColor: C.crimson,
    alignSelf: "center",
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  title: {
    color: C.crimson,
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 2,
  },
  sub: { color: C.slate, fontSize: 10, letterSpacing: 1.5, marginTop: 2 },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 4 },
  tabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.borderMid,
    backgroundColor: C.surface,
  },
  tabBtnActive: { borderColor: C.crimson, backgroundColor: C.crimsonGlow },
  tabTxt: {
    color: C.slate,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  tabTxtActive: { color: C.crimson },
  tabNote: {
    color: C.slate,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 12,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: C.borderMid,
    backgroundColor: C.surface2,
  },
  // Resumen
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  statVal: {
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  statKey: { color: C.slate, fontSize: 9, letterSpacing: 2 },
  txBox: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
  },
  txLabel: {
    color: C.borderMid,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 4,
  },
  txVal: { color: C.crimson, fontSize: 11, fontFamily: "monospace" },
  // Premios
  prizeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  rankBox: {
    width: 26,
    height: 26,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rankTxt: { fontWeight: "900", fontSize: 12 },
  prizeItem: { flex: 1, color: C.parchment, fontSize: 12, fontWeight: "700" },
  prizeValue: { fontWeight: "900", fontSize: 12 },
  walletLine: {
    color: C.slate,
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  walletAddr: { color: C.crimson, fontFamily: "monospace" },
  txInline: { color: C.ember, fontFamily: "monospace" },
  // Pools
  poolRow: { borderLeftWidth: 2, paddingLeft: 12, marginBottom: 14 },
  poolRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  poolRowName: { flex: 1, fontWeight: "700", fontSize: 11, letterSpacing: 1 },
  poolRowUsd: { fontWeight: "900", fontSize: 14 },
  poolRowDetail: {
    color: C.slate,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 3,
  },
  // Chart
  chartContainer: {
    height: 240,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  webview: { flex: 1, backgroundColor: "#000" },
  chartLink: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: C.crimson + "50",
    alignItems: "center",
  },
  chartLinkTxt: {
    color: C.crimson,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "700",
  },
});

// ─────────────────────────────────────────────
// LINK BUTTON
// ─────────────────────────────────────────────
function LinkButton({
  emoji,
  label,
  sub,
  url,
  highlight,
}: {
  emoji: string;
  label: string;
  sub: string;
  url: string;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(url)} activeOpacity={0.8}>
      <ArcaneCard
        style={{ marginBottom: 10 }}
        accentColor={highlight ? C.crimson : C.borderMid}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={[
              lk.iconBox,
              { borderColor: highlight ? C.crimson : C.borderMid },
            ]}
          >
            <ThemedText style={lk.emoji}>{emoji}</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[lk.label, highlight && { color: C.crimson }]}>
              {label}
            </ThemedText>
            <ThemedText style={lk.sub}>{sub}</ThemedText>
          </View>
          <ThemedText
            style={{ color: highlight ? C.crimson : C.slate, fontSize: 12 }}
          >
            ↗
          </ThemedText>
        </View>
      </ArcaneCard>
    </TouchableOpacity>
  );
}
const lk = StyleSheet.create({
  iconBox: {
    width: 36,
    height: 36,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: { fontSize: 16 },
  label: {
    color: C.parchment,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sub: { color: C.slate, fontSize: 11 },
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function HomeScreen() {
  const { isWide, hPad, cardW } = useLayout();
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);

  function openEvent(e: EventData) {
    setSelectedEvent(e);
    setModalVisible(true);
  }
  const eventsToShow = showAll ? PAST_EVENTS : PAST_EVENTS.slice(0, 3);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={s.bannerWrap}>
          <Image source={AxiesGif} style={s.banner} resizeMode="contain" />
          {/* Viñeta roja en bordes */}
          <View style={s.vignetteLeft} pointerEvents="none" />
          <View style={s.vignetteRight} pointerEvents="none" />
          <View style={s.vignetteBtm} pointerEvents="none" />
          {/* Badge evento activo */}
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <ThemedText style={s.liveTxt}>RITUAL ACTIVO</ThemedText>
          </View>
        </View>

        <View style={[s.padded, { paddingHorizontal: hPad }]}>
          {/* Título con sello de salomón */}
          <View style={s.titleRow}>
            <HexSeal size={28} color={C.crimson} />
            <View>
              <ThemedText style={s.heroTitle}>EVENTO DE QUEMA</ThemedText>
              <ThemedText style={s.heroTitleRed}>DE SLP</ThemedText>
            </View>
            <HexSeal size={28} color={C.crimson} />
          </View>
          <ThemedText style={s.heroSub}>
            Mecanismo deflacionario mensual para el ecosistema de Axie Infinity.
            Quemamos SLP y liberamos Axies de forma permanente, verificable e
            irreversible.
          </ThemedText>

          {/* ── STATS ── */}
          <RuneDivider label="Impacto del orden" />
          <View style={[s.statsRow, isWide && s.statsRowWide]}>
            {[
              {
                val: fmt(GLOBAL_STATS.totalSlpBurned),
                label: "SLP QUEMADOS",
                color: C.ember,
                emoji: "🔥",
              },
              {
                val: String(GLOBAL_STATS.totalAxiesReleased),
                label: "AXIES LIBERADOS",
                color: C.crimson,
                emoji: "⚡",
              },
              {
                val: String(GLOBAL_STATS.totalEvents),
                label: "RITUALES",
                color: C.goldBrt,
                emoji: "⬡",
              },
            ].map((stat) => (
              <ArcaneCard
                key={stat.label}
                style={{ flex: 1 }}
                accentColor={stat.color}
              >
                <ThemedText style={s.statEmoji}>{stat.emoji}</ThemedText>
                <ThemedText style={[s.statVal, { color: stat.color }]}>
                  {stat.val}
                </ThemedText>
                <ThemedText style={s.statLabel}>{stat.label}</ThemedText>
              </ArcaneCard>
            ))}
          </View>

          {/* Botón impacto CoinMarketCap */}
          <TouchableOpacity
            style={s.impactBtn}
            onPress={() =>
              Linking.openURL(
                "https://coinmarketcap.com/currencies/smooth-love-potion/",
              )
            }
            activeOpacity={0.8}
          >
            <ThemedText style={s.impactEmoji}>📈</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={s.impactLabel}>
                ¿Cómo impactamos en el SLP?
              </ThemedText>
              <ThemedText style={s.impactSub}>
                Ver el precio desde Enero 2025 en CoinMarketCap →
              </ThemedText>
            </View>
          </TouchableOpacity>

          {/* ── POOLS ── */}
          <RuneDivider label="Cámaras del tesoro" />
          <ThemedText style={s.caption}>
            Cada $3 USD se divide en 5 fondos automáticamente.{" "}
            {isWide
              ? "Cada cámara es verificable on-chain."
              : "Deslizá para explorar cada cámara."}
          </ThemedText>
        </View>

        {isWide ? <PoolGrid hPad={hPad} /> : <PoolCarousel cardW={cardW} />}

        <View
          style={{
            paddingHorizontal: hPad,
            alignItems: "center",
            marginTop: 10,
            marginBottom: 4,
          }}
        >
          <ThemedText
            style={{ color: C.borderMid, fontSize: 9, letterSpacing: 2 }}
          >
            ⬡ VERIFICABLE ON-CHAIN EN RONIN NETWORK ⬡
          </ThemedText>
        </View>

        <View style={[s.padded, { paddingHorizontal: hPad }]}>
          {/* ── CÓMO FUNCIONA ── */}
          <RuneDivider label="El ritual" />
          <Accordion title="VER LOS CINCO PASOS DEL SISTEMA">
            {HOW_IT_WORKS.map((step) => (
              <View key={step.id} style={s.step}>
                <ThemedText style={s.stepIcon}>{step.icon}</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText style={s.stepTitle}>{step.title}</ThemedText>
                  <ThemedText style={s.stepBody}>{step.body}</ThemedText>
                </View>
              </View>
            ))}
          </Accordion>

          {/* ── HISTORIAL ── */}
          <RuneDivider label="Crónica de rituales" />
          <ThemedText style={[s.caption, { marginBottom: 12 }]}>
            Cada registro incluye premios entregados, wallets ganadoras,
            movimiento de fondos y gráfico de precio SLP.
          </ThemedText>
          {eventsToShow.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onPress={() => openEvent(event)}
            />
          ))}
          <GothicExpandButton
            expanded={showAll}
            onPress={() => setShowAll(!showAll)}
            labelCollapsed={`VER TODOS LOS REGISTROS (${PAST_EVENTS.length})`}
            labelExpanded="CONTRAER REGISTROS"
          />

          {/* ── LINKS ── */}
          <RuneDivider label="Portales externos" />
          <LinkButton
            highlight
            emoji="🛒"
            label="Axie Marketplace"
            sub="Floor price actual de Axies"
            url="https://app.axieinfinity.com/marketplace/axies/?auctionTypes=Sale"
          />
          <LinkButton
            emoji="📊"
            label="SLP en CoinMarketCap"
            sub="Precio histórico del token SLP"
            url="https://coinmarketcap.com/currencies/smooth-love-potion/"
          />
        </View>

        {/* Footer decorativo */}
        <View style={s.footer}>
          <View style={s.footerLine} />
          <HexSeal size={20} color={C.borderMid} />
          <View style={s.footerLine} />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <EventModal
        event={selectedEvent}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// MAIN STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 60 },
  padded: {},

  // Banner
  bannerWrap: { width: "100%", position: "relative", backgroundColor: "#000" },
  banner: { width: "100%", height: 200 },
  vignetteLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 40,
    backgroundColor: C.bg,
  },
  vignetteRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 40,
    backgroundColor: C.bg,
  },
  vignetteBtm: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: C.bg + "dd",
  },
  liveBadge: {
    position: "absolute",
    top: 10,
    right: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.crimson,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  liveDot: { width: 5, height: 5, backgroundColor: C.crimsonBrt },
  liveTxt: {
    color: C.crimsonBrt,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // Título
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  heroTitle: {
    color: C.parchment,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
  },
  heroTitleRed: {
    color: C.crimson,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
  },
  heroSub: {
    color: C.slate,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 8 },
  statsRowWide: { gap: 14 },
  statEmoji: { fontSize: 18, marginBottom: 4, textAlign: "center" },
  statVal: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 3,
    textAlign: "center",
  },
  statLabel: {
    color: C.slate,
    fontSize: 8,
    textAlign: "center",
    letterSpacing: 2,
  },

  // Impact button
  impactBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.crimson + "50",
    padding: 12,
    borderStyle: "dashed",
  },
  impactEmoji: { fontSize: 24 },
  impactLabel: {
    color: C.parchment,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  impactSub: { color: C.crimson, fontSize: 11 },

  caption: {
    color: C.slate,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.3,
    marginBottom: 14,
  },

  // Steps
  step: { flexDirection: "row", gap: 10, marginBottom: 14 },
  stepIcon: { fontSize: 16, marginTop: 2 },
  stepTitle: {
    color: C.parchment,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 3,
    letterSpacing: 1,
  },
  stepBody: { color: C.slate, fontSize: 11, lineHeight: 17 },

  showMore: { alignItems: "center", paddingVertical: 14 },
  showMoreTxt: { color: C.borderMid, fontSize: 9, letterSpacing: 3 },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
  },
  footerLine: { flex: 1, height: 1, backgroundColor: C.border },
});
