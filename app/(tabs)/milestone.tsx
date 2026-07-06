/**
 * Milestone Screen — Ritual de Quema de SLP
 *
 * Conectado a Supabase. Lee el evento activo (status='activo') y
 * muestra su nivel real, progreso del pool de rewards, y las
 * rewards desbloqueadas (level_rewards_unlocked).
 *
 * Orden de bloques: Nivel del Ritual → Compre su Ticket → Rewards Desbloqueadas
 *
 * 2 ESTADOS:
 *   A — Hay evento activo: muestra todo, botón cambia según wallet conectada
 *   B — No hay evento activo: mensaje "no hay ritual en curso"
 */

import { BuyTicketsModal } from "@/components/BuyTicketsModal";
import { ThemedText } from "@/components/themed-text";
import { useWallet } from "@/contexts/wallet-context";
import { pad2, useCountdown } from "@/hooks/use-countdown";
import { fmtSlp, usdToSlp, useSlpPrice } from "@/hooks/use-slp-price";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  RefreshControl,
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
// CONFIG DE NIVELES (igual que level_thresholds en Supabase)
// Se usa para calcular "próximo umbral" del lado del cliente
// sin tener que pegarle a la base de nuevo.
// ─────────────────────────────────────────────
const LEVEL_THRESHOLDS: Record<number, { threshold: number; rewards: { amount: number; count: number }[] }> = {
  1: { threshold: 50,  rewards: [{ amount: 50, count: 1 }] },
  2: { threshold: 100, rewards: [{ amount: 50, count: 2 }] },
  3: { threshold: 150, rewards: [{ amount: 50, count: 3 }] },
  4: { threshold: 200, rewards: [{ amount: 50, count: 4 }] },
  5: { threshold: 250, rewards: [{ amount: 50, count: 1 }, { amount: 100, count: 2 }] },
  6: { threshold: 300, rewards: [{ amount: 100, count: 3 }] },
};
function getLevelConfig(level: number) {
  return LEVEL_THRESHOLDS[Math.min(level, 6)];
}

// ─────────────────────────────────────────────
// TIPOS — datos que vienen de Supabase
// ─────────────────────────────────────────────
type ActiveEvent = {
  id: string;
  event_number: number;
  label: string;
  date_start: string;
  date_end: string;
  status: string;
  ritual_level: number;
  rewards_pool_slp: number;
  rewards_pool_usd: number;
  total_raised_usd: number;
  ticket_price_usd: number;
};

type RewardUnlocked = {
  id: string;
  level_reached: number;
  amount_usd: number;
  slp_equivalent: number;
  status: "pending-reward" | "entregada";
  winner_wallet: string | null;
  draw_order: number;
};

const TREASURY_EXPLORER_URL = "https://app.roninchain.com/"; // placeholder hasta tener wallet del proyecto

// ─────────────────────────────────────────────
// COMPONENTES BASE (sin cambios — estética arcade)
// ─────────────────────────────────────────────
function Brackets({ color = C.crimson, size = 8 }: { color?: string; size?: number }) {
  const b: object = { position: "absolute", width: size, height: size };
  return (
    <>
      <View style={[b, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1, borderColor: color }]} />
      <View style={[b, { top: 0, right: 0, borderTopWidth: 1, borderRightWidth: 1, borderColor: color }]} />
      <View style={[b, { bottom: 0, left: 0, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: color }]} />
      <View style={[b, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1, borderColor: color }]} />
    </>
  );
}

function ArcaneBox({ children, style, color = C.crimson, elevated = false }: { children: React.ReactNode; style?: object; color?: string; elevated?: boolean }) {
  return (
    <View style={[ab.outer, style]}>
      <View style={[ab.shadow, { borderColor: color + "33" }]} />
      <View style={[ab.box, elevated && ab.elevated, { borderColor: color + "55" }]}>
        <Brackets color={color} />
        {children}
      </View>
    </View>
  );
}
const ab = StyleSheet.create({
  outer: { position: "relative", marginBottom: 2 },
  shadow: { position: "absolute", top: 3, left: 3, right: -3, bottom: -3, backgroundColor: C.bg, borderWidth: 1 },
  box: { backgroundColor: C.surface, borderWidth: 1, padding: 14, position: "relative" },
  elevated: { backgroundColor: C.surface2 },
});

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
  mid: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 10 },
  hex: { color: C.crimson, fontSize: 9 },
  label: { color: C.crimson, fontSize: 9, letterSpacing: 3, fontWeight: "700" },
});

function ArcadeHeader({ eventNumber }: { eventNumber: number | null }) {
  return (
    <View style={ah.wrapper}>
      <View style={ah.topLine} />
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
      <View style={ah.titleBlock}>
        <View style={ah.titleLine} />
        <ThemedText style={ah.ritualLabel}>
          ⬡ RITUAL DE QUEMA NÚMERO: {eventNumber ? String(eventNumber).padStart(2, "0") : "--"} ⬡
        </ThemedText>
        <View style={ah.titleLine} />
      </View>
      <View style={ah.bottomLine} />
    </View>
  );
}
const ah = StyleSheet.create({
  wrapper: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.borderMid, paddingBottom: 12 },
  topLine: { height: 2, backgroundColor: C.crimson, marginBottom: 10 },
  bottomLine: { height: 1, backgroundColor: C.borderMid, marginTop: 10 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 },
  leftTag: { alignItems: "flex-start" },
  rightTag: { alignItems: "flex-end" },
  tagLabel: { color: C.borderMid, fontSize: 8, letterSpacing: 2 },
  tagValue: { color: C.parchment, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  centerSeal: { alignItems: "center", justifyContent: "center" },
  sealSymbol: { color: C.crimson, fontSize: 22 },
  titleBlock: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  titleLine: { flex: 1, height: 1, backgroundColor: C.borderMid },
  ritualLabel: { color: C.crimson, fontSize: 10, fontWeight: "700", letterSpacing: 2, textAlign: "center" },
});

// ─────────────────────────────────────────────
// ESTADO B — NO HAY EVENTO ACTIVO
// ─────────────────────────────────────────────
function NoActiveEvent() {
  const nextMonthName = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1
  ).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <ArcaneBox color={C.borderMid} style={{ marginTop: 10 }}>
      <View style={{ alignItems: "center", paddingVertical: 20 }}>
        <ThemedText style={{ fontSize: 32, marginBottom: 12 }}>⬡</ThemedText>
        <ThemedText style={{ color: C.parchment, fontWeight: "900", fontSize: 15, letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>
          NO HAY RITUAL EN CURSO
        </ThemedText>
        <ThemedText style={{ color: C.slate, fontSize: 11, lineHeight: 18, textAlign: "center", maxWidth: 320 }}>
          Los rituales de quema se abren siempre el día 1 de cada mes y duran 72 horas.
        </ThemedText>
        <ThemedText style={{ color: C.crimson, fontSize: 11, fontWeight: "700", marginTop: 10, letterSpacing: 1 }}>
          Próxima apertura: 1° de {nextMonthName}
        </ThemedText>
      </View>
    </ArcaneBox>
  );
}

// ─────────────────────────────────────────────
// CONTADOR DE VENTA — cuenta regresiva hasta que cierra la venta
// de tickets (date_start + sale_window_hours, ej. 72hs).
// ─────────────────────────────────────────────
function SaleCountdown({ event, saleWindowHours }: { event: ActiveEvent; saleWindowHours: number }) {
  // date_start ya es un timestamptz preciso (el momento exacto en que
  // el evento pasó a 'activo'), así que esto SÍ arranca en 72:00 justos.
  const deadline = new Date(event.date_start).getTime() + saleWindowHours * 3600 * 1000;
  const cd = useCountdown(deadline);
  if (!cd) return null;

  const totalHours = cd.days * 24 + cd.hours; // sin desglosar en días
  const urgent = totalHours < 6;

  return (
    <ArcaneBox color={urgent ? C.crimsonBrt : C.crimson} style={{ marginBottom: 14 }} elevated>
      <View style={{ alignItems: "center" }}>
        <ThemedText style={[sc.label, urgent && { color: C.crimsonBrt }]}>
          {cd.expired ? "⏰ VENTANA DE VENTA CERRADA" : "⏳ TIEMPO PARA PARTICIPAR"}
        </ThemedText>
        {!cd.expired && (
          <>
            <View style={sc.row}>
              <ThemedText style={[sc.num, urgent && { color: C.crimsonBrt }]}>{pad2(totalHours)}</ThemedText>
              <ThemedText style={[sc.colon, urgent && { color: C.crimsonBrt }]}>:</ThemedText>
              <ThemedText style={[sc.num, urgent && { color: C.crimsonBrt }]}>{pad2(cd.minutes)}</ThemedText>
            </View>
            <View style={sc.labelsRow}>
              <ThemedText style={sc.unitLabel}>HORAS</ThemedText>
              <ThemedText style={sc.unitLabel}>MINUTOS</ThemedText>
            </View>
            <ThemedText style={sc.sub}>
              La venta de tickets cierra {urgent ? "muy pronto" : `en ~${totalHours}hs`} — después pasa a la ventana de Swap.
            </ThemedText>
          </>
        )}
      </View>
    </ArcaneBox>
  );
}
const sc = StyleSheet.create({
  label: { color: C.crimson, fontWeight: "900", fontSize: 12, letterSpacing: 2, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  num: { color: C.crimson, fontWeight: "900", fontSize: 42, fontFamily: "monospace", lineHeight: 46, minWidth: 68, textAlign: "center" },
  colon: { color: C.crimson, fontWeight: "900", fontSize: 34, marginTop: -6 },
  labelsRow: { flexDirection: "row", gap: 46, marginBottom: 10 },
  unitLabel: { color: C.slate, fontSize: 9, letterSpacing: 1.5, minWidth: 68, textAlign: "center" },
  sub: { color: C.slate, fontSize: 10, textAlign: "center", marginTop: 4 },
});

// ─────────────────────────────────────────────
// NIVEL DEL RITUAL — barra de progreso, todo en SLP (USD como referencia)
// ─────────────────────────────────────────────
function RitualLevelMeter({ event }: { event: ActiveEvent }) {
  const { price: slpPrice, loading: priceLoading } = useSlpPrice();

  const config = getLevelConfig(event.ritual_level + 1);

  // El pool vive en SLP. Lo convertimos a USD con el precio actual
  // SOLO para comparar contra el umbral (que está fijo en USD).
  const poolUsdEquiv = event.rewards_pool_slp * slpPrice;
  const xpPercent = Math.min((poolUsdEquiv / config.threshold) * 100, 100);

  const remainingUsd = Math.max(config.threshold - poolUsdEquiv, 0);
  const remainingSlp = usdToSlp(remainingUsd, slpPrice);

  // Izquierda + derecha siempre deben sumar el umbral del nivel actual.
  // Izquierda = lo que ya se acumuló en el pool DE ESTE NIVEL (0 → ahora).
  // Al subir de nivel, rewards_pool_slp se resetea (menos lo gastado en el
  // milestone anterior), así que esto vuelve a arrancar cerca de 0 — es
  // el comportamiento esperado, no un bug.
  const poolAccumulatedSlp = event.rewards_pool_slp;
  const poolAccumulatedUsd = poolUsdEquiv;

  return (
    <ArcaneBox color={C.ember} style={{ marginBottom: 14 }}>
      <View style={lm.headerRow}>
        <View style={{ flex: 1 }}>
          <ThemedText style={lm.sectionLabel}>NIVEL DEL RITUAL</ThemedText>
          <ThemedText style={lm.sublabel}>
            Cada nivel desbloquea rewards en SLP para el sorteo
          </ThemedText>
        </View>
        <View style={[lm.levelBadge, { borderColor: C.ember }]}>
          <ThemedText style={lm.levelNum}>{event.ritual_level}</ThemedText>
          <ThemedText style={lm.levelWord}>LVL</ThemedText>
        </View>
      </View>

      <View style={lm.xpContainer}>
        <ThemedText style={lm.xpLabel}>XP</ThemedText>
        <View style={lm.xpBarOuter}>
          {Array.from({ length: 10 }).map((_, i) => {
            const filled = (i / 10) * 100 < xpPercent;
            return (
              <View key={i} style={[lm.xpSegment, filled ? { backgroundColor: C.ember } : { backgroundColor: C.border }]} />
            );
          })}
        </View>
      </View>
      <ThemedText style={lm.xpNumbersFull}>
        {fmtSlp(event.rewards_pool_slp)} / {fmtSlp(usdToSlp(config.threshold, slpPrice))} SLP
        <ThemedText style={lm.xpNumbersUsd}> (~${poolUsdEquiv.toFixed(2)} / ${config.threshold} USD)</ThemedText>
      </ThemedText>

      <View style={lm.infoRow}>
        <View style={lm.infoItem}>
          <ThemedText style={lm.infoVal}>{priceLoading ? "..." : fmtSlp(poolAccumulatedSlp)}</ThemedText>
          <ThemedText style={lm.infoKey}>ACUMULADO ESTE NIVEL</ThemedText>
          <ThemedText style={lm.infoKeyUsd}>(~${poolAccumulatedUsd.toFixed(2)})</ThemedText>
        </View>
        <View style={[lm.infoDiv, { backgroundColor: C.borderMid }]} />
        <View style={lm.infoItem}>
          <ThemedText style={lm.infoVal}>{event.ritual_level}</ThemedText>
          <ThemedText style={lm.infoKey}>NIVEL ACTUAL</ThemedText>
        </View>
        <View style={[lm.infoDiv, { backgroundColor: C.borderMid }]} />
        <View style={lm.infoItem}>
          <ThemedText style={lm.infoVal}>{priceLoading ? "..." : fmtSlp(remainingSlp)}</ThemedText>
          <ThemedText style={lm.infoKey}>SLP P/ PRÓX. NIVEL</ThemedText>
          <ThemedText style={lm.infoKeyUsd}>(~${remainingUsd.toFixed(2)})</ThemedText>
        </View>
      </View>

      <View style={[lm.nextReward, { borderColor: C.ember + "50" }]}>
        <ThemedText style={lm.nextRewardLabel}>
          ⚡ AL LLEGAR A {fmtSlp(usdToSlp(config.threshold, slpPrice))} SLP (NIVEL {event.ritual_level + 1})
        </ThemedText>
        <ThemedText style={lm.nextRewardVal}>
          {config.rewards
            .map((r) => `x${r.count} reward${r.count > 1 ? "s" : ""} de ${fmtSlp(usdToSlp(r.amount, slpPrice))} SLP (~$${r.amount})`)
            .join(" + ")}
        </ThemedText>
      </View>
    </ArcaneBox>
  );
}
const lm = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  sectionLabel: { color: C.ember, fontWeight: "900", fontSize: 13, letterSpacing: 2, marginBottom: 3 },
  sublabel: { color: C.slate, fontSize: 10, lineHeight: 14 },
  levelBadge: { width: 52, height: 52, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  levelNum: { color: C.ember, fontWeight: "900", fontSize: 22, lineHeight: 24 },
  levelWord: { color: C.slate, fontSize: 8, letterSpacing: 2 },
  xpContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  xpLabel: { color: C.slate, fontSize: 9, letterSpacing: 1, width: 20 },
  xpBarOuter: { flex: 1, flexDirection: "row", gap: 2, height: 14 },
  xpSegment: { flex: 1, height: "100%" },
  xpNumbers: { color: C.parchment, fontSize: 9, fontFamily: "monospace", width: 70, textAlign: "right" },
  xpNumbersFull: { color: C.parchment, fontSize: 11, fontFamily: "monospace", textAlign: "center", marginBottom: 12, fontWeight: "700" },
  xpNumbersUsd: { color: C.slate, fontSize: 9, fontWeight: "400" },
  infoKeyUsd: { color: C.slate, fontSize: 7, textAlign: "center", marginTop: 1 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  infoItem: { flex: 1, alignItems: "center" },
  infoVal: { color: C.ember, fontWeight: "900", fontSize: 15 },
  infoKey: { color: C.slate, fontSize: 7, letterSpacing: 1, textAlign: "center", marginTop: 2 },
  infoDiv: { width: 1, height: 28 },
  nextReward: { borderWidth: 1, borderLeftWidth: 3, padding: 10, borderLeftColor: C.ember },
  nextRewardLabel: { color: C.ember, fontSize: 9, letterSpacing: 1.5, marginBottom: 4 },
  nextRewardVal: { color: C.parchment, fontSize: 12, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// COMPRE SU TICKET — cambia según estado de wallet
// ─────────────────────────────────────────────
function TicketCTA({ event, onBought }: { event: ActiveEvent; onBought: () => void }) {
  const { isAuthenticated, address, isConnecting, isVerifying } = useWallet();
  const { price: slpPrice, loading: priceLoading } = useSlpPrice();
  const router = useRouter();
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  const ticketCostSlp = usdToSlp(event.ticket_price_usd, slpPrice);
  const isLoading = isConnecting || isVerifying;

  const handlePress = () => {
    if (isAuthenticated) {
      setBuyModalOpen(true);
    } else {
      // El login con wallet vive en /profile — ahí es donde se conecta.
      router.push("/profile");
    }
  };

  return (
    <ArcaneBox color={C.crimson} style={{ marginBottom: 14 }}>
      <ThemedText style={tc.mainLabel}>COMPRE SU TICKET</ThemedText>
      <ThemedText style={tc.costLine}>
        Actualmente al coste de{" "}
        <ThemedText style={tc.costVal}>
          {priceLoading ? "..." : fmtSlp(ticketCostSlp)} SLP
        </ThemedText>
      </ThemedText>
      <ThemedText style={tc.equiv}>(~${event.ticket_price_usd.toFixed(2)} USD al precio actual)</ThemedText>

      <View style={tc.divider} />

      {isAuthenticated && (
        <View style={tc.walletRow}>
          <View style={tc.walletDot} />
          <ThemedText style={tc.walletTxt}>
            {address?.slice(0, 8)}...{address?.slice(-6)}
          </ThemedText>
        </View>
      )}

      <TouchableOpacity style={tc.btn} activeOpacity={0.8} onPress={handlePress} disabled={isLoading}>
        <View style={[tc.btnSideL, { borderColor: C.crimson }]} />
        <View style={tc.btnInner}>
          <ThemedText style={tc.btnIcon}>⚔️</ThemedText>
          <ThemedText style={tc.btnText}>
            {isLoading
              ? "CONECTANDO..."
              : isAuthenticated
              ? "COMPRAR TICKET"
              : "INICIAR SESIÓN PARA PARTICIPAR"}
          </ThemedText>
          <ThemedText style={tc.btnIcon}>⚔️</ThemedText>
        </View>
        <View style={[tc.btnSideR, { borderColor: C.crimson }]} />
      </TouchableOpacity>
      {!isAuthenticated && (
        <ThemedText style={[tc.disclaimer, { marginTop: 6 }]}>
          Te va a llevar a tu perfil para conectar la wallet. Volvé después a comprar.
        </ThemedText>
      )}

      {isAuthenticated && address && (
        <BuyTicketsModal
          visible={buyModalOpen}
          onClose={() => setBuyModalOpen(false)}
          activeEvent={{ id: event.id, ticket_price_usd: event.ticket_price_usd }}
          address={address}
          slpPrice={slpPrice}
          onBought={() => { setBuyModalOpen(false); onBought(); }}
        />
      )}

      <ThemedText style={tc.disclaimer}>
        Ventana activa · cierra el{" "}
        {new Date(event.date_end).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
      </ThemedText>
    </ArcaneBox>
  );
}
const tc = StyleSheet.create({
  mainLabel: { color: C.crimson, fontWeight: "900", fontSize: 16, letterSpacing: 3, textAlign: "center", marginBottom: 6 },
  costLine: { color: C.parchment, fontSize: 13, textAlign: "center" },
  costVal: { color: C.goldBrt, fontWeight: "900" },
  equiv: { color: C.slate, fontSize: 10, textAlign: "center", marginBottom: 10 },
  divider: { height: 1, backgroundColor: C.borderMid, marginBottom: 12 },
  walletRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 },
  walletDot: { width: 6, height: 6, backgroundColor: C.greenBrt, borderRadius: 3 },
  walletTxt: { color: C.greenBrt, fontSize: 10, fontFamily: "monospace", letterSpacing: 0.5 },
  btn: { borderWidth: 2, borderColor: C.crimson, flexDirection: "row", alignItems: "center", backgroundColor: C.surface2, marginBottom: 10 },
  btnSideL: { width: 4, alignSelf: "stretch", borderRightWidth: 1 },
  btnSideR: { width: 4, alignSelf: "stretch", borderLeftWidth: 1 },
  btnInner: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14 },
  btnIcon: { fontSize: 16 },
  btnText: { color: C.crimsonBrt, fontWeight: "900", fontSize: 13, letterSpacing: 2, textAlign: "center" },
  disclaimer: { color: C.slate, fontSize: 9, letterSpacing: 1, textAlign: "center" },
});

// ─────────────────────────────────────────────
// REWARDS DESBLOQUEADAS — desde level_rewards_unlocked
// ─────────────────────────────────────────────
function UnlockedRewardsList({ rewards }: { rewards: RewardUnlocked[] }) {
  if (rewards.length === 0) {
    return (
      <ArcaneBox color={C.borderMid}>
        <ThemedText style={{ color: C.slate, fontSize: 11, textAlign: "center", paddingVertical: 8 }}>
          Todavía no se desbloqueó ninguna reward. Llegá a $50 en el pool de recompensas para la primera.
        </ThemedText>
      </ArcaneBox>
    );
  }

  // Agrupar por nivel para mostrar "rectángulos" por nivel, como se pidió
  const byLevel = rewards.reduce<Record<number, RewardUnlocked[]>>((acc, r) => {
    (acc[r.level_reached] ??= []).push(r);
    return acc;
  }, {});

  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

  return (
    <View style={{ gap: 10 }}>
      {levels.map((level) => {
        const group = byLevel[level];
        // Agrupar también por monto dentro del nivel (ej: x1 $50 + x2 $100)
        const byAmount = group.reduce<Record<number, number>>((acc, r) => {
          acc[r.amount_usd] = (acc[r.amount_usd] ?? 0) + 1;
          return acc;
        }, {});

        return (
          <ArcaneBox key={level} color={C.greenBrt}>
            <View style={ur.levelHeader}>
              <View style={[ur.levelTag, { borderColor: C.greenBrt + "60" }]}>
                <ThemedText style={ur.levelTagTxt}>NIVEL {level}</ThemedText>
              </View>
              <ThemedText style={ur.levelDesc}>
                Rewards de nivel {level}:{" "}
                {Object.entries(byAmount)
                  .map(([amount, count]) => `x${count} ${count > 1 ? "rewards" : "reward"} (~$${amount} en SLP)`)
                  .join(" + ")}
              </ThemedText>
            </View>

            <View style={ur.grid}>
              {group
                .sort((a, b) => a.draw_order - b.draw_order)
                .map((r) => (
                  <View key={r.id} style={[ur.rewardBox, { borderColor: statusColor(r.status) + "60" }]}>
                    <ThemedText style={ur.drawOrder}>SORTEO #{r.draw_order}</ThemedText>
                    <ThemedText style={[ur.rewardAmount, { color: statusColor(r.status) }]}>
                      {fmtSlp(r.slp_equivalent)}
                    </ThemedText>
                    <ThemedText style={ur.rewardSlp}>SLP (~${r.amount_usd})</ThemedText>
                    <ThemedText style={[ur.rewardStatus, { color: statusColor(r.status) }]}>
                      {statusLabel(r.status)}
                    </ThemedText>
                    {r.status === "entregada" && r.winner_wallet && (
                      <ThemedText style={ur.winnerWallet} numberOfLines={1}>
                        {r.winner_wallet.slice(0, 6)}...{r.winner_wallet.slice(-4)}
                      </ThemedText>
                    )}
                  </View>
                ))}
            </View>
          </ArcaneBox>
        );
      })}
    </View>
  );
}
function statusColor(status: RewardUnlocked["status"]) {
  return status === "entregada" ? C.greenBrt : C.goldBrt;
}
function statusLabel(status: RewardUnlocked["status"]) {
  return status === "entregada" ? "✓ ENTREGADA" : "⏳ PENDING-REWARD";
}
const ur = StyleSheet.create({
  levelHeader: { marginBottom: 10 },
  levelTag: { borderWidth: 1, alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  levelTagTxt: { color: C.greenBrt, fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  levelDesc: { color: C.parchment, fontSize: 11, lineHeight: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rewardBox: { borderWidth: 1, padding: 10, minWidth: 100, flexGrow: 1, alignItems: "center", backgroundColor: C.surface2 },
  drawOrder: { color: C.slate, fontSize: 7, letterSpacing: 1, marginBottom: 4 },
  rewardAmount: { fontWeight: "900", fontSize: 16 },
  rewardSlp: { color: C.slate, fontSize: 7, letterSpacing: 1, marginBottom: 4 },
  rewardStatus: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  winnerWallet: { color: C.parchment, fontSize: 9, marginTop: 4, fontFamily: "monospace" },
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function MilestoneScreen() {
  const { isWide, hPad } = useLayout();

  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [rewards, setRewards] = useState<RewardUnlocked[]>([]);
  const [saleWindowHours, setSaleWindowHours] = useState(72); // fallback hasta que cargue system_config
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActiveEvent = useCallback(async () => {
    const [{ data: eventData, error: eventError }, { data: configData }] = await Promise.all([
      supabase
        .from("events")
        .select("id, event_number, label, date_start, date_end, status, ritual_level, rewards_pool_slp, rewards_pool_usd, total_raised_usd, ticket_price_usd")
        .eq("status", "activo")
        .limit(1)
        .maybeSingle(),
      supabase.from("system_config").select("value").eq("key", "sale_window_hours").maybeSingle(),
    ]);

    if (configData?.value) {
      const parsed = parseInt(configData.value, 10);
      if (!isNaN(parsed)) setSaleWindowHours(parsed);
    }

    if (eventError) {
      console.error("[Milestone] Error cargando evento activo:", eventError);
      setEvent(null);
      setRewards([]);
      return;
    }

    setEvent(eventData ?? null);

    if (eventData) {
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("level_rewards_unlocked")
        .select("id, level_reached, amount_usd, slp_equivalent, status, winner_wallet, draw_order")
        .eq("event_id", eventData.id)
        .order("draw_order", { ascending: true });

      if (rewardsError) {
        console.error("[Milestone] Error cargando rewards:", rewardsError);
        setRewards([]);
      } else {
        setRewards(rewardsData ?? []);
      }
    } else {
      setRewards([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadActiveEvent().finally(() => setLoading(false));
  }, [loadActiveEvent]);

  // ── REALTIME — cualquier cambio en events o rewards recarga automático ──
  // Esto es lo que permite que el panel de Test (en otra pestaña) se
  // refleje acá sin tener que recargar la página manualmente.
  // Recarga cada vez que volvés a esta pantalla.
  useFocusEffect(useCallback(() => { loadActiveEvent(); }, [loadActiveEvent]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActiveEvent();
    setRefreshing(false);
  }, [loadActiveEvent]);

  return (
    <SafeAreaView style={s.safe}>
      <ArcadeHeader eventNumber={event?.event_number ?? null} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.crimson} />}
      >
        {loading ? (
          <ThemedText style={{ color: C.slate, textAlign: "center", marginTop: 40 }}>
            Cargando ritual...
          </ThemedText>
        ) : !event ? (
          <>
            <RuneDivider label="Estado del Ritual" />
            <NoActiveEvent />
          </>
        ) : (
          <>
            {/* ── 0. CONTADOR DE VENTA ── */}
            <SaleCountdown event={event} saleWindowHours={saleWindowHours} />

            {/* ── 1. NIVEL DEL RITUAL ── */}
            <RuneDivider label="Nivel del Ritual" />
            <RitualLevelMeter event={event} />

            {/* ── 2. COMPRE SU TICKET ── */}
            <RuneDivider label="Compre su Ticket" />
            <TicketCTA event={event} onBought={loadActiveEvent} />

            {/* ── 3. REWARDS DESBLOQUEADAS ── */}
            <RuneDivider label="Rewards Desbloqueadas" />
            <UnlockedRewardsList rewards={rewards} />
          </>
        )}

        {/* ── TESORERÍA ── */}
        <RuneDivider label="Dirección del tesoro" />
        <ArcaneBox color={C.gold}>
          <ThemedText style={tr.label}>VERIFICACIÓN ON-CHAIN</ThemedText>
          <ThemedText style={tr.desc}>
            Todas las transacciones del proyecto (compras, quemas, swaps y entregas de premios) son públicas y verificables en la blockchain de Ronin.
          </ThemedText>
          <TouchableOpacity style={tr.btn} onPress={() => Linking.openURL(TREASURY_EXPLORER_URL)}>
            <ThemedText style={tr.btnTxt}>⬡ VER EN RONIN EXPLORER →</ThemedText>
          </TouchableOpacity>
        </ArcaneBox>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerLine} />
          <ThemedText style={s.footerTxt}>✡</ThemedText>
          <View style={s.footerLine} />
        </View>
        <ThemedText style={s.cultText}>Be one of US, be a Fynolts Cultist</ThemedText>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const tr = StyleSheet.create({
  label: { color: C.slate, fontSize: 8, letterSpacing: 2, marginBottom: 8 },
  desc: { color: C.parchment, fontSize: 11, lineHeight: 17, marginBottom: 12 },
  btn: { borderWidth: 1, borderColor: C.gold + "60", padding: 8, alignItems: "center" },
  btnTxt: { color: C.gold, fontSize: 9, letterSpacing: 2, fontWeight: "700" },
});

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 60 },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 8 },
  footerLine: { flex: 1, height: 1, backgroundColor: C.border },
  footerTxt: { color: C.borderMid, fontSize: 14, marginHorizontal: 12 },
  cultText: { color: C.borderMid, fontSize: 9, letterSpacing: 2, textAlign: "center", fontStyle: "italic", marginBottom: 10 },
});