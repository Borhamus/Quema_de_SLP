/**
 * app/(tabs)/index.tsx — HOME
 *
 * 100% conectado a Supabase. Sin eventos hardcodeados, sin pools
 * ficticios. Todo lo que se muestra viene de la base de datos:
 *   - Evento activo (si hay) con sus pools reales en SLP
 *   - Últimos 3 eventos mensuales completados (reales)
 *   - Histórico de eventos anuales completados (nuevo)
 *   - Realtime: se actualiza solo cuando cambian los datos
 */

import { ThemedText } from "@/components/themed-text";
import { fmtSlp, useSlpPrice } from "@/hooks/use-slp-price";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── PALETA (consistente con el resto de la app) ─────────────
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
  greenBrt: "#6abf5e",
  slate: "#5a5a6a",
  parchment: "#C8BEB0",
};

function useLayout() {
  const { width } = useWindowDimensions();
  const w = width >= 600;
  return { isWide: w, hPad: w ? 32 : 16, cardW: w ? Math.min(width * 0.44, 340) : width - 56 };
}

// ─── UI BASE (idéntico al resto de la app) ───────────────────
function Brackets({ color = C.crimson, sz = 8 }: { color?: string; sz?: number }) {
  const b: any = { position: "absolute", width: sz, height: sz };
  return (<><View style={[b, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1, borderColor: color }]} /><View style={[b, { top: 0, right: 0, borderTopWidth: 1, borderRightWidth: 1, borderColor: color }]} /><View style={[b, { bottom: 0, left: 0, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: color }]} /><View style={[b, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1, borderColor: color }]} /></>);
}
function ABox({ children, style, color = C.crimson }: { children: React.ReactNode; style?: any; color?: string }) {
  return (<View style={[{ position: "relative", marginBottom: 4 }, style]}><View style={{ position: "absolute", top: 3, left: 3, right: -3, bottom: -3, backgroundColor: C.bg, borderWidth: 1, borderColor: color + "33" }} /><View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: color + "55", padding: 14, position: "relative" }}><Brackets color={color} />{children}</View></View>);
}
function Rune({ label }: { label: string }) {
  return (<View style={rn.w}><View style={rn.l} /><View style={rn.m}><ThemedText style={rn.h}>⬡</ThemedText><ThemedText style={rn.t}>{label.toUpperCase()}</ThemedText><ThemedText style={rn.h}>⬡</ThemedText></View><View style={rn.l} /></View>);
}
const rn = StyleSheet.create({ w: { flexDirection: "row", alignItems: "center", marginVertical: 20 }, l: { flex: 1, height: 1, backgroundColor: C.borderMid }, m: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 10 }, h: { color: C.crimson, fontSize: 9 }, t: { color: C.crimson, fontSize: 9, letterSpacing: 3, fontWeight: "700" } });

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [o, setO] = useState(false);
  return (<><TouchableOpacity style={ac.h} onPress={() => setO(!o)} activeOpacity={0.7}><ThemedText style={ac.t}>{title}</ThemedText><ThemedText style={{ color: C.crimson, fontSize: 10 }}>{o ? "▲" : "▼"}</ThemedText></TouchableOpacity>{o && <View style={{ paddingTop: 14 }}>{children}</View>}</>);
}
const ac = StyleSheet.create({ h: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderMid }, t: { color: C.parchment, fontWeight: "700", fontSize: 13, letterSpacing: 0.8 } });

function DistTable({ title, rows }: { title: string; rows: { name: string; pct: string; purpose: string; color: string }[] }) {
  return (
    <View style={dt.box}>
      <ThemedText style={dt.title}>{title}</ThemedText>
      <View style={dt.header}><ThemedText style={[dt.hcol, { flex: 1.2 }]}>COMPONENTE</ThemedText><ThemedText style={[dt.hcol, { flex: 0.6, textAlign: "center" }]}>%</ThemedText><ThemedText style={[dt.hcol, { flex: 2 }]}>PROPÓSITO</ThemedText></View>
      {rows.map(r => (
        <View key={r.name} style={dt.row}>
          <ThemedText style={[dt.cell, { flex: 1.2, color: r.color, fontWeight: "700" }]}>{r.name}</ThemedText>
          <ThemedText style={[dt.cell, { flex: 0.6, textAlign: "center", color: r.color, fontWeight: "900" }]}>{r.pct}</ThemedText>
          <ThemedText style={[dt.cell, { flex: 2 }]}>{r.purpose}</ThemedText>
        </View>
      ))}
    </View>
  );
}
const dt = StyleSheet.create({
  box: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 14 },
  title: { color: C.parchment, fontWeight: "800", fontSize: 12, letterSpacing: 1, marginBottom: 10, textAlign: "center" },
  header: { flexDirection: "row", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.borderMid, marginBottom: 4 },
  hcol: { color: C.borderMid, fontSize: 7, letterSpacing: 1.5 },
  row: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border + "50" },
  cell: { color: C.slate, fontSize: 10, lineHeight: 15 },
});

// ─── TIPOS — datos reales de Supabase ─────────────────────────
type ActiveEventData = {
  id: string;
  event_number: number;
  label: string;
  status: string;
  rewards_pool_slp: number;
  swap_pool_slp: number;
  burn_pool_slp: number;
  ops_pool_slp: number;
  special_pool_slp: number;
};

type PastEvent = {
  id: string;
  event_number: number;
  label: string;
  date_start: string;
  total_raised_slp: number;
  axies_released: number;
  ritual_level: number;
  rewards_count: number;
};

type AnnualEventHistory = {
  id: string;
  year: number;
  pool_total_slp: number;
  reward_slp_each: number;
  completed_at: string | null;
  participants_count: number;
  winners_count: number;
};

// ─── POOLS — en vivo, desde el evento activo ──────────────────
function ActivePoolCard({ name, emoji, slp, pct, color, dim, slpPrice }: { name: string; emoji: string; slp: number; pct: number; color: string; dim: string; slpPrice: number }) {
  const usdEquiv = slp * slpPrice;
  return (
    <ABox style={{ marginBottom: 10 }} color={color}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <View style={{ width: 34, height: 34, borderWidth: 1, borderColor: color + "44", backgroundColor: dim, justifyContent: "center", alignItems: "center" }}><ThemedText style={{ fontSize: 15 }}>{emoji}</ThemedText></View>
      </View>
      <ThemedText style={{ color, fontWeight: "800", fontSize: 11, letterSpacing: 1.5, marginBottom: 5 }}>{name}</ThemedText>
      <View style={{ height: 1, backgroundColor: color + "30", marginBottom: 10 }} />
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, alignItems: "center" }}><ThemedText style={{ color, fontWeight: "900", fontSize: 16 }}>{pct}%</ThemedText><ThemedText style={{ color: C.slate, fontSize: 7, letterSpacing: 1.5, marginTop: 2 }}>DEL TICKET</ThemedText></View>
        <View style={{ width: 1, height: 28, backgroundColor: color + "30", marginHorizontal: 8 }} />
        <View style={{ flex: 1.4, alignItems: "center" }}>
          <ThemedText style={{ color, fontWeight: "900", fontSize: 14 }}>{fmtSlp(slp)} SLP</ThemedText>
          <ThemedText style={{ color: C.slate, fontSize: 7, letterSpacing: 1, marginTop: 2 }}>~${usdEquiv.toFixed(2)} USD</ThemedText>
        </View>
      </View>
    </ABox>
  );
}

// ─── EVENT ROW — eventos mensuales históricos ─────────────────
function EventRow({ event }: { event: PastEvent }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/ritual/${event.id}`)} activeOpacity={0.8}>
      <ABox style={{ marginBottom: 8 }} color={C.crimson}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <ThemedText style={{ color: C.crimson, fontSize: 16 }}>✡</ThemedText>
          <ThemedText style={{ flex: 1, color: C.parchment, fontSize: 13, fontWeight: "700" }}>
            Ritual #{event.event_number} — {event.label}
          </ThemedText>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          <View style={[ev.pill, { backgroundColor: C.crimsonGlow, borderColor: C.crimson }]}>
            <ThemedText style={[ev.pt, { color: C.crimson }]}>💰 {fmtSlp(event.total_raised_slp)} SLP</ThemedText>
          </View>
          <View style={[ev.pill, { backgroundColor: C.crimsonGlow, borderColor: C.crimson }]}>
            <ThemedText style={[ev.pt, { color: C.crimson }]}>⚡ {event.axies_released} Axies</ThemedText>
          </View>
          <View style={[ev.pill, { backgroundColor: C.goldDim, borderColor: C.gold }]}>
            <ThemedText style={[ev.pt, { color: C.goldBrt }]}>⚔️ Nivel {event.ritual_level}</ThemedText>
          </View>
        </View>
      </ABox>
    </TouchableOpacity>
  );
}
const ev = StyleSheet.create({ pill: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 }, pt: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 } });

// ─── ANNUAL EVENT ROW — histórico de eventos anuales ──────────
function AnnualEventRow({ event }: { event: AnnualEventHistory }) {
  return (
    <ABox style={{ marginBottom: 8 }} color={C.goldBrt}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <ThemedText style={{ color: C.goldBrt, fontSize: 16 }}>🗝️</ThemedText>
        <ThemedText style={{ flex: 1, color: C.parchment, fontSize: 13, fontWeight: "700" }}>
          Evento Anual {event.year}
        </ThemedText>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        <View style={[ev.pill, { backgroundColor: C.goldDim, borderColor: C.goldBrt }]}>
          <ThemedText style={[ev.pt, { color: C.goldBrt }]}>💰 Pool: {fmtSlp(event.pool_total_slp)} SLP</ThemedText>
        </View>
        <View style={[ev.pill, { backgroundColor: C.goldDim, borderColor: C.goldBrt }]}>
          <ThemedText style={[ev.pt, { color: C.goldBrt }]}>🏆 {event.winners_count} ganadores</ThemedText>
        </View>
        <View style={[ev.pill, { backgroundColor: C.crimsonGlow, borderColor: C.crimson }]}>
          <ThemedText style={[ev.pt, { color: C.crimson }]}>👥 {event.participants_count} llaves participantes</ThemedText>
        </View>
      </View>
      {event.completed_at && (
        <ThemedText style={{ color: C.slate, fontSize: 9, marginTop: 6 }}>
          Sorteado el {new Date(event.completed_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
        </ThemedText>
      )}
    </ABox>
  );
}

// ─── LINK BUTTON ───────────────────────────────────────────────
function LinkBtn({ emoji, label, sub, url, hl }: { emoji: string; label: string; sub: string; url: string; hl?: boolean }) {
  return (<TouchableOpacity onPress={() => Linking.openURL(url)} activeOpacity={0.8}><ABox style={{ marginBottom: 10 }} color={hl ? C.crimson : C.borderMid}><View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><View style={{ width: 34, height: 34, borderWidth: 1, borderColor: hl ? C.crimson : C.borderMid, justifyContent: "center", alignItems: "center" }}><ThemedText style={{ fontSize: 15 }}>{emoji}</ThemedText></View><View style={{ flex: 1 }}><ThemedText style={{ color: hl ? C.crimson : C.parchment, fontWeight: "700", fontSize: 13 }}>{label}</ThemedText><ThemedText style={{ color: C.slate, fontSize: 11, marginTop: 2 }}>{sub}</ThemedText></View><ThemedText style={{ color: hl ? C.crimson : C.slate, fontSize: 12 }}>↗</ThemedText></View></ABox></TouchableOpacity>);
}

// ═══════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════
export default function HomeScreen() {
  const { isWide, hPad } = useLayout();
  const router = useRouter();
  const { price: slpPrice } = useSlpPrice();

  const [activeEvent, setActiveEvent] = useState<ActiveEventData | null>(null);
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [annualHistory, setAnnualHistory] = useState<AnnualEventHistory[]>([]);
  const [globalStats, setGlobalStats] = useState({ totalSlpBurned: 0, totalAxiesReleased: 0, totalEvents: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    // ── Evento activo (si hay) ──
    const { data: active } = await supabase
      .from("events")
      .select("id, event_number, label, status, rewards_pool_slp, swap_pool_slp, burn_pool_slp, ops_pool_slp, special_pool_slp")
      .in("status", ["activo", "swap"])
      .order("event_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveEvent(active ?? null);

    // ── Últimos 3 eventos mensuales completados (reales) ──
    const { data: completed } = await supabase
      .from("events")
      .select("id, event_number, label, date_start, total_raised_slp, axies_released, ritual_level")
      .eq("status", "completado")
      .gt("event_number", 0) // excluye eventos de test (negativos) y TESTEVENTO (0)
      .order("event_number", { ascending: false })
      .limit(3);

    if (completed) {
      const withRewards = await Promise.all(
        completed.map(async (e) => {
          const { count } = await supabase
            .from("level_rewards_unlocked")
            .select("id", { count: "exact", head: true })
            .eq("event_id", e.id);
          return { ...e, rewards_count: count ?? 0 };
        })
      );
      setPastEvents(withRewards);
    }

    // ── Stats globales — agregados de TODOS los eventos reales completados ──
    const { data: allCompleted } = await supabase
      .from("events")
      .select("burn_pool_slp, axies_released")
      .eq("status", "completado")
      .gt("event_number", 0);

    if (allCompleted) {
      setGlobalStats({
        totalSlpBurned: allCompleted.reduce((a, e) => a + (e.burn_pool_slp ?? 0), 0),
        totalAxiesReleased: allCompleted.reduce((a, e) => a + (e.axies_released ?? 0), 0),
        totalEvents: allCompleted.length,
      });
    }

    // ── Histórico de eventos anuales completados ──
    const { data: annualEvents } = await supabase
      .from("annual_event")
      .select("id, year, pool_total_slp, reward_slp_each, completed_at")
      .eq("status", "completado")
      .order("year", { ascending: false });

    if (annualEvents) {
      const withCounts = await Promise.all(
        annualEvents.map(async (ae) => {
          const { count: winnersCount } = await supabase
            .from("annual_rewards")
            .select("id", { count: "exact", head: true })
            .eq("annual_event_id", ae.id)
            .eq("status", "entregada");

          const { count: participantsCount } = await supabase
            .from("annual_keys")
            .select("id", { count: "exact", head: true })
            .eq("year", ae.year);

          return {
            ...ae,
            winners_count: winnersCount ?? 0,
            participants_count: participantsCount ?? 0,
          };
        })
      );
      setAnnualHistory(withCounts);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // ── REALTIME — se actualiza solo cuando cambian eventos o annual_event ──
  useEffect(() => {
    const channel = supabase
      .channel("home-live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "annual_event" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "annual_pool" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const eventNumberLabel = activeEvent ? String(activeEvent.event_number).padStart(2, "0") : "--";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── ARCADE HEADER ── */}
      <View style={hd.w}>
        <View style={{ height: 2, backgroundColor: C.crimson, marginBottom: 10 }} />
        <View style={hd.row}>
          <View><ThemedText style={hd.lbl}>CULTO</ThemedText><ThemedText style={hd.val}>FYNOLT'S CULT</ThemedText></View>
          <ThemedText style={{ color: C.crimson, fontSize: 22 }}>✡</ThemedText>
          <View style={{ alignItems: "flex-end" }}><ThemedText style={hd.lbl}>VERSION</ThemedText><ThemedText style={hd.val}>0.01</ThemedText></View>
        </View>
        <View style={hd.titleRow}><View style={hd.titleLine} /><ThemedText style={hd.ritual}>⬡ RITUAL DE QUEMA NÚMERO: {eventNumberLabel} ⬡</ThemedText><View style={hd.titleLine} /></View>
        <View style={{ height: 1, backgroundColor: C.borderMid, marginTop: 10 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: hPad }}>

          {/* ── HERO + FILOSOFÍA ── */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16, marginBottom: 8 }}>
            <ThemedText style={{ color: C.crimson, fontSize: 22 }}>✡</ThemedText>
            <View><ThemedText style={{ color: C.parchment, fontSize: 20, fontWeight: "900", letterSpacing: 3, textAlign: "center" }}>EVENTO DE QUEMA</ThemedText><ThemedText style={{ color: C.crimson, fontSize: 20, fontWeight: "900", letterSpacing: 6, textAlign: "center" }}>DE SLP</ThemedText></View>
            <ThemedText style={{ color: C.crimson, fontSize: 22 }}>✡</ThemedText>
          </View>

          <Rune label="Nuestra filosofía" />
          <ABox color={C.crimson} style={{ marginBottom: 14 }}>
            <ThemedText style={ph.title}>¿Por qué hacemos esto?</ThemedText>
            <ThemedText style={ph.body}>La economía de Axie Infinity enfrenta dos problemas: exceso de SLP que pierde valor constantemente, y miles de Axies de baja calidad que saturan el mercado.</ThemedText>
            <ThemedText style={ph.body}>Este proyecto crea un mecanismo deflacionario mensual que beneficia a toda la comunidad:</ThemedText>
            <View style={ph.point}><ThemedText style={ph.bullet}>🔥</ThemedText><ThemedText style={ph.body}>Quemamos SLP para reducir el supply circulante y ayudar al precio.</ThemedText></View>
            <View style={ph.point}><ThemedText style={ph.bullet}>⚡</ThemedText><ThemedText style={ph.body}>Liberamos Axies de baja calidad para desaturar el mercado.</ThemedText></View>
            <View style={ph.point}><ThemedText style={ph.bullet}>⚔️</ThemedText><ThemedText style={ph.body}>Reinvertimos en el ecosistema repartiendo SLP como rewards directas. Fomentamos la economía interna de Axie.</ThemedText></View>
            <View style={ph.point}><ThemedText style={ph.bullet}>🗝️</ThemedText><ThemedText style={ph.body}>Premiamos la constancia: los que participan todo el año acceden al evento legendario de Diciembre.</ThemedText></View>
            <ThemedText style={[ph.body, { color: C.crimson, fontWeight: "700", marginTop: 6 }]}>Todo es transparente, verificable on-chain, y registrado públicamente.</ThemedText>
          </ABox>

          {/* ── STATS (reales, agregados de la BD) ── */}
          <Rune label="Impacto histórico" />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {[
              { val: fmtSlp(globalStats.totalSlpBurned), lab: "SLP QUEMADOS", color: C.ember, em: "🔥" },
              { val: String(globalStats.totalAxiesReleased), lab: "AXIES LIBERADOS", color: C.crimson, em: "⚡" },
              { val: String(globalStats.totalEvents), lab: "RITUALES", color: C.goldBrt, em: "⬡" },
            ].map(s => (<ABox key={s.lab} style={{ flex: 1 }} color={s.color}><ThemedText style={{ fontSize: 16, textAlign: "center", marginBottom: 4 }}>{s.em}</ThemedText><ThemedText style={{ color: s.color, fontSize: 14, fontWeight: "900", textAlign: "center", marginBottom: 3 }}>{s.val}</ThemedText><ThemedText style={{ color: C.slate, fontSize: 7, textAlign: "center", letterSpacing: 2 }}>{s.lab}</ThemedText></ABox>))}
          </View>
          <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.crimson + "50", padding: 12, borderStyle: "dashed", marginBottom: 4 }} onPress={() => Linking.openURL("https://coinmarketcap.com/currencies/smooth-love-potion/")}>
            <ThemedText style={{ fontSize: 24 }}>📈</ThemedText>
            <View style={{ flex: 1 }}><ThemedText style={{ color: C.parchment, fontWeight: "700", fontSize: 13, marginBottom: 2 }}>¿Cómo impactamos en el SLP?</ThemedText><ThemedText style={{ color: C.crimson, fontSize: 11 }}>Ver precio histórico en CoinMarketCap →</ThemedText></View>
          </TouchableOpacity>

          {/* ── COMO FUNCIONA ── */}
          <Rune label="Como funciona el Ritual" />
          <Accordion title="VER EL CICLO COMPLETO DEL EVENTO">
            {[
              { icon: "📅", title: "DÍAS 1–3 · VENTA DE TICKETS", body: "Al inicio de cada mes se abre una ventana de 72 horas. Los usuarios compran tickets pagando el equivalente a $3 USD en SLP, al precio del momento. Cada ticket es un NFT que se envía a la wallet del comprador. Los fondos se dividen automáticamente en 5 pools, todo en SLP." },
              { icon: "📈", title: "DURANTE LA VENTA · NIVELES", body: "El Pool de Recompensas acumula SLP. Cada vez que ese pool (convertido a USD en tiempo real) cruza un umbral fijo, sube el Nivel del Ritual y se desbloquean rewards en SLP — congeladas al precio del momento exacto en que se alcanzan." },
              { icon: "🔄", title: "DÍA 4 · VENTANA DE SWAP (24 HS)", body: "Solo para quienes compraron al menos un ticket. El usuario entrega un Axie que no quiere y recibe el floor price actual en SLP, pagado del Pool de Swap. Si el pool se agota antes de tiempo, la ventana cierra automáticamente." },
              { icon: "🎲", title: "DÍA 5 · SORTEO Y CIERRE", body: "Se sortean las rewards una por una, en orden. Cada ticket ganador queda marcado como usado y no vuelve a participar. En paralelo: se quema el SLP del Pool de Quema y se liberan todos los Axies recibidos por swap. Todo queda registrado en el histórico." },
              { icon: "🗝️", title: "DICIEMBRE · EVENTO ANUAL", body: "Quienes tengan 12 tickets finalizados (uno de cada mes del año) pueden mintear una Llave Anual, transferible como NFT. El pool especial acumulado durante el año se divide en 10 rewards iguales, sorteadas entre las llaves vivas." },
            ].map((s, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <ThemedText style={{ fontSize: 18, marginTop: 2 }}>{s.icon}</ThemedText>
                <View style={{ flex: 1 }}><ThemedText style={{ color: C.parchment, fontWeight: "700", fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>{s.title}</ThemedText><ThemedText style={{ color: C.slate, fontSize: 11, lineHeight: 18 }}>{s.body}</ThemedText></View>
              </View>
            ))}
          </Accordion>

          {/* ── DISTRIBUCIÓN DE FONDOS ── */}
          <Rune label="Como se divide el poder" />
          <ThemedText style={{ color: C.slate, fontSize: 11, lineHeight: 17, marginBottom: 14 }}>
            Hay 2 fuentes de ingreso en el sistema, todas pagadas en SLP. Cada una tiene una distribución diferente:
          </ThemedText>

          <DistTable
            title="POR CADA COMPRA DE TICKET"
            rows={[
              { name: "Pool de Recompensas", pct: "25%", purpose: "Rewards en SLP repartidas por nivel.", color: C.gold },
              { name: "Pool de Swap",        pct: "25%", purpose: "Fondos para comprar los Axies de usuarios.", color: C.crimson },
              { name: "Quema Directa",       pct: "25%", purpose: "Envío irreversible a burn address de SLP.", color: C.ember },
              { name: "Operaciones y Devs",  pct: "15%", purpose: "Mantenimiento e infraestructura.", color: C.slate },
              { name: "Pool Reward Anual",   pct: "10%", purpose: "Se acumula para el evento de fin de año.", color: C.goldBrt },
            ]}
          />
          <DistTable
            title="POR CADA MINTEO DE LLAVE ANUAL"
            rows={[
              { name: "Pool de Recompensas", pct: "40%", purpose: "Acumulado al pool especial del año.", color: C.gold },
              { name: "Quema Directa",       pct: "40%", purpose: "Envío irreversible a burn address.", color: C.ember },
              { name: "Operaciones y Devs",  pct: "20%", purpose: "Mantenimiento e infraestructura.", color: C.slate },
            ]}
          />

          {/* ── POOLS DEL EVENTO ACTIVO (EN VIVO) ── */}
          <Rune label="Estado actual de los pools" />
          {!activeEvent ? (
            <ABox color={C.borderMid}>
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <ThemedText style={{ fontSize: 24, marginBottom: 8 }}>⬡</ThemedText>
                <ThemedText style={{ color: C.parchment, fontWeight: "800", fontSize: 13, marginBottom: 4, textAlign: "center" }}>
                  NO HAY EVENTO VIVO
                </ThemedText>
                <ThemedText style={{ color: C.slate, fontSize: 10, textAlign: "center", lineHeight: 15 }}>
                  Los eventos siempre arrancan el día 1 de cada mes. Volvé a verificar entonces para ver los pools en tiempo real.
                </ThemedText>
              </View>
            </ABox>
          ) : (
            <>
              <ThemedText style={{ color: C.slate, fontSize: 11, lineHeight: 17, marginBottom: 14 }}>
                Pools del evento activo (#{activeEvent.event_number}), en vivo — se actualizan automáticamente.
              </ThemedText>
              <View style={{ flexDirection: isWide ? "row" : "column", flexWrap: "wrap", gap: 12 }}>
                <ActivePoolCard name="POOL DE RECOMPENSAS" emoji="⚔️" slp={activeEvent.rewards_pool_slp} pct={25} color={C.gold} dim={C.goldDim} slpPrice={slpPrice} />
                <ActivePoolCard name="POOL DE SWAP" emoji="⚖️" slp={activeEvent.swap_pool_slp} pct={25} color={C.crimson} dim={C.crimsonGlow} slpPrice={slpPrice} />
                <ActivePoolCard name="QUEMA DIRECTA" emoji="🔥" slp={activeEvent.burn_pool_slp} pct={25} color={C.ember} dim={C.emberDim} slpPrice={slpPrice} />
                <ActivePoolCard name="OPERACIONES Y DEVS" emoji="🔩" slp={activeEvent.ops_pool_slp} pct={15} color={C.slate} dim="#5a5a6a18" slpPrice={slpPrice} />
                <ActivePoolCard name="POOL REWARD ANUAL" emoji="🗝️" slp={activeEvent.special_pool_slp} pct={10} color={C.goldBrt} dim={C.goldDim} slpPrice={slpPrice} />
              </View>
            </>
          )}
          <View style={{ alignItems: "center", marginTop: 8, marginBottom: 4 }}><ThemedText style={{ color: C.borderMid, fontSize: 8, letterSpacing: 2 }}>⬡ VERIFICABLE ON-CHAIN EN RONIN NETWORK ⬡</ThemedText></View>

          {/* ── ÚLTIMOS RITUALES (reales) ── */}
          <Rune label="Últimos rituales realizados" />
          {loading ? (
            <ThemedText style={{ color: C.slate, fontSize: 11, textAlign: "center", paddingVertical: 10 }}>Cargando histórico...</ThemedText>
          ) : pastEvents.length === 0 ? (
            <ABox color={C.borderMid}>
              <ThemedText style={{ color: C.slate, fontSize: 11, textAlign: "center", paddingVertical: 8 }}>
                Todavía no hay rituales completados. Acá vas a ver el histórico real apenas se cierre el primero.
              </ThemedText>
            </ABox>
          ) : (
            pastEvents.map(e => <EventRow key={e.id} event={e} />)
          )}

          <TouchableOpacity style={{ borderWidth: 2, borderColor: C.crimson, padding: 14, alignItems: "center", marginTop: 10, marginBottom: 4, backgroundColor: C.surface2 }} onPress={() => router.push("/ritual")} activeOpacity={0.8}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}><ThemedText style={{ color: C.crimson, fontSize: 14 }}>✡</ThemedText><ThemedText style={{ color: C.crimsonBrt, fontWeight: "900", fontSize: 13, letterSpacing: 3 }}>INVOLUCRATE EN EL RITUAL</ThemedText><ThemedText style={{ color: C.crimson, fontSize: 14 }}>✡</ThemedText></View>
            <ThemedText style={{ color: C.slate, fontSize: 10, letterSpacing: 1 }}>Ver todos los rituales y registros →</ThemedText>
          </TouchableOpacity>

          {/* ── HISTÓRICO DE EVENTOS ANUALES (nuevo) ── */}
          <Rune label="Historial de eventos anuales" />
          {annualHistory.length === 0 ? (
            <ABox color={C.borderMid}>
              <ThemedText style={{ color: C.slate, fontSize: 11, textAlign: "center", paddingVertical: 8 }}>
                Todavía no se completó ningún Evento Anual. El primero será en diciembre, si juntaste tus 12 tickets.
              </ThemedText>
            </ABox>
          ) : (
            annualHistory.map(ae => <AnnualEventRow key={ae.id} event={ae} />)
          )}

          {/* ── LINKS ── */}
          <Rune label="Portales externos" />
          <LinkBtn hl emoji="🛒" label="Axie Marketplace" sub="Floor price actual de Axies" url="https://app.axieinfinity.com/marketplace/axies/?auctionTypes=Sale" />
          <LinkBtn emoji="📊" label="SLP en CoinMarketCap" sub="Precio histórico del token SLP" url="https://coinmarketcap.com/currencies/smooth-love-potion/" />
        </View>

        {/* Footer */}
        <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 20 }}><View style={{ flex: 1, height: 1, backgroundColor: C.border }} /><ThemedText style={{ color: C.borderMid, fontSize: 14, marginHorizontal: 12 }}>✡</ThemedText><View style={{ flex: 1, height: 1, backgroundColor: C.border }} /></View>
        <ThemedText style={{ color: C.borderMid, fontSize: 9, letterSpacing: 2, textAlign: "center", fontStyle: "italic", marginTop: 8 }}>Be one of US, be a Fynolt's Cultist</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const ph = StyleSheet.create({
  title: { color: C.crimson, fontWeight: "900", fontSize: 14, letterSpacing: 1, marginBottom: 8 },
  body:  { color: C.slate, fontSize: 11, lineHeight: 18, marginBottom: 6 },
  point: { flexDirection: "row", gap: 8, marginBottom: 4 },
  bullet:{ fontSize: 14, marginTop: 1 },
});
const hd = StyleSheet.create({
  w: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.borderMid, paddingBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 },
  lbl: { color: C.borderMid, fontSize: 8, letterSpacing: 2 },
  val: { color: C.parchment, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 },
  titleLine: { flex: 1, height: 1, backgroundColor: C.borderMid },
  ritual: { color: C.crimson, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
});