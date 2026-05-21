/**
 * Milestone Screen — Ritual de Quema de SLP
 *
 * Estética:    Dark Retro Arcane / Arcade — Wizardry + FF1 NES + Warhammer 40k
 * Sistema:     "Nivel del Ritual" — sube de nivel cada $10 USD recaudados
 *              Cada nivel agrega una reward al sorteo
 * Responsive:  mobile (<600px) columna única / web (≥600px) dos columnas
 */

import { ThemedText } from "@/components/themed-text";
import React, { useMemo } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─────────────────────────────────────────────
// PALETA (misma que index.tsx)
// ─────────────────────────────────────────────
const C = {
  bg: "#000000",
  surface: "#0b0000",
  surface2: "#130000",
  border: "#2a0000",
  borderMid: "#550000",
  crimson: "#CC0000",
  crimsonBrt: "#FF2200",
  crimsonGlow: "#CC000025",
  ember: "#FF6600",
  emberDim: "#FF660020",
  gold: "#B8860B",
  goldBrt: "#D4A017",
  goldDim: "#B8860B20",
  green: "#4a7c3f",
  greenBrt: "#6abf5e",
  greenDim: "#4a7c3f20",
  slate: "#5a5a6a",
  parchment: "#C8BEB0",
};

// ─────────────────────────────────────────────
// RESPONSIVE
// ─────────────────────────────────────────────
function useLayout() {
  const { width } = useWindowDimensions();
  return { isWide: width >= 600, hPad: width >= 600 ? 32 : 16 };
}

// ─────────────────────────────────────────────
// SISTEMA DE NIVELES DEL RITUAL
//
// Cada $10 USD recaudados = +1 nivel
// La barra muestra el progreso dentro del nivel actual ($0–$10)
// Al subir de nivel → se agrega 1 reward al sorteo
// ─────────────────────────────────────────────
const USD_PER_LEVEL = 10;

// Rewards que se agregan por nivel (cíclica — cuando se acaban vuelve al principio)
const LEVEL_REWARDS = [
  "SLP Drop — 10.000 SLP",
  "Item: Pack de Pergaminos Raros",
  "SLP Drop — 25.000 SLP",
  "Axie de baja rareza (surprise)",
  "Item: Armadura Épica",
  "SLP Drop — 50.000 SLP",
  "Axie Beast — Purity 4/6",
  "Land Savannah Standard",
  "SLP Drop — 100.000 SLP",
  "Axie Mystic (sorpresa)",
];

type LevelState = {
  currentLevel: number;
  xpInLevel: number; // USD dentro del nivel actual (0–10)
  xpPercent: number; // 0–100
  totalRaised: number;
  unlockedRewards: string[];
};

function computeLevel(totalRaisedUsd: number): LevelState {
  const currentLevel = Math.floor(totalRaisedUsd / USD_PER_LEVEL);
  const xpInLevel = totalRaisedUsd % USD_PER_LEVEL;
  const xpPercent = (xpInLevel / USD_PER_LEVEL) * 100;
  const unlockedRewards = Array.from(
    { length: currentLevel },
    (_, i) => LEVEL_REWARDS[i % LEVEL_REWARDS.length],
  );
  return {
    currentLevel,
    xpInLevel,
    xpPercent,
    totalRaised: totalRaisedUsd,
    unlockedRewards,
  };
}

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const CURRENT_EVENT_NUMBER = 6;
const TOTAL_RAISED_USD = 412; // cambia esto según el evento activo
const SLP_PRICE_USD = 0.003; // precio simulado del SLP
const TICKET_COST_USD = 3;
const TICKET_COST_SLP = Math.round(TICKET_COST_USD / SLP_PRICE_USD);

type Milestone = {
  id: number;
  threshold: number; // USD necesarios para desbloquear
  title: string;
  reward: string;
  unlocked: boolean;
  txHash?: string;
};

const MILESTONES: Milestone[] = [
  {
    id: 1,
    threshold: 50,
    title: "Ritual I — El Primer Sello",
    reward: "SLP Drop — 10.000 SLP para un ganador aleatorio",
    unlocked: true,
    txHash: "0xaa11...bb22",
  },
  {
    id: 2,
    threshold: 100,
    title: "Ritual II — El Círculo",
    reward: "Pack de Items Raros x3 para un ganador aleatorio",
    unlocked: true,
    txHash: "0xcc33...dd44",
  },
  {
    id: 3,
    threshold: 175,
    title: "Ritual III — La Invocación",
    reward: "Axie de baja rareza (sorpresa)",
    unlocked: true,
    txHash: "0xee55...ff66",
  },
  {
    id: 4,
    threshold: 250,
    title: "Ritual IV — La Gran Pira",
    reward: "SLP Drop — 50.000 SLP para un ganador aleatorio",
    unlocked: true,
    txHash: "0x1122...3344",
  },
  {
    id: 5,
    threshold: 350,
    title: "Ritual V — El Exilio",
    reward: "Axie Axie Beast Purity 4/6 (sorpresa)",
    unlocked: true,
    txHash: "0x5566...7788",
  },
  {
    id: 6,
    threshold: 500,
    title: "Ritual VI — El Gran Concilio",
    reward: "Land Savannah Standard + SLP Drop 25.000",
    unlocked: false,
  },
  {
    id: 7,
    threshold: 700,
    title: "Ritual VII — La Ascensión",
    reward: "Axie Mystic (sorpresa) + Item Épico",
    unlocked: false,
  },
  {
    id: 8,
    threshold: 1000,
    title: "Ritual VIII — El Apocalipsis",
    reward: "Premio Legendario — anunciado al alcanzar",
    unlocked: false,
  },
];

const TREASURY_ADDRESS = "ronin:0xDead...Beef";

// ─────────────────────────────────────────────
// COMPONENTES BASE
// ─────────────────────────────────────────────

// Corner brackets reutilizables
function Brackets({
  color = C.crimson,
  size = 8,
}: {
  color?: string;
  size?: number;
}) {
  const b: object = { position: "absolute", width: size, height: size };
  return (
    <>
      <View
        style={[
          b,
          {
            top: 0,
            left: 0,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          b,
          {
            top: 0,
            right: 0,
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          b,
          {
            bottom: 0,
            left: 0,
            borderBottomWidth: 1,
            borderLeftWidth: 1,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          b,
          {
            bottom: 0,
            right: 0,
            borderBottomWidth: 1,
            borderRightWidth: 1,
            borderColor: color,
          },
        ]}
      />
    </>
  );
}

function ArcaneBox({
  children,
  style,
  color = C.crimson,
  elevated = false,
}: {
  children: React.ReactNode;
  style?: object;
  color?: string;
  elevated?: boolean;
}) {
  return (
    <View style={[ab.outer, style]}>
      <View style={[ab.shadow, { borderColor: color + "33" }]} />
      <View
        style={[ab.box, elevated && ab.elevated, { borderColor: color + "55" }]}
      >
        <Brackets color={color} />
        {children}
      </View>
    </View>
  );
}
const ab = StyleSheet.create({
  outer: { position: "relative", marginBottom: 2 },
  shadow: {
    position: "absolute",
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: C.bg,
    borderWidth: 1,
  },
  box: {
    backgroundColor: C.surface,
    borderWidth: 1,
    padding: 14,
    position: "relative",
  },
  elevated: { backgroundColor: C.surface2 },
});

// Rune divider
function RuneDivider({ label }: { label: string }) {
  return (
    <View style={rd.wrap}>
      <View style={rd.line} />
      <View style={rd.mid}>
        <ThemedText style={rd.hex}>⬡</ThemedText>
        <ThemedText style={rd.label}>{label.toUpperCase()}</ThemedText>
        <ThemedText style={rd.hex}>⬡</ThemedText>
      </View>
      <View style={rd.line} />
    </View>
  );
}
const rd = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: C.borderMid },
  mid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 10,
  },
  hex: { color: C.crimson, fontSize: 9 },
  label: { color: C.crimson, fontSize: 9, letterSpacing: 3, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// HEADER ARCADE
// ─────────────────────────────────────────────
function ArcadeHeader({ eventNumber }: { eventNumber: number }) {
  return (
    <View style={ah.wrapper}>
      {/* Línea top */}
      <View style={ah.topLine} />

      {/* Fila superior: Cult name + Versión */}
      <View style={ah.topRow}>
        <View style={ah.leftTag}>
          <ThemedText style={ah.tagLabel}>CULTO</ThemedText>
          <ThemedText style={ah.tagValue}>FYNOLTS CULT</ThemedText>
        </View>
        <View style={ah.centerSeal}>
          <ThemedText style={ah.sealSymbol}>✡</ThemedText>
        </View>
        <View style={ah.rightTag}>
          <ThemedText style={ah.tagLabel}>VERSION</ThemedText>
          <ThemedText style={ah.tagValue}>0.01</ThemedText>
        </View>
      </View>

      {/* Título principal */}
      <View style={ah.titleBlock}>
        <View style={ah.titleLine} />
        <ThemedText style={ah.ritualLabel}>
          ⬡ RITUAL DE QUEMA NÚMERO: {String(eventNumber).padStart(2, "0")} ⬡
        </ThemedText>
        <View style={ah.titleLine} />
      </View>

      {/* Línea bottom */}
      <View style={ah.bottomLine} />
    </View>
  );
}
const ah = StyleSheet.create({
  wrapper: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    paddingBottom: 12,
  },
  topLine: { height: 2, backgroundColor: C.crimson, marginBottom: 10 },
  bottomLine: { height: 1, backgroundColor: C.borderMid, marginTop: 10 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  leftTag: { alignItems: "flex-start" },
  rightTag: { alignItems: "flex-end" },
  tagLabel: { color: C.borderMid, fontSize: 8, letterSpacing: 2 },
  tagValue: {
    color: C.parchment,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  centerSeal: { alignItems: "center", justifyContent: "center" },
  sealSymbol: { color: C.crimson, fontSize: 22 },
  titleBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  titleLine: { flex: 1, height: 1, backgroundColor: C.borderMid },
  ritualLabel: {
    color: C.crimson,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
});

// ─────────────────────────────────────────────
// NIVEL DEL RITUAL — barra de XP con niveles
// ─────────────────────────────────────────────
function RitualLevelMeter({ level }: { level: LevelState }) {
  const { currentLevel, xpInLevel, xpPercent, totalRaised, unlockedRewards } =
    level;
  const nextLevelAt = (currentLevel + 1) * USD_PER_LEVEL;

  return (
    <ArcaneBox color={C.ember} style={{ marginBottom: 14 }}>
      {/* Label + nivel */}
      <View style={lm.headerRow}>
        <View>
          <ThemedText style={lm.sectionLabel}>NIVEL DEL RITUAL</ThemedText>
          <ThemedText style={lm.sublabel}>
            Cada $10 USD recaudados sube el nivel y agrega una reward al sorteo
          </ThemedText>
        </View>
        <View style={[lm.levelBadge, { borderColor: C.ember }]}>
          <ThemedText style={lm.levelNum}>{currentLevel}</ThemedText>
          <ThemedText style={lm.levelWord}>LVL</ThemedText>
        </View>
      </View>

      {/* Barra de XP estilo retro — segmentada */}
      <View style={lm.xpContainer}>
        <ThemedText style={lm.xpLabel}>XP</ThemedText>
        <View style={lm.xpBarOuter}>
          {/* Segmentos */}
          {Array.from({ length: 10 }).map((_, i) => {
            const filled = (i / 10) * 100 < xpPercent;
            return (
              <View
                key={i}
                style={[
                  lm.xpSegment,
                  filled
                    ? { backgroundColor: C.ember }
                    : { backgroundColor: C.border },
                ]}
              />
            );
          })}
        </View>
        <ThemedText style={lm.xpNumbers}>
          ${xpInLevel.toFixed(0)} / ${USD_PER_LEVEL}
        </ThemedText>
      </View>

      {/* Info */}
      <View style={lm.infoRow}>
        <View style={lm.infoItem}>
          <ThemedText style={lm.infoVal}>${totalRaised}</ThemedText>
          <ThemedText style={lm.infoKey}>USD RECAUDADOS</ThemedText>
        </View>
        <View style={[lm.infoDiv, { backgroundColor: C.borderMid }]} />
        <View style={lm.infoItem}>
          <ThemedText style={lm.infoVal}>{currentLevel}</ThemedText>
          <ThemedText style={lm.infoKey}>REWARDS DESBLOQUEADAS</ThemedText>
        </View>
        <View style={[lm.infoDiv, { backgroundColor: C.borderMid }]} />
        <View style={lm.infoItem}>
          <ThemedText style={lm.infoVal}>
            ${nextLevelAt - totalRaised}
          </ThemedText>
          <ThemedText style={lm.infoKey}>PARA PRÓXIMO NIVEL</ThemedText>
        </View>
      </View>

      {/* Próxima reward */}
      {currentLevel < LEVEL_REWARDS.length && (
        <View style={[lm.nextReward, { borderColor: C.ember + "50" }]}>
          <ThemedText style={lm.nextRewardLabel}>
            ⚡ PRÓXIMA REWARD (Nivel {currentLevel + 1})
          </ThemedText>
          <ThemedText style={lm.nextRewardVal}>
            {LEVEL_REWARDS[currentLevel % LEVEL_REWARDS.length]}
          </ThemedText>
        </View>
      )}
    </ArcaneBox>
  );
}
const lm = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  sectionLabel: {
    color: C.ember,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 3,
  },
  sublabel: { color: C.slate, fontSize: 10, lineHeight: 14, maxWidth: "80%" },
  levelBadge: {
    width: 52,
    height: 52,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNum: { color: C.ember, fontWeight: "900", fontSize: 22, lineHeight: 24 },
  levelWord: { color: C.slate, fontSize: 8, letterSpacing: 2 },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  xpLabel: { color: C.slate, fontSize: 9, letterSpacing: 1, width: 20 },
  xpBarOuter: { flex: 1, flexDirection: "row", gap: 2, height: 14 },
  xpSegment: { flex: 1, height: "100%" },
  xpNumbers: {
    color: C.parchment,
    fontSize: 9,
    fontFamily: "monospace",
    width: 48,
    textAlign: "right",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  infoItem: { flex: 1, alignItems: "center" },
  infoVal: { color: C.ember, fontWeight: "900", fontSize: 15 },
  infoKey: {
    color: C.slate,
    fontSize: 7,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 2,
  },
  infoDiv: { width: 1, height: 28 },
  nextReward: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 10,
    borderLeftColor: C.ember,
  },
  nextRewardLabel: {
    color: C.ember,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  nextRewardVal: { color: C.parchment, fontSize: 12, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// TICKET CTA
// ─────────────────────────────────────────────
function TicketCTA({ slpCost }: { slpCost: number }) {
  return (
    <ArcaneBox color={C.crimson} style={{ marginBottom: 14 }}>
      <ThemedText style={tc.mainLabel}>COMPRE SU TICKET</ThemedText>
      <ThemedText style={tc.costLine}>
        Actualmente al coste de{" "}
        <ThemedText style={tc.costVal}>
          {slpCost.toLocaleString()} SLP
        </ThemedText>
      </ThemedText>
      <ThemedText style={tc.equiv}>(≈ $3 USD al precio actual)</ThemedText>

      <View style={tc.divider} />

      <TouchableOpacity
        style={tc.btn}
        activeOpacity={0.8}
        onPress={() => {
          /* navegación a la pantalla de perfil/compra */
        }}
      >
        {/* Decoración lateral */}
        <View style={[tc.btnSideL, { borderColor: C.crimson }]} />
        <View style={tc.btnInner}>
          <ThemedText style={tc.btnIcon}>⚔️</ThemedText>
          <ThemedText style={tc.btnText}>PARTICIPAR DEL RITUAL</ThemedText>
          <ThemedText style={tc.btnIcon}>⚔️</ThemedText>
        </View>
        <View style={[tc.btnSideR, { borderColor: C.crimson }]} />
      </TouchableOpacity>

      <ThemedText style={tc.disclaimer}>
        Ventana activa · 72 horas desde el inicio del ritual
      </ThemedText>
    </ArcaneBox>
  );
}
const tc = StyleSheet.create({
  mainLabel: {
    color: C.crimson,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 6,
  },
  costLine: { color: C.parchment, fontSize: 13, textAlign: "center" },
  costVal: { color: C.goldBrt, fontWeight: "900" },
  equiv: {
    color: C.slate,
    fontSize: 10,
    textAlign: "center",
    marginBottom: 10,
  },
  divider: { height: 1, backgroundColor: C.borderMid, marginBottom: 12 },
  btn: {
    borderWidth: 2,
    borderColor: C.crimson,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface2,
    marginBottom: 10,
  },
  btnSideL: { width: 4, alignSelf: "stretch", borderRightWidth: 1 },
  btnSideR: { width: 4, alignSelf: "stretch", borderLeftWidth: 1 },
  btnInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  btnIcon: { fontSize: 16 },
  btnText: {
    color: C.crimsonBrt,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 3,
  },
  disclaimer: {
    color: C.slate,
    fontSize: 9,
    letterSpacing: 1,
    textAlign: "center",
  },
});

// ─────────────────────────────────────────────
// REWARDS DESBLOQUEADAS POR NIVEL
// ─────────────────────────────────────────────
function UnlockedRewards({ level }: { level: LevelState }) {
  if (level.unlockedRewards.length === 0) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <ThemedText style={ur.title}>REWARDS DESBLOQUEADAS POR NIVEL</ThemedText>
      {level.unlockedRewards.map((reward, i) => (
        <View key={i} style={ur.row}>
          <View style={ur.levelTag}>
            <ThemedText style={ur.levelTagTxt}>LVL {i + 1}</ThemedText>
          </View>
          <ThemedText style={ur.rewardTxt}>{reward}</ThemedText>
          <ThemedText style={ur.check}>✓</ThemedText>
        </View>
      ))}
    </View>
  );
}
const ur = StyleSheet.create({
  title: { color: C.slate, fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  levelTag: {
    borderWidth: 1,
    borderColor: C.ember + "60",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  levelTagTxt: {
    color: C.ember,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  rewardTxt: { flex: 1, color: C.parchment, fontSize: 11 },
  check: { color: C.greenBrt, fontWeight: "900" },
});

// ─────────────────────────────────────────────
// MILESTONE ROW
// ─────────────────────────────────────────────
function MilestoneRow({
  m,
  totalRaised,
}: {
  m: Milestone;
  totalRaised: number;
}) {
  const progress = Math.min((totalRaised / m.threshold) * 100, 100);
  const isNext =
    !m.unlocked && MILESTONES.find((x) => !x.unlocked)?.id === m.id;

  return (
    <ArcaneBox
      color={m.unlocked ? C.greenBrt : isNext ? C.gold : C.borderMid}
      style={{ marginBottom: 10 }}
    >
      {/* Header */}
      <View style={ms.header}>
        <View
          style={[
            ms.statusDot,
            {
              backgroundColor: m.unlocked
                ? C.greenBrt
                : isNext
                  ? C.goldBrt
                  : C.borderMid,
            },
          ]}
        />
        <ThemedText
          style={[
            ms.title,
            { color: m.unlocked ? C.greenBrt : isNext ? C.goldBrt : C.slate },
          ]}
        >
          {m.title}
        </ThemedText>
        <View
          style={[
            ms.thresholdTag,
            { borderColor: m.unlocked ? C.greenBrt + "60" : C.borderMid },
          ]}
        >
          <ThemedText
            style={[
              ms.thresholdTxt,
              { color: m.unlocked ? C.greenBrt : C.slate },
            ]}
          >
            ${m.threshold}
          </ThemedText>
        </View>
      </View>

      {/* Reward */}
      <ThemedText style={ms.reward}>
        {m.unlocked ? "⚔️ " : isNext ? "⟳ " : "🔒 "}
        {m.reward}
      </ThemedText>

      {/* Barra de progreso — solo si no está desbloqueado */}
      {!m.unlocked && (
        <View style={ms.barContainer}>
          <View style={ms.barBg}>
            <View
              style={[
                ms.barFill,
                {
                  width: `${progress}%` as any,
                  backgroundColor: isNext ? C.goldBrt : C.borderMid,
                },
              ]}
            />
          </View>
          <ThemedText style={ms.barPct}>{progress.toFixed(0)}%</ThemedText>
        </View>
      )}

      {/* TX si está desbloqueado */}
      {m.unlocked && m.txHash && (
        <View style={ms.txRow}>
          <ThemedText style={ms.txLabel}>TX: </ThemedText>
          <ThemedText style={ms.txHash}>{m.txHash}</ThemedText>
        </View>
      )}
    </ArcaneBox>
  );
}
const ms = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  statusDot: { width: 7, height: 7 },
  title: { flex: 1, fontWeight: "700", fontSize: 12, letterSpacing: 0.5 },
  thresholdTag: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  thresholdTxt: { fontSize: 10, fontWeight: "700" },
  reward: { color: C.parchment, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  barContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  barBg: { flex: 1, height: 4, backgroundColor: C.border },
  barFill: { height: "100%" },
  barPct: { color: C.slate, fontSize: 9, width: 30, textAlign: "right" },
  txRow: { flexDirection: "row", alignItems: "center" },
  txLabel: { color: C.slate, fontSize: 9 },
  txHash: { color: C.crimson, fontSize: 9, fontFamily: "monospace" },
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function MilestoneScreen() {
  const { isWide, hPad } = useLayout();
  const level = useMemo(() => computeLevel(TOTAL_RAISED_USD), []);

  const unlocked = MILESTONES.filter((m) => m.unlocked);
  const pending = MILESTONES.filter((m) => !m.unlocked);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header arcade */}
      <ArcadeHeader eventNumber={CURRENT_EVENT_NUMBER} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── NIVEL DEL RITUAL ── */}
        <RuneDivider label="Nivel del Ritual" />
        <RitualLevelMeter level={level} />

        {/* ── REWARDS POR NIVEL ── */}
        {level.unlockedRewards.length > 0 && (
          <>
            <RuneDivider label="Rewards de nivel desbloqueadas" />
            <UnlockedRewards level={level} />
          </>
        )}

        {/* ── TICKET CTA ── */}
        <RuneDivider label="Compre su Ticket" />
        <TicketCTA slpCost={TICKET_COST_SLP} />

        {/* ── MILESTONES ── */}
        {unlocked.length > 0 && (
          <>
            <RuneDivider label="Rituales completados" />
            {unlocked.map((m) => (
              <MilestoneRow key={m.id} m={m} totalRaised={TOTAL_RAISED_USD} />
            ))}
          </>
        )}

        {pending.length > 0 && (
          <>
            <RuneDivider label="Rituales pendientes" />
            {pending.map((m) => (
              <MilestoneRow key={m.id} m={m} totalRaised={TOTAL_RAISED_USD} />
            ))}
          </>
        )}

        {/* ── TESORERÍA ── */}
        <RuneDivider label="Dirección del tesoro" />
        <ArcaneBox color={C.gold}>
          <ThemedText style={tr.label}>
            DIRECCIÓN ON-CHAIN DEL CONTRATO
          </ThemedText>
          <ThemedText style={tr.addr}>{TREASURY_ADDRESS}</ThemedText>
          <TouchableOpacity
            style={tr.btn}
            onPress={() =>
              Linking.openURL(
                `https://app.roninchain.com/address/${TREASURY_ADDRESS.replace("ronin:", "")}`,
              )
            }
          >
            <ThemedText style={tr.btnTxt}>
              ⬡ VERIFICAR EN RONIN EXPLORER →
            </ThemedText>
          </TouchableOpacity>
        </ArcaneBox>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerLine} />
          <ThemedText style={s.footerTxt}>✡</ThemedText>
          <View style={s.footerLine} />
        </View>
        <ThemedText style={s.cultText}>
          Be one of US, be a Fynolts Cultist
        </ThemedText>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const tr = StyleSheet.create({
  label: { color: C.slate, fontSize: 8, letterSpacing: 2, marginBottom: 6 },
  addr: {
    color: C.goldBrt,
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 10,
  },
  btn: {
    borderWidth: 1,
    borderColor: C.gold + "60",
    padding: 8,
    alignItems: "center",
  },
  btnTxt: { color: C.gold, fontSize: 9, letterSpacing: 2, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 60 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  footerLine: { flex: 1, height: 1, backgroundColor: C.border },
  footerTxt: { color: C.borderMid, fontSize: 14, marginHorizontal: 12 },
  cultText: {
    color: C.borderMid,
    fontSize: 9,
    letterSpacing: 2,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 10,
  },
});
