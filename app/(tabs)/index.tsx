/**
 * Home Screen — Evento de Quema de SLP
 *
 * Estética: ARCADE CRIMSON SPACE — Wizardry / Tempest / Battlezone / dark fantasy sprites.
 * Paleta:   Negro absoluto + rojo láser carmesí + ámbar/oro arcade + parchment.
 * Look:     HUD de arcade, wireframes 3D rotando, sprites pixel-art via monospace,
 *           grid láser en perspectiva (líneas absolutas), scanlines y CRT vignette.
 *
 * NOTAS RN:
 *  - No usa react-native-svg ni canvas. Todo View + transform + Text monospace.
 *  - Compatible con Expo SDK 50+. Solo depende de react-native-webview (ya en el proyecto).
 *  - Mantengo toda la data del proyecto (POOLS, PAST_EVENTS, HOW_IT_WORKS).
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";

// ─────────────────────────────────────────────
// PALETA — ARCADE CRIMSON
// ─────────────────────────────────────────────
const C = {
  bg: "#000000",
  void: "#000000",
  surface: "#0b0000",
  surface2: "#130000",
  border: "#2a0000",
  borderMid: "#550000",
  laser: "#ff0033",
  laserDim: "#cc0022",
  laserGlow: "rgba(255,0,40,0.35)",
  crimson: "#ff0033",
  crimsonBrt: "#ff2244",
  crimsonGlow: "rgba(255,0,40,0.2)",
  ember: "#ff5a1f",
  emberDim: "rgba(255,90,31,0.2)",
  gold: "#ffb020",
  goldBrt: "#ffd24a",
  goldDim: "rgba(255,176,32,0.18)",
  slate: "#6a5050",
  parchment: "#e9d9c2",
};

// Monospace pixel-friendly font
const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
}) as string;

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
// CORNER BRACKETS
// ─────────────────────────────────────────────
function CornerBrackets({ color = C.laser, size = 10, thickness = 2 }) {
  const base = { position: "absolute" as const, width: size, height: size };
  return (
    <>
      <View
        style={[
          base,
          {
            top: -1,
            left: -1,
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
            top: -1,
            right: -1,
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
            bottom: -1,
            left: -1,
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
            bottom: -1,
            right: -1,
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
// ARCADE PANEL — el contenedor base
// ─────────────────────────────────────────────
function ArcadePanel({
  children,
  style,
  accent = C.laser,
  elevated = false,
}: {
  children: React.ReactNode;
  style?: object;
  accent?: string;
  elevated?: boolean;
}) {
  return (
    <View style={[ap.wrap, style]}>
      <View style={[ap.shadow, { borderColor: accent + "44" }]} />
      <View
        style={[
          ap.card,
          elevated && ap.elevated,
          { borderColor: accent + "66" },
        ]}
      >
        <CornerBrackets color={accent} size={10} thickness={2} />
        {children}
      </View>
    </View>
  );
}
const ap = StyleSheet.create({
  wrap: { position: "relative" },
  shadow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: "#000",
    borderWidth: 1,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    padding: 14,
    position: "relative",
  },
  elevated: { backgroundColor: C.surface2 },
});

// ─────────────────────────────────────────────
// WIREFRAME 3D SHAPES — solo View + transforms + rotación animada
// ─────────────────────────────────────────────
// Easing.linear / Easing.inOut(Easing.sine) can be missing on react-native-web.
// Resolve safely with fallbacks (t => t for linear).
const EASE_LINEAR =
  (Easing &&
    typeof (Easing as any).linear === "function" &&
    (Easing as any).linear) ||
  ((t: number) => t);
const EASE_INOUT_SINE = (() => {
  const E: any = Easing;
  if (E && typeof E.inOut === "function" && typeof E.sin === "function")
    return E.inOut(E.sin);
  if (E && typeof E.inOut === "function" && typeof E.sine === "function")
    return E.inOut(E.sine);
  if (E && typeof E.inOut === "function" && typeof E.ease === "function")
    return E.inOut(E.ease);
  return (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
})();

function useSpin(duration = 7000) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration,
        easing: EASE_LINEAR,
        useNativeDriver: true,
      }),
    ).start();
  }, [duration, v]);
  return v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
}

function useFloat(duration = 3500, range = 6) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: EASE_INOUT_SINE,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration,
          easing: EASE_INOUT_SINE,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [duration, v]);
  return v.interpolate({ inputRange: [0, 1], outputRange: [-range, range] });
}

function WireCube({ size = 48, style }: { size?: number; style?: object }) {
  const rot = useSpin(8000);
  const halfBox = {
    position: "absolute" as const,
    width: size * 0.7,
    height: size * 0.7,
    borderWidth: 1.5,
    borderColor: C.laser,
    backgroundColor: "rgba(255,0,40,0.05)",
  };
  return (
    <Animated.View
      style={[
        { width: size, height: size, transform: [{ rotate: rot }] },
        style,
      ]}
    >
      {/* Two squares offset for cube illusion */}
      <View style={[halfBox, { top: 0, left: 0 }]} />
      <View
        style={[
          halfBox,
          { top: size * 0.3, left: size * 0.3, borderColor: C.laserDim },
        ]}
      />
      {/* connecting diagonals */}
      <View
        style={{
          position: "absolute",
          top: size * 0.04,
          left: size * 0.04,
          width: size * 0.43,
          height: 1.2,
          backgroundColor: C.laser,
          transform: [{ rotate: "45deg" }, { translateX: size * 0.2 }],
        }}
      />
    </Animated.View>
  );
}

function WireDiamond({ size = 44, style }: { size?: number; style?: object }) {
  const rot = useSpin(6000);
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
          transform: [{ rotate: rot }],
        },
        style,
      ]}
    >
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderWidth: 1.5,
          borderColor: C.laser,
          transform: [{ rotate: "45deg" }],
          backgroundColor: "rgba(255,0,40,0.06)",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.4,
          height: size * 0.4,
          borderWidth: 1,
          borderColor: C.laserDim,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </Animated.View>
  );
}

function WireHex({ size = 50, style }: { size?: number; style?: object }) {
  // Approx hexagon with 3 rotated rectangles
  const rot = useSpin(9000);
  const bar = {
    position: "absolute" as const,
    width: size,
    height: size,
    borderWidth: 1.5,
    borderColor: C.laser,
    backgroundColor: "rgba(255,0,40,0.04)",
  };
  return (
    <Animated.View
      style={[
        { width: size, height: size, transform: [{ rotate: rot }] },
        style,
      ]}
    >
      <View
        style={[bar, { transform: [{ rotate: "0deg" }, { scale: 0.7 }] }]}
      />
      <View
        style={[bar, { transform: [{ rotate: "60deg" }, { scale: 0.7 }] }]}
      />
      <View
        style={[bar, { transform: [{ rotate: "-60deg" }, { scale: 0.7 }] }]}
      />
    </Animated.View>
  );
}

function WireRing({ size = 180, style }: { size?: number; style?: object }) {
  const rot = useSpin(20000);
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
          transform: [{ rotate: rot }],
        },
        style,
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: C.laser + "60",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.85,
          height: size * 0.85,
          borderRadius: size,
          borderWidth: 1,
          borderColor: C.laser,
          borderStyle: "dashed",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size,
          borderWidth: 1,
          borderColor: C.laserDim,
        }}
      />
      {/* Tick marks */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: 2,
            height: 10,
            backgroundColor: C.laser,
            transform: [
              { rotate: `${i * 45}deg` },
              { translateY: -size / 2 + 4 },
            ],
          }}
        />
      ))}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// FLOATING WRAPPER — animates Y bob
// ─────────────────────────────────────────────
function Floater({
  children,
  dur = 3500,
  range = 6,
  style,
}: {
  children: React.ReactNode;
  dur?: number;
  range?: number;
  style?: object;
}) {
  const ty = useFloat(dur, range);
  return (
    <Animated.View style={[{ transform: [{ translateY: ty }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// LASER GRID FLOOR — perspectiva con líneas absolutas
// ─────────────────────────────────────────────
function LaserGridFloor({
  height = 160,
  width,
}: {
  height?: number;
  width: number;
}) {
  const horizonY = 0;
  const rows = 9;
  return (
    <View
      style={{
        height,
        width,
        position: "absolute",
        bottom: 0,
        left: 0,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      {/* Sol carmesí en horizonte */}
      <View
        style={{
          position: "absolute",
          left: width / 2 - 120,
          top: -100,
          width: 240,
          height: 200,
          borderRadius: 120,
          backgroundColor: "#7a0010",
          opacity: 0.7,
        }}
      />
      {/* Horizontal receding lines */}
      {Array.from({ length: rows }).map((_, i) => {
        const k = (i + 1) / rows;
        const y = horizonY + Math.pow(k, 2.2) * height;
        return (
          <View
            key={`h${i}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y,
              height: 1.2,
              backgroundColor: C.laser,
              opacity: 0.25 + k * 0.6,
            }}
          />
        );
      })}
      {/* Vertical perspective lines */}
      {Array.from({ length: 21 }).map((_, i) => {
        const idx = i - 10;
        const offset = (idx / 10) * width * 1.4;
        const angle = Math.atan2(height, offset) * (180 / Math.PI) - 90;
        const len = Math.sqrt(height * height + offset * offset);
        return (
          <View
            key={`v${i}`}
            style={{
              position: "absolute",
              left: width / 2,
              top: 0,
              width: 1.2,
              height: len,
              backgroundColor: C.laser,
              opacity: 0.45,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: "top left" as any,
            }}
          />
        );
      })}
      {/* Top fade */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 18,
          backgroundColor: "#000",
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// SCANLINES OVERLAY
// ─────────────────────────────────────────────
function Scanlines({ style }: { style?: object }) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: "absolute", inset: 0 } as any, style]}
    >
      {Array.from({ length: 80 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: i * 4,
            height: 1,
            backgroundColor: "rgba(0,0,0,0.32)",
          }}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// PIXEL SPRITE — Text monospace tile-grid
// Cada char es un píxel. Espacio = vacío.
// ─────────────────────────────────────────────
const SPR_WIZARD = [
  "    ██    ",
  "   ████   ",
  "  ██▓▓██  ",
  " ██▓▓▓▓██ ",
  "██▓▓▓▓▓▓██",
  "██▓████▓██",
  " ██░░░░██ ",
  "  ██░░██  ",
  "  ██▒▒██  ",
  "   ████   ",
  "    ▓▓    ",
  "    ▓▓    ",
];

const SPR_SKULL = [
  " ████████ ",
  "██▓▓▓▓▓▓██",
  "█▓██▒▒██▓█",
  "█▓██▒▒██▓█",
  "█▓▓▓██▓▓▓█",
  "██▓▓▓▓▓▓██",
  " █▓██▓█▓█ ",
  "  ██  ██  ",
];

const SPR_POTION = [
  "  ████  ",
  "  ████  ",
  " ██▓▓██ ",
  "██▒▒▒▒██",
  "██▒██▒██",
  "██▒▒▒▒██",
  " ██▒▒██ ",
  "  ████  ",
];

function PixelSprite({
  grid,
  cell = 4,
  color = C.laser,
  accent = C.gold,
  style,
}: {
  grid: string[];
  cell?: number;
  color?: string;
  accent?: string;
  style?: object;
}) {
  return (
    <View style={[{ alignItems: "flex-start" }, style]}>
      {grid.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {[...row].map((ch, x) => {
            let bg = "transparent";
            if (ch === "█") bg = "#1a0000";
            else if (ch === "▓") bg = color;
            else if (ch === "▒") bg = accent;
            else if (ch === "░") bg = C.parchment;
            return (
              <View
                key={x}
                style={{ width: cell, height: cell, backgroundColor: bg }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// BLINK helper for "● REC" or cursor
// ─────────────────────────────────────────────
function Blink({
  children,
  style,
  dur = 1000,
}: {
  children: React.ReactNode;
  style?: object;
  dur?: number;
}) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 0.15,
          duration: dur / 2,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 1,
          duration: dur / 2,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [dur, v]);
  return (
    <Animated.View style={[{ opacity: v }, style]}>{children}</Animated.View>
  );
}

// ─────────────────────────────────────────────
// ARCADE BUTTON
// ─────────────────────────────────────────────
function ArcadeButton({
  label,
  sub,
  onPress,
  color = C.laser,
}: {
  label: string;
  sub?: string;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        ab.wrap,
        {
          borderColor: color,
          backgroundColor: pressed ? color + "33" : color + "1a",
        },
      ]}
    >
      <View style={[ab.inner, { borderColor: color + "88" }]}>
        <Text
          style={[ab.label, { color: C.parchment, textShadowColor: color }]}
        >
          ▶ {label}
        </Text>
        {sub && <Text style={[ab.sub, { color }]}>{sub}</Text>}
      </View>
      <CornerBrackets color={color} size={9} thickness={2} />
    </Pressable>
  );
}
const ab = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 14,
    position: "relative",
  },
  inner: { alignItems: "center", borderWidth: 0 },
  label: {
    fontFamily: MONO,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  sub: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 4,
  },
});

// ─────────────────────────────────────────────
// DIVIDER ARCADE
// ─────────────────────────────────────────────
function ArcadeDivider({ label }: { label: string }) {
  return (
    <View style={dv.wrap}>
      <View style={dv.line} />
      <Text style={dv.glyph}>◆</Text>
      <Text style={dv.label}>{label}</Text>
      <Text style={dv.glyph}>◆</Text>
      <View style={dv.line} />
    </View>
  );
}
const dv = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 22,
    paddingHorizontal: 4,
  },
  line: { flex: 1, height: 1, backgroundColor: C.laser, opacity: 0.5 },
  glyph: { color: C.laser, fontSize: 12 },
  label: {
    color: C.laser,
    fontSize: 13,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 3,
  },
});

// ─────────────────────────────────────────────
// SEGMENTED ARCADE BAR (Power Meter)
// ─────────────────────────────────────────────
function SegmentedBar({
  pct,
  segments = 22,
}: {
  pct: number;
  segments?: number;
}) {
  const filled = Math.floor((pct / 100) * segments);
  return (
    <View style={sb.wrap}>
      {Array.from({ length: segments }).map((_, i) => {
        const isFilled = i < filled;
        const isHot = i >= Math.floor(segments * 0.7);
        const bg = !isFilled ? "#1a0000" : isHot ? C.laser : "#aa0022";
        return <View key={i} style={[sb.seg, { backgroundColor: bg }]} />;
      })}
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 2,
    height: 20,
    backgroundColor: "#0a0000",
    padding: 2,
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  seg: { flex: 1, alignSelf: "stretch" },
});

// ─────────────────────────────────────────────
// DATA — POOLS / EVENTOS / HOW IT WORKS (intactos)
// ─────────────────────────────────────────────
const POOLS = [
  {
    id: 1,
    name: "CÁMARA DE RECOMPENSAS",
    glyph: "⚔",
    pct: 25,
    balance: 312.5,
    description:
      "Financia la adquisición de premios para los sorteos. Cada activo adquirido es registrado on-chain.",
    color: C.gold,
  },
  {
    id: 2,
    name: "CÁMARA DE INTERCAMBIO",
    glyph: "⚖",
    pct: 25,
    balance: 312.5,
    description:
      "Liquidez para comprar los Axies que los usuarios entreguen al floor price del marketplace.",
    color: C.laser,
  },
  {
    id: 3,
    name: "ALTAR DE LA QUEMA",
    glyph: "▲",
    pct: 25,
    balance: 312.5,
    description:
      "SLP enviado a la burn address. El ritual es irreversible y permanente en la red Ronin.",
    color: C.ember,
  },
  {
    id: 4,
    name: "GREMIO DE FORJADORES",
    glyph: "⚙",
    pct: 15,
    balance: 187.5,
    description:
      "Infraestructura, mantenimiento de contratos y desarrollo continuo de la plataforma.",
    color: "#9a8aa0",
  },
  {
    id: 5,
    name: "BÓVEDA ANUAL",
    glyph: "✦",
    pct: 10,
    balance: 125.0,
    description:
      "Se acumula durante el año. En diciembre financia el gran ritual legendario.",
    color: C.goldBrt,
  },
];

type Prize = {
  rank: number;
  item: string;
  wallet: string;
  txHash: string;
  value: string;
};
type PoolMove = {
  name: string;
  glyph: string;
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
        glyph: "⚔",
        color: C.gold,
        usd: 103.0,
        detail: "4 premios entregados.",
        txHash: "0xbc23...de45",
      },
      {
        name: "Cámara de Intercambio",
        glyph: "⚖",
        color: C.laser,
        usd: 103.0,
        detail: "180 Axies comprados al floor price.",
        txHash: "0xcd34...ef56",
      },
      {
        name: "Altar de la Quema",
        glyph: "▲",
        color: C.ember,
        usd: 103.0,
        detail: "620.000 SLP enviados a burn address.",
        txHash: "0xab12...fe34",
      },
      {
        name: "Gremio de Forjadores",
        glyph: "⚙",
        color: "#9a8aa0",
        usd: 61.8,
        detail: "Operaciones y mantenimiento.",
        txHash: "0xef56...gh78",
      },
      {
        name: "Bóveda Anual",
        glyph: "✦",
        color: C.goldBrt,
        usd: 41.2,
        detail: "Acumulado para Diciembre.",
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
        glyph: "⚔",
        color: C.gold,
        usd: 90,
        detail: "3 premios entregados.",
        txHash: "0xde56...ef67",
      },
      {
        name: "Cámara de Intercambio",
        glyph: "⚖",
        color: C.laser,
        usd: 90,
        detail: "160 Axies comprados al floor.",
        txHash: "0xef67...fg78",
      },
      {
        name: "Altar de la Quema",
        glyph: "▲",
        color: C.ember,
        usd: 90,
        detail: "540.000 SLP quemados.",
        txHash: "0xcc44...aa11",
      },
      {
        name: "Gremio de Forjadores",
        glyph: "⚙",
        color: "#9a8aa0",
        usd: 54,
        detail: "Mantenimiento.",
        txHash: "0xfg78...gh89",
      },
      {
        name: "Bóveda Anual",
        glyph: "✦",
        color: C.goldBrt,
        usd: 36,
        detail: "Acumulado anual.",
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
        glyph: "⚔",
        color: C.gold,
        usd: 81.75,
        detail: "3 premios entregados.",
        txHash: "0xef78...fg89",
      },
      {
        name: "Cámara de Intercambio",
        glyph: "⚖",
        color: C.laser,
        usd: 81.75,
        detail: "142 Axies al floor.",
        txHash: "0xfg89...gh90",
      },
      {
        name: "Altar de la Quema",
        glyph: "▲",
        color: C.ember,
        usd: 81.75,
        detail: "490.000 SLP quemados.",
        txHash: "0xdd99...bb22",
      },
      {
        name: "Gremio de Forjadores",
        glyph: "⚙",
        color: "#9a8aa0",
        usd: 49.05,
        detail: "Operaciones.",
        txHash: "0xgh90...hi01",
      },
      {
        name: "Bóveda Anual",
        glyph: "✦",
        color: C.goldBrt,
        usd: 32.7,
        detail: "Acumulado anual.",
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
        glyph: "⚔",
        color: C.gold,
        usd: 71.75,
        detail: "2 premios.",
        txHash: "0xfg90...gh01",
      },
      {
        name: "Cámara de Intercambio",
        glyph: "⚖",
        color: C.laser,
        usd: 71.75,
        detail: "125 Axies al floor.",
        txHash: "0xgh01...hi12",
      },
      {
        name: "Altar de la Quema",
        glyph: "▲",
        color: C.ember,
        usd: 71.75,
        detail: "430.000 SLP quemados.",
        txHash: "0xee77...cc33",
      },
      {
        name: "Gremio de Forjadores",
        glyph: "⚙",
        color: "#9a8aa0",
        usd: 43.05,
        detail: "Operaciones.",
        txHash: "0xhi12...ij23",
      },
      {
        name: "Bóveda Anual",
        glyph: "✦",
        color: C.goldBrt,
        usd: 28.7,
        detail: "Acumulado anual.",
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
        glyph: "⚔",
        color: C.gold,
        usd: 44.5,
        detail: "2 premios.",
        txHash: "0xgh12...hi23",
      },
      {
        name: "Cámara de Intercambio",
        glyph: "⚖",
        color: C.laser,
        usd: 44.5,
        detail: "116 Axies al floor.",
        txHash: "0xhi23...ij34",
      },
      {
        name: "Altar de la Quema",
        glyph: "▲",
        color: C.ember,
        usd: 44.5,
        detail: "267.500 SLP quemados.",
        txHash: "0xff55...dd44",
      },
      {
        name: "Gremio de Forjadores",
        glyph: "⚙",
        color: "#9a8aa0",
        usd: 26.7,
        detail: "Operaciones.",
        txHash: "0xij34...jk45",
      },
      {
        name: "Bóveda Anual",
        glyph: "✦",
        color: C.goldBrt,
        usd: 17.8,
        detail: "Acumulado anual.",
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
        glyph: "⚔",
        color: C.gold,
        usd: 83.25,
        detail: "4 premios. Primer ritual.",
        txHash: "0xhi34...ij45",
      },
      {
        name: "Cámara de Intercambio",
        glyph: "⚖",
        color: C.laser,
        usd: 83.25,
        detail: "120 Axies al floor.",
        txHash: "0xij45...jk56",
      },
      {
        name: "Altar de la Quema",
        glyph: "▲",
        color: C.ember,
        usd: 83.25,
        detail: "Primera quema del proyecto.",
        txHash: "0x8a3f...4b2c",
      },
      {
        name: "Gremio de Forjadores",
        glyph: "⚙",
        color: "#9a8aa0",
        usd: 49.95,
        detail: "Setup inicial.",
        txHash: "0xkl67...lm78",
      },
      {
        name: "Bóveda Anual",
        glyph: "✦",
        color: C.goldBrt,
        usd: 33.3,
        detail: "Primera contribución.",
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
    roman: "I",
    glyph: "✦",
    title: "ADQUIRÍS EL SELLO",
    body: "Ventana de 72 hs al inicio de cada mes. Pagás 3 USD en SLP. El sello es un NFT en tu wallet Ronin.",
  },
  {
    id: 2,
    roman: "II",
    glyph: "⚖",
    title: "LOS FONDOS SE BIFURCAN",
    body: "El contrato divide la compra en las 5 cámaras automáticamente. Todo verificable on-chain.",
  },
  {
    id: 3,
    roman: "III",
    glyph: "⛧",
    title: "SE DESBLOQUEAN RITUALES",
    body: "Cada hito comunitario activa la compra automática de un premio.",
  },
  {
    id: 4,
    roman: "IV",
    glyph: "▲",
    title: "EL ALTAR CONSUME",
    body: "El SLP es enviado al altar. Los Axies del intercambio son liberados para siempre.",
  },
  {
    id: 5,
    roman: "V",
    glyph: "✧",
    title: "LA LLAVE LEGENDARIA",
    body: "12 sellos del año desbloquean la Llave Anual y acceso al ritual de Diciembre.",
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

function chartHtml(_eventDate: string): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; font-family: monospace; }
  .label { color: #ff0033; font-size: 13px; text-align: center; padding: 8px 0 4px; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 6px #ff0033; }
  .sublabel { color: #550000; font-size: 11px; text-align: center; padding: 0 0 6px; letter-spacing: 1px; }
</style></head><body>
<p class="label">◆ PRECIO SLP/USD — RUN ACTIVO ◆</p>
<p class="sublabel">SOURCE: TRADINGVIEW · BINANCE:SLPUSDT</p>
<div class="tradingview-widget-container">
  <div class="tradingview-widget-container__widget"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" async>
  { "symbol":"BINANCE:SLPUSDT","width":"100%","height":200,"locale":"es","dateRange":"3M","colorTheme":"dark","isTransparent":true,"autosize":false }
  </script>
</div></body></html>`;
}

// ─────────────────────────────────────────────
// HERO — banner con HUD, wireframes flotando, grid láser y sprites
// ─────────────────────────────────────────────
function Hero() {
  const { width } = useWindowDimensions();
  return (
    <View style={hr.wrap}>
      {/* Cielo + sol */}
      <View style={hr.sky} />

      {/* Grid láser */}
      <LaserGridFloor height={150} width={width} />

      {/* Wireframes flotando */}
      <Floater style={hr.wf1} dur={4000}>
        <WireCube size={48} />
      </Floater>
      <Floater style={hr.wf2} dur={5200}>
        <WireHex size={56} />
      </Floater>
      <Floater style={hr.wf3} dur={3800}>
        <WireDiamond size={40} />
      </Floater>
      <Floater style={hr.wf4} dur={4400}>
        <WireDiamond size={34} />
      </Floater>

      {/* Anillo gigante detrás del título */}
      <View style={hr.ringWrap}>
        <WireRing size={210} />
      </View>

      {/* HUD superior */}
      <View style={hr.hud}>
        <Text style={hr.hudTxt}>
          HP <Text style={hr.hudVal}>████░</Text> 1P
        </Text>
        <Blink dur={1400}>
          <Text style={[hr.hudTxt, { color: C.laser }]}>● REC 00:43:12</Text>
        </Blink>
        <Text style={hr.hudTxt}>
          HISC <Text style={{ color: C.gold }}>2.392.500</Text>
        </Text>
      </View>

      {/* Insert coin */}
      <View style={hr.insertCoin}>
        <Text style={hr.insertTxt}>▼ INSERT COIN ▼</Text>
      </View>

      {/* Título */}
      <View style={hr.titleWrap}>
        <Text style={hr.title}>
          QUEMA <Text style={{ color: C.laser }}>DE</Text> SLP
        </Text>
        <Text style={hr.subtitle}>⛧ RITUAL · MMXXVI · STAGE 06 ⛧</Text>
      </View>

      {/* Sprites flanqueando */}
      <View style={hr.spriteL}>
        <PixelSprite grid={SPR_WIZARD} cell={4} />
      </View>
      <View style={hr.spriteR}>
        <PixelSprite grid={SPR_SKULL} cell={4} />
      </View>

      {/* Badge ritual activo */}
      <View style={hr.live}>
        <Blink dur={800}>
          <View style={hr.liveDot} />
        </Blink>
        <Text style={hr.liveTxt}>RITUAL ACTIVO — 47H 12M</Text>
      </View>
    </View>
  );
}
const hr = StyleSheet.create({
  wrap: {
    height: 360,
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    backgroundColor: C.void,
  },
  sky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#0a0000",
  },

  wf1: { position: "absolute", top: 70, left: 20 },
  wf2: { position: "absolute", top: 56, right: 22 },
  wf3: { position: "absolute", top: 130, right: 80 },
  wf4: { position: "absolute", bottom: 40, left: 50 },

  ringWrap: {
    position: "absolute",
    top: 75,
    left: "50%",
    marginLeft: -105,
    opacity: 0.85,
  },

  hud: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hudTxt: {
    fontFamily: MONO,
    fontSize: 13,
    color: C.laser,
    letterSpacing: 1.5,
    textShadowColor: C.laser,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  },
  hudVal: { color: C.parchment },

  insertCoin: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  insertTxt: {
    fontFamily: MONO,
    fontSize: 14,
    color: C.laser,
    letterSpacing: 5,
    textShadowColor: C.laser,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },

  titleWrap: {
    position: "absolute",
    top: 130,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: MONO,
    fontSize: 36,
    fontWeight: "900",
    color: C.parchment,
    letterSpacing: 4,
    textShadowColor: C.laser,
    textShadowRadius: 10,
    textShadowOffset: { width: 2, height: 2 },
    textAlign: "center",
  },
  subtitle: {
    fontFamily: MONO,
    fontSize: 15,
    color: C.laser,
    letterSpacing: 4,
    marginTop: 8,
    textShadowColor: C.laser,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  },

  spriteL: { position: "absolute", left: 16, bottom: 20 },
  spriteR: { position: "absolute", right: 16, bottom: 28 },

  live: {
    position: "absolute",
    bottom: 10,
    left: "50%",
    marginLeft: -100,
    width: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.laser,
  },
  liveDot: { width: 8, height: 8, backgroundColor: C.laser },
  liveTxt: {
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 2,
    color: C.laser,
    fontWeight: "900",
  },
});

// ─────────────────────────────────────────────
// COUNTDOWN PANEL
// ─────────────────────────────────────────────
function CountdownPanel({ onPress }: { onPress?: () => void }) {
  const cells = [
    { v: "47", l: "HRS" },
    { v: "12", l: "MIN" },
    { v: "08", l: "SEG" },
  ];
  return (
    <View style={cd.wrap}>
      <View style={cd.tagWrap}>
        <Text style={cd.tag}>⛧ STAGE 06 CIERRA EN</Text>
      </View>
      <View style={cd.row}>
        {cells.map((c, i) => (
          <React.Fragment key={i}>
            <View style={cd.cell}>
              <Text style={cd.digit}>{c.v}</Text>
              <Text style={cd.unit}>{c.l}</Text>
            </View>
            {i < 2 && (
              <Blink dur={1000}>
                <Text style={cd.colon}>:</Text>
              </Blink>
            )}
          </React.Fragment>
        ))}
      </View>
      <View style={{ marginTop: 14 }}>
        <ArcadeButton
          label="PRESS START"
          sub="ADQUIRIR SELLO · $3 USD"
          onPress={onPress}
        />
      </View>
      <Text style={cd.foot}>
        payload: <Text style={{ color: C.ember }}>1.428 SLP</Text> · network:{" "}
        <Text style={{ color: C.laser }}>RONIN</Text>
      </Text>
      <CornerBrackets color={C.laser} size={11} thickness={2} />
    </View>
  );
}
const cd = StyleSheet.create({
  wrap: {
    marginHorizontal: 14,
    marginTop: 18,
    padding: 16,
    paddingTop: 22,
    backgroundColor: "#160000",
    borderWidth: 1,
    borderColor: C.laser,
    position: "relative",
  },
  tagWrap: {
    position: "absolute",
    top: -10,
    left: 16,
    paddingHorizontal: 8,
    backgroundColor: C.void,
  },
  tag: {
    fontFamily: MONO,
    fontSize: 13,
    color: C.laser,
    letterSpacing: 3,
    fontWeight: "900",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
  },
  cell: { alignItems: "center" },
  digit: {
    fontFamily: MONO,
    fontSize: 52,
    fontWeight: "900",
    color: C.parchment,
    letterSpacing: 3,
    lineHeight: 56,
    textShadowColor: C.laser,
    textShadowRadius: 12,
    textShadowOffset: { width: 3, height: 3 },
  },
  unit: {
    fontFamily: MONO,
    fontSize: 13,
    color: C.laser,
    letterSpacing: 3,
    marginTop: 4,
  },
  colon: {
    fontFamily: MONO,
    fontSize: 44,
    color: C.laser,
    fontWeight: "900",
    marginTop: 2,
  },
  foot: {
    fontFamily: MONO,
    fontSize: 12,
    color: C.slate,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 8,
  },
});

// ─────────────────────────────────────────────
// STATS ROW — tres tiles arcade
// ─────────────────────────────────────────────
function StatsRow() {
  const stats = [
    {
      val: fmt(GLOBAL_STATS.totalSlpBurned),
      k: "SLP\nQUEMADOS",
      color: C.ember,
      sprite: SPR_POTION,
    },
    {
      val: String(GLOBAL_STATS.totalAxiesReleased),
      k: "AXIES\nLIBERADOS",
      color: C.laser,
      sprite: SPR_SKULL,
    },
    {
      val: String(GLOBAL_STATS.totalEvents).padStart(2, "0"),
      k: "RITUALES\nCOMPLETOS",
      color: C.gold,
      sprite: SPR_WIZARD,
    },
  ];
  return (
    <View style={st.row}>
      {stats.map((s, i) => (
        <View key={i} style={[st.tile, { borderColor: s.color + "55" }]}>
          <CornerBrackets color={s.color} size={9} thickness={2} />
          <View style={st.spriteWrap}>
            <PixelSprite grid={s.sprite} cell={2.4 as any} color={s.color} />
          </View>
          <Text
            style={[st.val, { color: C.parchment, textShadowColor: s.color }]}
          >
            {s.val}
          </Text>
          <Text style={[st.lbl, { color: s.color }]}>{s.k}</Text>
        </View>
      ))}
    </View>
  );
}
const st = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, paddingHorizontal: 14, marginTop: 20 },
  tile: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    backgroundColor: "#0a0000",
    alignItems: "center",
    position: "relative",
  },
  spriteWrap: { height: 32, justifyContent: "flex-end", marginBottom: 6 },
  val: {
    fontFamily: MONO,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  lbl: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 14,
  },
});

// ─────────────────────────────────────────────
// POWER METER GLOBAL
// ─────────────────────────────────────────────
function PowerMeter() {
  return (
    <View style={pm.wrap}>
      <View style={pm.head}>
        <Text style={pm.label}>POWER METER</Text>
        <Text style={pm.val}>1.428 / 2.232 SLP</Text>
      </View>
      <SegmentedBar pct={64} segments={24} />
      <View style={pm.foot}>
        <Text style={pm.tag}>STAGE START</Text>
        <Text style={pm.next}>NEXT MILESTONE ▸ MYSTIC LAND</Text>
      </View>
    </View>
  );
}
const pm = StyleSheet.create({
  wrap: {
    marginHorizontal: 14,
    padding: 14,
    backgroundColor: "#0a0000",
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontFamily: MONO,
    fontSize: 13,
    color: C.laser,
    letterSpacing: 3,
    fontWeight: "900",
  },
  val: { fontFamily: MONO, fontSize: 13, color: C.parchment },
  foot: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  tag: { fontFamily: MONO, fontSize: 11, color: C.slate, letterSpacing: 1.5 },
  next: { fontFamily: MONO, fontSize: 11, color: C.ember, letterSpacing: 1.5 },
});

// ─────────────────────────────────────────────
// POOL ROW
// ─────────────────────────────────────────────
function PoolRow({ pool }: { pool: (typeof POOLS)[number] }) {
  return (
    <View style={[plr.row, { borderLeftColor: pool.color }]}>
      <View style={[plr.glyphBox, { borderColor: pool.color }]}>
        <Text style={[plr.glyph, { color: pool.color }]}>{pool.glyph}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={plr.head}>
          <Text style={[plr.name, { color: pool.color }]} numberOfLines={1}>
            {pool.name}
          </Text>
          <Text style={[plr.pct, { color: pool.color }]}>{pool.pct}%</Text>
        </View>
        <View style={plr.barBg}>
          <View
            style={[
              plr.barFill,
              { width: `${pool.pct * 4}%` as any, backgroundColor: pool.color },
            ]}
          />
        </View>
        <View style={plr.foot}>
          <Text style={plr.bal}>ACUMULADO</Text>
          <Text style={[plr.balVal, { textShadowColor: pool.color }]}>
            ${pool.balance.toFixed(0)}
          </Text>
        </View>
      </View>
    </View>
  );
}
const plr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0a0000",
    borderWidth: 1,
    borderColor: C.borderMid,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 14,
  },
  glyphBox: {
    width: 40,
    height: 40,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  glyph: { fontSize: 18, fontFamily: MONO, fontWeight: "900" },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 5,
  },
  name: {
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: "900",
    flex: 1,
    marginRight: 6,
  },
  pct: { fontFamily: MONO, fontSize: 13, fontWeight: "900" },
  barBg: {
    height: 8,
    backgroundColor: "#1a0000",
    borderWidth: 1,
    borderColor: C.border,
  },
  barFill: { height: "100%" },
  foot: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  bal: { fontFamily: MONO, fontSize: 11, color: C.slate, letterSpacing: 1.5 },
  balVal: {
    fontFamily: MONO,
    fontSize: 14,
    color: C.parchment,
    fontWeight: "900",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  },
});

// ─────────────────────────────────────────────
// EVENT TILE
// ─────────────────────────────────────────────
function EventTile({
  event,
  onPress,
}: {
  event: EventData;
  onPress: () => void;
}) {
  const month = event.label.split(" ")[0].slice(0, 3).toUpperCase();
  const year = event.label.match(/\d{4}/)?.[0] || "";
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={evt.wrap}>
      <View style={evt.tile}>
        <Text style={evt.month}>{month}</Text>
        <Text style={evt.year}>{year}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={evt.pills}>
          <Text style={[evt.pill, { color: C.ember }]}>
            ▲ {fmt(event.slpBurned)}
          </Text>
          <Text style={[evt.pill, { color: C.laser }]}>
            ⚡ {event.axiesReleased}
          </Text>
          <Text style={[evt.pill, { color: C.gold }]}>
            ⚔ {event.prizes.length}
          </Text>
        </View>
        <Text style={evt.drop}>
          TOP DROP:{" "}
          <Text style={{ color: C.gold }}>{event.prizes[0].item}</Text>
        </Text>
      </View>
      <Text style={evt.chev}>►</Text>
    </TouchableOpacity>
  );
}
const evt = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0a0000",
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  tile: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: C.laser,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  month: {
    fontFamily: MONO,
    fontSize: 16,
    color: C.parchment,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: C.laser,
    textShadowRadius: 4,
  },
  year: { fontFamily: MONO, fontSize: 12, color: C.laser },
  pills: { flexDirection: "row", gap: 10, marginBottom: 4 },
  pill: { fontFamily: MONO, fontSize: 13, letterSpacing: 1, fontWeight: "900" },
  drop: { fontFamily: MONO, fontSize: 12, color: C.slate, letterSpacing: 1 },
  chev: { fontFamily: MONO, fontSize: 16, color: C.laser, fontWeight: "900" },
});

// ─────────────────────────────────────────────
// HOW IT WORKS ROW
// ─────────────────────────────────────────────
function HowItWorks() {
  return (
    <View style={{ paddingHorizontal: 14 }}>
      {HOW_IT_WORKS.map((s, i) => (
        <View key={s.id} style={hw.row}>
          <View style={hw.medallion}>
            <Text style={hw.roman}>{s.roman}</Text>
          </View>
          {i < HOW_IT_WORKS.length - 1 && <View style={hw.connector} />}
          <View style={{ flex: 1, paddingTop: 2 }}>
            <View style={hw.head}>
              <Text style={hw.glyph}>{s.glyph}</Text>
              <Text style={hw.title}>{s.title}</Text>
            </View>
            <Text style={hw.body}>{s.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
const hw = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 18,
    gap: 12,
    position: "relative",
  },
  medallion: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.laser,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  roman: {
    fontFamily: MONO,
    fontSize: 14,
    color: C.parchment,
    fontWeight: "900",
    textShadowColor: C.laser,
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  connector: {
    position: "absolute",
    left: 18.5,
    top: 40,
    width: 1,
    height: 50,
    backgroundColor: C.laser,
    opacity: 0.55,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  glyph: { color: C.ember, fontSize: 14 },
  title: {
    fontFamily: MONO,
    fontSize: 14,
    color: C.parchment,
    letterSpacing: 2,
    fontWeight: "900",
    textShadowColor: C.laser,
    textShadowRadius: 4,
  },
  body: { fontFamily: MONO, fontSize: 13, color: C.slate, lineHeight: 19 },
});

// ─────────────────────────────────────────────
// LINK BUTTON
// ─────────────────────────────────────────────
function LinkRow({
  glyph,
  label,
  sub,
  url,
  highlight,
}: {
  glyph: string;
  label: string;
  sub: string;
  url: string;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
      style={[
        lkr.wrap,
        {
          borderColor: highlight ? C.laser : C.borderMid,
          backgroundColor: highlight ? "#1a0008" : "#0a0000",
        },
      ]}
    >
      <View
        style={[
          lkr.glyphBox,
          { borderColor: highlight ? C.laser : C.borderMid },
        ]}
      >
        <Text style={[lkr.glyph, { color: highlight ? C.laser : C.slate }]}>
          {glyph}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            lkr.label,
            highlight && { color: C.laser, textShadowColor: C.laser },
          ]}
        >
          {label}
        </Text>
        <Text style={lkr.sub}>{sub}</Text>
      </View>
      <Text style={[lkr.arrow, { color: highlight ? C.laser : C.slate }]}>
        ↗
      </Text>
    </TouchableOpacity>
  );
}
const lkr = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  glyphBox: {
    width: 34,
    height: 34,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  glyph: { fontFamily: MONO, fontSize: 16 },
  label: {
    fontFamily: MONO,
    fontSize: 13,
    color: C.parchment,
    letterSpacing: 2,
    fontWeight: "900",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  },
  sub: { fontFamily: MONO, fontSize: 12, color: C.slate, marginTop: 2 },
  arrow: { fontSize: 16, fontFamily: MONO, fontWeight: "900" },
});

// ─────────────────────────────────────────────
// EVENT MODAL (compactado, mismo contenido que antes)
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
          <View style={mo.handle} />
          <View style={mo.headerRow}>
            <View style={mo.seal}>
              <Text style={mo.sealTxt}>✡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={mo.title}>REGISTRO #{event.id}</Text>
              <Text style={mo.sub}>{event.label.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={mo.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 4 }}
          >
            <View style={mo.tabs}>
              {tabs.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[mo.tabBtn, tab === t.key && mo.tabBtnActive]}
                  onPress={() => setTab(t.key)}
                >
                  <Text style={[mo.tabTxt, tab === t.key && mo.tabTxtActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 420 }}
          >
            {tab === "resumen" && (
              <View style={{ paddingTop: 12 }}>
                <View style={mo.grid}>
                  {[
                    {
                      val: `▲ ${fmt(event.slpBurned)}`,
                      key: "SLP QUEMADO",
                      color: C.ember,
                    },
                    {
                      val: `⚡ ${event.axiesReleased}`,
                      key: "AXIES LIBERADOS",
                      color: C.laser,
                    },
                    {
                      val: `$ ${event.totalRaised}`,
                      key: "USD RECAUDADOS",
                      color: C.goldBrt,
                    },
                    {
                      val: `${event.participants} 1P`,
                      key: "PARTICIPANTES",
                      color: "#9a8aa0",
                    },
                  ].map((s) => (
                    <View
                      key={s.key}
                      style={[mo.statCell, { borderColor: s.color + "55" }]}
                    >
                      <CornerBrackets color={s.color} size={8} thickness={2} />
                      <Text style={[mo.statVal, { color: s.color }]}>
                        {s.val}
                      </Text>
                      <Text style={mo.statKey}>{s.key}</Text>
                    </View>
                  ))}
                </View>
                <View style={mo.txBox}>
                  <Text style={mo.txLabel}>TX QUEMA ON-CHAIN</Text>
                  <Text style={mo.txVal}>{event.txBurn}</Text>
                </View>
              </View>
            )}

            {tab === "premios" && (
              <View style={{ paddingTop: 12 }}>
                <Text style={mo.tabNote}>
                  Cada entrega es verificable on-chain.
                </Text>
                {event.prizes.map((p) => (
                  <View
                    key={p.rank}
                    style={[
                      mo.prize,
                      { borderColor: p.rank === 1 ? C.goldBrt : C.borderMid },
                    ]}
                  >
                    <CornerBrackets
                      color={p.rank === 1 ? C.goldBrt : C.borderMid}
                      size={8}
                      thickness={2}
                    />
                    <View style={mo.prizeRow}>
                      <View
                        style={[
                          mo.rankBox,
                          { borderColor: p.rank === 1 ? C.goldBrt : C.slate },
                        ]}
                      >
                        <Text
                          style={[
                            mo.rankTxt,
                            { color: p.rank === 1 ? C.goldBrt : C.slate },
                          ]}
                        >
                          #{p.rank}
                        </Text>
                      </View>
                      <Text style={mo.prizeItem}>{p.item}</Text>
                      <Text
                        style={[
                          mo.prizeVal,
                          { color: p.rank === 1 ? C.goldBrt : C.laser },
                        ]}
                      >
                        {p.value}
                      </Text>
                    </View>
                    <Text style={mo.wLine}>
                      WALLET:{" "}
                      <Text style={mo.wAddr}>
                        {p.wallet.replace("ronin:", "")}
                      </Text>
                    </Text>
                    <Text style={mo.wLine}>
                      TX: <Text style={mo.txInline}>{p.txHash}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {tab === "pools" && (
              <View style={{ paddingTop: 12 }}>
                <Text style={mo.tabNote}>
                  Distribución de los ${event.totalRaised} USD recaudados.
                </Text>
                {event.poolMovements.map((pm2) => (
                  <View
                    key={pm2.name}
                    style={[mo.pmRow, { borderLeftColor: pm2.color }]}
                  >
                    <View style={mo.pmHead}>
                      <Text style={{ fontSize: 15 }}>{pm2.glyph}</Text>
                      <Text style={[mo.pmName, { color: pm2.color }]}>
                        {pm2.name.toUpperCase()}
                      </Text>
                      <Text style={[mo.pmUsd, { color: pm2.color }]}>
                        ${pm2.usd.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={mo.pmDetail}>{pm2.detail}</Text>
                    <Text style={mo.wLine}>
                      TX: <Text style={mo.txInline}>{pm2.txHash}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {tab === "chart" && (
              <View style={{ paddingTop: 12 }}>
                <Text style={mo.tabNote}>
                  Precio del SLP/USD durante el período del evento.
                </Text>
                <View style={mo.chartC}>
                  <WebView
                    source={{ html: chartHtml(event.date) }}
                    style={{ flex: 1, backgroundColor: "#000" }}
                    scrollEnabled={false}
                    javaScriptEnabled
                    domStorageEnabled
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
                  <Text style={mo.chartLinkTxt}>
                    ◆ VER HISTÓRICO EN COINMARKETCAP →
                  </Text>
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
    backgroundColor: "#000000cc",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.laser,
    padding: 18,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
  },
  handle: {
    width: 36,
    height: 3,
    backgroundColor: C.laser,
    alignSelf: "center",
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  seal: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: C.laser,
    justifyContent: "center",
    alignItems: "center",
  },
  sealTxt: { color: C.laser, fontSize: 14 },
  title: {
    fontFamily: MONO,
    color: C.laser,
    fontWeight: "900",
    fontSize: 19,
    letterSpacing: 3,
  },
  sub: {
    fontFamily: MONO,
    color: C.slate,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 2,
  },
  close: { color: C.laser, fontSize: 20, fontWeight: "900" },
  tabs: { flexDirection: "row", gap: 6 },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.borderMid,
    backgroundColor: C.surface,
  },
  tabBtnActive: { borderColor: C.laser, backgroundColor: C.crimsonGlow },
  tabTxt: {
    fontFamily: MONO,
    color: C.slate,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  tabTxtActive: { color: C.laser },
  tabNote: {
    fontFamily: MONO,
    color: C.slate,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: C.borderMid,
    backgroundColor: C.surface2,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  statCell: {
    width: "47%",
    borderWidth: 1,
    padding: 12,
    backgroundColor: "#0a0000",
    position: "relative",
  },
  statVal: {
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statKey: { fontFamily: MONO, color: C.slate, fontSize: 11, letterSpacing: 2 },
  txBox: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  txLabel: {
    fontFamily: MONO,
    color: C.borderMid,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 5,
  },
  txVal: { fontFamily: MONO, color: C.laser, fontSize: 13 },
  prize: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#0a0000",
    position: "relative",
  },
  prizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  rankBox: {
    width: 30,
    height: 30,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rankTxt: { fontFamily: MONO, fontWeight: "900", fontSize: 13 },
  prizeItem: {
    flex: 1,
    fontFamily: MONO,
    color: C.parchment,
    fontSize: 13,
    fontWeight: "700",
  },
  prizeVal: { fontFamily: MONO, fontWeight: "900", fontSize: 13 },
  wLine: { fontFamily: MONO, color: C.slate, fontSize: 11, marginBottom: 2 },
  wAddr: { color: C.laser },
  txInline: { color: C.ember },
  pmRow: { borderLeftWidth: 2, paddingLeft: 12, marginBottom: 14 },
  pmHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pmName: {
    flex: 1,
    fontFamily: MONO,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1.5,
  },
  pmUsd: { fontFamily: MONO, fontWeight: "900", fontSize: 15 },
  pmDetail: {
    fontFamily: MONO,
    color: C.slate,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  chartC: {
    height: 260,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  chartLink: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: C.laser,
    alignItems: "center",
    backgroundColor: "#1a0008",
  },
  chartLinkTxt: {
    fontFamily: MONO,
    color: C.laser,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "900",
  },
});

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function HomeScreen() {
  const { hPad } = useLayout();
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);

  function openEvent(e: EventData) {
    setSelectedEvent(e);
    setModalVisible(true);
  }
  const eventsToShow = showAll ? PAST_EVENTS : PAST_EVENTS.slice(0, 3);

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Hero />
        <CountdownPanel onPress={() => {}} />
        <StatsRow />

        <ArcadeDivider label="POWER METER GLOBAL" />
        <PowerMeter />

        <ArcadeDivider label="LAS V CÁMARAS" />
        {POOLS.map((p) => (
          <PoolRow key={p.id} pool={p} />
        ))}

        <ArcadeDivider label="ARCHIVOS DEL RITUAL" />
        {eventsToShow.map((e) => (
          <EventTile key={e.id} event={e} onPress={() => openEvent(e)} />
        ))}
        {!showAll && PAST_EVENTS.length > 3 && (
          <TouchableOpacity
            onPress={() => setShowAll(true)}
            style={s.continueBtn}
          >
            <Text style={s.continueTxt}>▼ CONTINUE? ··· LOAD ARCHIVES ···</Text>
          </TouchableOpacity>
        )}

        <ArcadeDivider label="EL GRIMORIO" />
        <HowItWorks />

        <ArcadeDivider label="PORTALES" />
        <LinkRow
          glyph="⟁"
          label="RONIN MARKETPLACE"
          sub="explorar floor price"
          url="https://marketplace.roninchain.com/"
          highlight
        />
        <LinkRow
          glyph="✦"
          label="VER QUEMAS EN EXPLORER"
          sub="ronin.app/address/0xBurn"
          url="https://app.roninchain.com/"
        />
        <LinkRow
          glyph="✧"
          label="DISCORD DEL GREMIO"
          sub="discord.gg/quemaSLP"
          url="https://discord.gg/"
        />

        <View style={s.footer}>
          <Text style={s.footerTxt}>⛧ © MMXXVI — RONIN NETWORK ⛧</Text>
          <Blink dur={900}>
            <Text style={s.footerBlink}>PRESS START TO BURN</Text>
          </Blink>
        </View>
      </ScrollView>

      <EventModal
        event={selectedEvent}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },
  continueBtn: {
    marginHorizontal: 14,
    marginTop: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.laser,
    borderStyle: "dashed",
    alignItems: "center",
  },
  continueTxt: {
    fontFamily: MONO,
    fontSize: 13,
    color: C.laser,
    letterSpacing: 3,
    fontWeight: "900",
  },
  footer: { alignItems: "center", paddingVertical: 24, gap: 6 },
  footerTxt: {
    fontFamily: MONO,
    fontSize: 12,
    color: C.laserDim,
    letterSpacing: 3,
  },
  footerBlink: {
    fontFamily: MONO,
    fontSize: 13,
    color: C.laser,
    letterSpacing: 3,
    fontWeight: "900",
  },
});
