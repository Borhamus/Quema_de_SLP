import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { C, PAST_EVENTS, GLOBAL_STATS, fmt } from "@/constants/ritualData";

function useLayout() { const { width } = useWindowDimensions(); const w = width >= 600; return { isWide: w, hPad: w ? 32 : 16, cardW: w ? Math.min(width * 0.44, 340) : width - 56 }; }

// ─── UI COMPONENTS ───────────────────────────
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

// ─── DISTRIBUTION TABLE ──────────────────────
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

// ─── POOL CARD ───────────────────────────────
const POOLS = [
  { id: 1, name: "POOL DE RECOMPENSAS", emoji: "⚔️", pct: 25, bal: 2902, desc: "Financia la adquisición de Axies y Lands para sorteos.", color: C.gold, dim: C.goldDim },
  { id: 2, name: "POOL DE SWAP",        emoji: "⚖️", pct: 25, bal: 2902, desc: "Liquidez para comprar Axies al floor price.", color: C.crimson, dim: C.crimsonGlow },
  { id: 3, name: "QUEMA DIRECTA",       emoji: "🔥", pct: 25, bal: 0,    desc: "SLP enviado a burn address. Todo fue quemado.", color: C.ember, dim: C.emberDim },
  { id: 4, name: "OPERACIONES Y DEVS",  emoji: "🔩", pct: 15, bal: 1741, desc: "Infraestructura, contratos y desarrollo.", color: C.slate, dim: "#5a5a6a18" },
  { id: 5, name: "POOL REWARD ANUAL",   emoji: "🗝️", pct: 10, bal: 1161, desc: "Acumulado para el gran ritual de Diciembre.", color: C.goldBrt, dim: C.goldDim },
];

function PoolCard({ pool, width: w }: { pool: typeof POOLS[0]; width: number }) {
  return (
    <ABox style={{ width: w, marginBottom: 10 }} color={pool.color}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <View style={{ width: 34, height: 34, borderWidth: 1, borderColor: pool.color + "44", backgroundColor: pool.dim, justifyContent: "center", alignItems: "center" }}><ThemedText style={{ fontSize: 15 }}>{pool.emoji}</ThemedText></View>
      </View>
      <ThemedText style={{ color: pool.color, fontWeight: "800", fontSize: 11, letterSpacing: 1.5, marginBottom: 5 }}>{pool.name}</ThemedText>
      <ThemedText style={{ color: C.slate, fontSize: 10, lineHeight: 15, marginBottom: 10 }}>{pool.desc}</ThemedText>
      <View style={{ height: 1, backgroundColor: pool.color + "30", marginBottom: 10 }} />
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, alignItems: "center" }}><ThemedText style={{ color: pool.color, fontWeight: "900", fontSize: 17 }}>{pool.pct}%</ThemedText><ThemedText style={{ color: C.slate, fontSize: 7, letterSpacing: 1.5, marginTop: 2 }}>DEL TOTAL</ThemedText></View>
        <View style={{ width: 1, height: 28, backgroundColor: pool.color + "30", marginHorizontal: 8 }} />
        <View style={{ flex: 1, alignItems: "center" }}><ThemedText style={{ color: pool.color, fontWeight: "900", fontSize: 17 }}>${fmt(pool.bal)}</ThemedText><ThemedText style={{ color: C.slate, fontSize: 7, letterSpacing: 1.5, marginTop: 2 }}>USD HISTÓRICO</ThemedText></View>
      </View>
    </ABox>
  );
}

function PoolCarousel({ cardW }: { cardW: number }) {
  const GAP = 12; const ref = useRef<ScrollView>(null); const [idx, setIdx] = useState(0); const tmr = useRef<any>(null);
  const go = useCallback((i: number) => ref.current?.scrollTo({ x: i * (cardW + GAP), animated: true }), [cardW]);
  const rst = useCallback(() => { if (tmr.current) clearInterval(tmr.current); tmr.current = setInterval(() => setIdx(p => { const n = (p + 1) % POOLS.length; go(n); return n; }), 3500); }, [go]);
  useEffect(() => { rst(); return () => { if (tmr.current) clearInterval(tmr.current); }; }, [rst]);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => { setIdx(Math.round(e.nativeEvent.contentOffset.x / (cardW + GAP))); rst(); };
  return (<View><ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardW + GAP} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 16, gap: GAP }} onMomentumScrollEnd={onEnd}>{POOLS.map(p => <PoolCard key={p.id} pool={p} width={cardW} />)}</ScrollView><View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 }}>{POOLS.map((_, i) => <TouchableOpacity key={i} onPress={() => { go(i); setIdx(i); rst(); }}><View style={{ height: 3, width: i === idx ? 18 : 5, backgroundColor: i === idx ? POOLS[idx].color : C.borderMid }} /></TouchableOpacity>)}</View></View>);
}
function PoolGrid({ hPad }: { hPad: number }) {
  const { width } = useWindowDimensions(); const w = (width - hPad * 2 - 12) / 2;
  return <View style={{ paddingHorizontal: hPad }}><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{POOLS.map(p => <PoolCard key={p.id} pool={p} width={w} />)}</View></View>;
}

// ─── EVENT ROW ───────────────────────────────
function EventRow({ event }: { event: typeof PAST_EVENTS[0] }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/ritual/${event.id}`)} activeOpacity={0.8}>
      <ABox style={{ marginBottom: 8 }} color={C.crimson}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <ThemedText style={{ color: C.crimson, fontSize: 16 }}>✡</ThemedText>
          <ThemedText style={{ flex: 1, color: C.parchment, fontSize: 13, fontWeight: "700" }}>Ritual Realizado #{event.id} — {event.label}</ThemedText>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          <View style={[ev.pill, { backgroundColor: C.emberDim, borderColor: C.ember }]}><ThemedText style={[ev.pt, { color: C.ember }]}>🔥 {fmt(event.slpBurned)} SLP</ThemedText></View>
          <View style={[ev.pill, { backgroundColor: C.crimsonGlow, borderColor: C.crimson }]}><ThemedText style={[ev.pt, { color: C.crimson }]}>⚡ {event.axiesReleased} Axies</ThemedText></View>
          <View style={[ev.pill, { backgroundColor: C.goldDim, borderColor: C.gold }]}><ThemedText style={[ev.pt, { color: C.goldBrt }]}>⚔️ {event.milestones.length} Milestones</ThemedText></View>
        </View>
      </ABox>
    </TouchableOpacity>
  );
}
const ev = StyleSheet.create({ pill: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 }, pt: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 } });

// ─── LINK BUTTON ─────────────────────────────
function LinkBtn({ emoji, label, sub, url, hl }: { emoji: string; label: string; sub: string; url: string; hl?: boolean }) {
  return (<TouchableOpacity onPress={() => Linking.openURL(url)} activeOpacity={0.8}><ABox style={{ marginBottom: 10 }} color={hl ? C.crimson : C.borderMid}><View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><View style={{ width: 34, height: 34, borderWidth: 1, borderColor: hl ? C.crimson : C.borderMid, justifyContent: "center", alignItems: "center" }}><ThemedText style={{ fontSize: 15 }}>{emoji}</ThemedText></View><View style={{ flex: 1 }}><ThemedText style={{ color: hl ? C.crimson : C.parchment, fontWeight: "700", fontSize: 13 }}>{label}</ThemedText><ThemedText style={{ color: C.slate, fontSize: 11, marginTop: 2 }}>{sub}</ThemedText></View><ThemedText style={{ color: hl ? C.crimson : C.slate, fontSize: 12 }}>↗</ThemedText></View></ABox></TouchableOpacity>);
}

// ═══════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════
export default function HomeScreen() {
  const { isWide, hPad, cardW } = useLayout();
  const router = useRouter();

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
        <View style={hd.titleRow}><View style={hd.titleLine} /><ThemedText style={hd.ritual}>⬡ RITUAL DE QUEMA NÚMERO: {String(PAST_EVENTS.length + 1).padStart(2, "0")} ⬡</ThemedText><View style={hd.titleLine} /></View>
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
            <View style={ph.point}><ThemedText style={ph.bullet}>⚔️</ThemedText><ThemedText style={ph.body}>Reinvertimos en el ecosistema comprando Axies y Lands reales como premios, no damos plata. Fomentamos la economía interna de Axie.</ThemedText></View>
            <View style={ph.point}><ThemedText style={ph.bullet}>🗝️</ThemedText><ThemedText style={ph.body}>Premiamos la constancia: los que participan todo el año acceden al evento legendario de Diciembre.</ThemedText></View>
            <ThemedText style={[ph.body, { color: C.crimson, fontWeight: "700", marginTop: 6 }]}>Todo es transparente, verificable on-chain, y registrado públicamente.</ThemedText>
          </ABox>

          {/* ── STATS ── */}
          <Rune label="Impacto histórico" />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {[
              { val: fmt(GLOBAL_STATS.totalSlpBurned), lab: "SLP QUEMADOS", color: C.ember, em: "🔥" },
              { val: String(GLOBAL_STATS.totalAxiesReleased), lab: "AXIES LIBERADOS", color: C.crimson, em: "⚡" },
              { val: String(GLOBAL_STATS.totalEvents), lab: "RITUALES", color: C.goldBrt, em: "⬡" },
            ].map(s => (<ABox key={s.lab} style={{ flex: 1 }} color={s.color}><ThemedText style={{ fontSize: 16, textAlign: "center", marginBottom: 4 }}>{s.em}</ThemedText><ThemedText style={{ color: s.color, fontSize: 15, fontWeight: "900", textAlign: "center", marginBottom: 3 }}>{s.val}</ThemedText><ThemedText style={{ color: C.slate, fontSize: 7, textAlign: "center", letterSpacing: 2 }}>{s.lab}</ThemedText></ABox>))}
          </View>
          <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.crimson + "50", padding: 12, borderStyle: "dashed", marginBottom: 4 }} onPress={() => Linking.openURL("https://coinmarketcap.com/currencies/smooth-love-potion/")}>
            <ThemedText style={{ fontSize: 24 }}>📈</ThemedText>
            <View style={{ flex: 1 }}><ThemedText style={{ color: C.parchment, fontWeight: "700", fontSize: 13, marginBottom: 2 }}>¿Cómo impactamos en el SLP?</ThemedText><ThemedText style={{ color: C.crimson, fontSize: 11 }}>Ver precio desde Enero 2025 en CoinMarketCap →</ThemedText></View>
          </TouchableOpacity>

          {/* ── COMO FUNCIONA ── */}
          <Rune label="Como funciona el Ritual" />
          <Accordion title="VER EL CICLO COMPLETO DEL EVENTO">
            {[
              { icon: "📅", title: "DÍAS 1–3 · VENTA DE TICKETS", body: "Al inicio de cada mes se abre una ventana de 72 horas. Los usuarios compran tickets pagando $3 USD en SLP. Cada ticket es un NFT (ERC-721) que se envía a la wallet Ronin del comprador. Por cada compra, los fondos se dividen automáticamente en los 5 pools." },
              { icon: "📈", title: "DURANTE LA VENTA · MILESTONES", body: "A medida que el Pool de Recompensas acumula SLP, cada vez que llega a $100 USD sube el Nivel del Ritual. En cada nivel, el sistema compra un Axie o Land de ese valor en el marketplace y lo coloca como premio del sorteo. Todo queda registrado: qué se compró, cuánto SLP costaba, y la transacción de compra." },
              { icon: "🔄", title: "DÍA 4 · VENTANA DE SWAP (24 HS)", body: "Solo para quienes compraron al menos un ticket. El usuario puede entregar un Axie que no quiere y recibe el floor price actual del marketplace en SLP (del Pool de Swap). Después del swap, hay un cooldown de 24 horas. Si quiere swappear otro antes, puede pagar la mitad del floor price en SLP para resetear el cooldown. Si el Pool de Swap se queda sin fondos, la ventana cierra antes." },
              { icon: "🎲", title: "DÍA 5 · SORTEO Y CIERRE", body: "Se sortean los premios (Axies y Lands de los milestones) entre los participantes. Cada wallet ganadora recibe su premio con TX verificable. El SLP del Pool de Quema se envía a la burn address. Todos los Axies recibidos por swap se liberan (Release) del ecosistema. Todo queda registrado públicamente." },
              { icon: "🗝️", title: "DICIEMBRE · EVENTO ANUAL", body: "Quienes tengan 1 ticket de cada mes del año (12 tickets, uno por mes, no 12 del mismo) pueden quemar esos 12 tickets y mintear una Llave Especial. El último día del año, con un timer de 24 horas, se sortean 3 premios en SLP del Pool Anual acumulado: 1er premio 50%, 2do premio 30%, 3er premio 20%. Las transacciones quedan registradas." },
            ].map((s, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <ThemedText style={{ fontSize: 18, marginTop: 2 }}>{s.icon}</ThemedText>
                <View style={{ flex: 1 }}><ThemedText style={{ color: C.parchment, fontWeight: "700", fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>{s.title}</ThemedText><ThemedText style={{ color: C.slate, fontSize: 11, lineHeight: 18 }}>{s.body}</ThemedText></View>
              </View>
            ))}
          </Accordion>

          {/* ── DISTRIBUCIÓN DE FONDOS (3 TABLAS) ── */}
          <Rune label="Como se divide el poder" />
          <ThemedText style={{ color: C.slate, fontSize: 11, lineHeight: 17, marginBottom: 14 }}>
            Hay 3 fuentes de ingreso en el sistema. Cada una tiene una distribución diferente para mantener la sostenibilidad del proyecto:
          </ThemedText>

          <DistTable
            title="POR CADA COMPRA DE TICKET ($3 USD EN SLP)"
            rows={[
              { name: "Pool de Recompensas", pct: "25%", purpose: "Adquisición de Axies y Lands para sorteos.", color: C.gold },
              { name: "Pool de Swap",        pct: "25%", purpose: "Fondos para comprar los Axies de usuarios.", color: C.crimson },
              { name: "Quema Directa",       pct: "25%", purpose: "Envío irreversible a burn address de SLP.", color: C.ember },
              { name: "Operaciones y Devs",  pct: "15%", purpose: "Mantenimiento e infraestructura.", color: C.slate },
              { name: "Pool Reward Anual",   pct: "10%", purpose: "Se acumula para el evento de fin de año.", color: C.goldBrt },
            ]}
          />
          <DistTable
            title="POR CADA RESET DE COOLDOWN (½ FLOOR PRICE EN SLP)"
            rows={[
              { name: "Quema Directa",       pct: "50%", purpose: "Envío irreversible a burn address de SLP.", color: C.ember },
              { name: "Operaciones y Devs",  pct: "40%", purpose: "Mantenimiento e infraestructura.", color: C.slate },
              { name: "Pool Reward Anual",   pct: "10%", purpose: "Se acumula para fin de año.", color: C.goldBrt },
            ]}
          />
          <DistTable
            title="POR CADA MINTEO DE LLAVE ANUAL (12 TICKETS)"
            rows={[
              { name: "Pool de Recompensas", pct: "40%", purpose: "Adquisición de activos de alto valor.", color: C.gold },
              { name: "Quema Directa",       pct: "40%", purpose: "Envío irreversible a burn address.", color: C.ember },
              { name: "Operaciones y Devs",  pct: "20%", purpose: "Mantenimiento e infraestructura.", color: C.slate },
            ]}
          />

          {/* ── POOLS ACTUALES ── */}
          <Rune label="Estado actual de los pools" />
          <ThemedText style={{ color: C.slate, fontSize: 11, lineHeight: 17, marginBottom: 14 }}>
            Saldo histórico acumulado de cada pool. {isWide ? "Verificable on-chain." : "Deslizá para ver cada uno."}
          </ThemedText>
        </View>

        {isWide ? <PoolGrid hPad={hPad} /> : <PoolCarousel cardW={cardW} />}
        <View style={{ alignItems: "center", marginTop: 8, marginBottom: 4 }}><ThemedText style={{ color: C.borderMid, fontSize: 8, letterSpacing: 2 }}>⬡ VERIFICABLE ON-CHAIN EN RONIN NETWORK ⬡</ThemedText></View>

        <View style={{ paddingHorizontal: hPad }}>
          {/* ── ÚLTIMOS RITUALES ── */}
          <Rune label="Últimos rituales realizados" />
          {PAST_EVENTS.slice(0, 3).map(e => <EventRow key={e.id} event={e} />)}

          <TouchableOpacity style={{ borderWidth: 2, borderColor: C.crimson, padding: 14, alignItems: "center", marginTop: 10, marginBottom: 4, backgroundColor: C.surface2 }} onPress={() => router.push("/ritual")} activeOpacity={0.8}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}><ThemedText style={{ color: C.crimson, fontSize: 14 }}>✡</ThemedText><ThemedText style={{ color: C.crimsonBrt, fontWeight: "900", fontSize: 13, letterSpacing: 3 }}>INVOLUCRATE EN EL RITUAL</ThemedText><ThemedText style={{ color: C.crimson, fontSize: 14 }}>✡</ThemedText></View>
            <ThemedText style={{ color: C.slate, fontSize: 10, letterSpacing: 1 }}>Ver todos los rituales y registros →</ThemedText>
          </TouchableOpacity>

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
