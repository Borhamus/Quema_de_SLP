/**
 * app/ritual/[id]/index.tsx — Página completa de un ritual
 * Tabs: Actas | Premios (milestones) | Fondos | Gráfico
 */
import { ThemedText } from "@/components/themed-text";
import { C, chartHtml, fmt, getEvent } from "@/constants/ritualData";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";

type Tab = "actas" | "premios" | "fondos" | "chart";

export default function RitualDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const event  = getEvent(Number(id));
  const [tab, setTab] = useState<Tab>("actas");
  const [showAxies, setShowAxies] = useState(false);
  // Filtros de premios
  const [filterLevel, setFilterLevel] = useState<number | null>(null);   // null = todos
  const [filterMinUsd, setFilterMinUsd] = useState(0);                   // 0 = todos

  if (!event) return (
    <SafeAreaView style={s.safe}>
      <ThemedText style={{ color: C.crimson, textAlign: "center", marginTop: 60, fontSize: 16 }}>
        Ritual no encontrado
      </ThemedText>
    </SafeAreaView>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "actas",   label: "⚔️ ACTAS"   },
    { key: "premios", label: "🏆 PREMIOS" },
    { key: "fondos",  label: "💰 FONDOS"  },
    { key: "chart",   label: "📈 GRÁFICO" },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <ThemedText style={{ color: C.crimson, fontSize: 18 }}>✡</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={s.title}>RITUAL REALIZADO #{event.id}</ThemedText>
              <ThemedText style={s.sub}>{event.label.toUpperCase()}</ThemedText>
            </View>
          </View>
          {/* Quick stats row */}
          <View style={s.quickStats}>
            <View style={s.qStat}><ThemedText style={[s.qVal, { color: C.goldBrt }]}>${fmt(event.totalRaisedUsd)}</ThemedText><ThemedText style={s.qKey}>RECAUDADO</ThemedText></View>
            <View style={s.qStat}><ThemedText style={[s.qVal, { color: C.parchment }]}>{event.totalTickets}</ThemedText><ThemedText style={s.qKey}>TICKETS</ThemedText></View>
            <View style={s.qStat}><ThemedText style={[s.qVal, { color: C.crimson }]}>{event.milestones.length}</ThemedText><ThemedText style={s.qKey}>MILESTONES</ThemedText></View>
          </View>
        </View>

        {/* ── TABS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 14, paddingHorizontal: 16 }}>
          <View style={s.tabs}>
            {tabs.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.tabBtn, tab === t.key && s.tabActive]}
                onPress={() => setTab(t.key)}
              >
                <ThemedText style={[s.tabTxt, tab === t.key && s.tabTxtActive]}>
                  {t.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={s.content}>

          {/* ═══════════════════════════════════
                       ACTAS
             ═══════════════════════════════════ */}
          {tab === "actas" && (
            <>
              {/* Stats grid */}
              <View style={s.grid}>
                {[
                  { val: `🔥 ${fmt(event.slpBurned)}`, key: "SLP QUEMADO",      color: C.ember   },
                  { val: `⚡ ${event.axiesReleased}`,   key: "AXIES LIBERADOS",  color: C.crimson },
                  { val: `💵 $${event.totalRaisedUsd}`, key: "USD RECAUDADOS",   color: C.goldBrt },
                  { val: `👥 ${event.participantList.length}`, key: "PARTICIPANTES", color: C.slate },
                ].map(st => (
                  <View key={st.key} style={s.statBox}>
                    <ThemedText style={[s.statVal, { color: st.color }]}>{st.val}</ThemedText>
                    <ThemedText style={s.statKey}>{st.key}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Datos del ticket */}
              <View style={s.infoBox}>
                <ThemedText style={s.infoLabel}>DATOS DEL TICKET</ThemedText>
                <ThemedText style={s.infoLine}>
                  Precio: <ThemedText style={{ color: C.goldBrt, fontWeight: "700" }}>{event.ticketPriceSlp.toLocaleString()} SLP</ThemedText> (≈ $3 USD)
                </ThemedText>
                <ThemedText style={s.infoLine}>
                  Precio SLP al momento: <ThemedText style={{ color: C.goldBrt, fontWeight: "700" }}>${event.slpPriceUsd}</ThemedText> USD
                </ThemedText>
              </View>

              {/* Swap info */}
              <View style={s.infoBox}>
                <ThemedText style={s.infoLabel}>VENTANA DE SWAP</ThemedText>
                <ThemedText style={s.infoLine}>
                  Floor price del Axie: <ThemedText style={{ color: C.crimson, fontWeight: "700" }}>${event.floorPriceUsd}</ThemedText> USD
                </ThemedText>
                <ThemedText style={s.infoLine}>
                  Axies swappeados: <ThemedText style={{ color: C.crimson, fontWeight: "700" }}>{event.axiesSwapped}</ThemedText>
                </ThemedText>
                <ThemedText style={s.infoLine}>
                  Pool de Swap gastado: <ThemedText style={{ color: C.crimson, fontWeight: "700" }}>${event.swapPoolSpent.toFixed(2)}</ThemedText> USD
                </ThemedText>
                <ThemedText style={s.infoLine}>
                  Cooldowns reseteados: <ThemedText style={{ color: C.crimson, fontWeight: "700" }}>{event.cooldownResets}</ThemedText>
                </ThemedText>
              </View>

              {/* Wallet pública */}
              <TouchableOpacity
                style={s.walletBox}
                onPress={() => Linking.openURL(event.walletUrl)}
                activeOpacity={0.8}
              >
                <ThemedText style={s.walletLabel}>VERIFICÁ NUESTRA WALLET PÚBLICA</ThemedText>
                <ThemedText style={s.walletLink}>Ver toda la actividad en Axie Infinity →</ThemedText>
              </TouchableOpacity>

              {/* Participantes — link a su página */}
              <TouchableOpacity
                style={s.linkRow}
                onPress={() => router.push(`/ritual/${event.id}/participants`)}
                activeOpacity={0.8}
              >
                <ThemedText style={{ fontSize: 16 }}>👥</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText style={s.linkRowTitle}>
                    PARTICIPANTES ({event.participantList.length})
                  </ThemedText>
                  <ThemedText style={s.linkRowSub}>
                    Ver lista de wallets y tickets comprados por cada una
                  </ThemedText>
                </View>
                <ThemedText style={{ color: C.crimson, fontSize: 14 }}>→</ThemedText>
              </TouchableOpacity>

              {/* Axies liberados — desplegable + link a página completa */}
              <TouchableOpacity
                style={s.linkRow}
                onPress={() => setShowAxies(!showAxies)}
                activeOpacity={0.8}
              >
                <ThemedText style={{ fontSize: 16 }}>⚡</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText style={s.linkRowTitle}>
                    AXIES LIBERADOS ({event.axiesReleased})
                  </ThemedText>
                  <ThemedText style={s.linkRowSub}>
                    ID de cada Axie y TX de liberación en Ronin
                  </ThemedText>
                </View>
                <ThemedText style={{ color: C.crimson, fontSize: 10 }}>
                  {showAxies ? "▲" : "▼"}
                </ThemedText>
              </TouchableOpacity>

              {showAxies && (
                <View style={s.axieList}>
                  {/* Header */}
                  <View style={s.axieHdr}>
                    <ThemedText style={[s.axieCol, { flex: 1 }]}>AXIE ID</ThemedText>
                    <ThemedText style={[s.axieCol, { flex: 2 }]}>TX LIBERACIÓN</ThemedText>
                    <ThemedText style={[s.axieCol, { width: 30, textAlign: "center" }]}>VER</ThemedText>
                  </View>
                  {/* Primeros 15 */}
                  {event.releasedAxies.slice(0, 15).map((ax, i) => (
                    <View key={i} style={s.axieRow}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => Linking.openURL(`https://app.axieinfinity.com/marketplace/axies/${ax.axieId}/`)}
                      >
                        <ThemedText style={s.axieId}>#{ax.axieId}</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 2 }} onPress={() => Linking.openURL(ax.txUrl)}>
                        <ThemedText style={s.axieTx}>{ax.txHash}</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ width: 30, alignItems: "center" }}
                        onPress={() => Linking.openURL(ax.txUrl)}
                      >
                        <ThemedText style={{ color: C.crimson, fontSize: 10 }}>↗</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {event.releasedAxies.length > 15 && (
                    <TouchableOpacity
                      style={s.seeAll}
                      onPress={() => router.push(`/ritual/${event.id}/axies`)}
                    >
                      <ThemedText style={s.seeAllTxt}>
                        VER LOS {event.releasedAxies.length} AXIES LIBERADOS →
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}

          {/* ═══════════════════════════════════
                   PREMIOS (MILESTONES)
             ═══════════════════════════════════ */}
          {tab === "premios" && (() => {
              // Aplicar filtros
              const filtered = event.milestones.filter(m => {
                if (filterLevel !== null && m.level !== filterLevel) return false;
                if (filterMinUsd > 0 && m.thresholdUsd < filterMinUsd) return false;
                return true;
              });
              // Levels disponibles para el filtro
              const levels = event.milestones.map(m => m.level);
              // Steps de USD
              const usdSteps = [0, 100, 200, 300];

              return (
              <>
              <View style={s.note}>
                <ThemedText style={s.noteTxt}>
                  Cada milestone se activa cuando el Pool de Recompensas acumula el monto indicado en SLP. El sistema compra un Axie o Land de ese valor y lo sortea. Todo on-chain.
                </ThemedText>
              </View>

              {/* ── FILTROS ── */}
              <View style={s.filterSection}>
                {/* Filtro por nivel */}
                <ThemedText style={s.filterLabel}>FILTRAR POR NIVEL</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 10 }}>
                  <View style={s.filterRow}>
                    <TouchableOpacity
                      style={[s.filterBtn, filterLevel === null && s.filterBtnActive]}
                      onPress={() => setFilterLevel(null)}
                    >
                      <ThemedText style={[s.filterBtnTxt, filterLevel === null && s.filterBtnTxtActive]}>
                        TODOS
                      </ThemedText>
                    </TouchableOpacity>
                    {levels.map(lv => (
                      <TouchableOpacity
                        key={lv}
                        style={[s.filterBtn, filterLevel === lv && s.filterBtnActive]}
                        onPress={() => setFilterLevel(filterLevel === lv ? null : lv)}
                      >
                        <ThemedText style={[s.filterBtnTxt, filterLevel === lv && s.filterBtnTxtActive]}>
                          LVL {lv}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Filtro por monto mínimo */}
                <ThemedText style={s.filterLabel}>MONTO MÍNIMO (USD)</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 10 }}>
                  <View style={s.filterRow}>
                    {usdSteps.map(val => (
                      <TouchableOpacity
                        key={val}
                        style={[s.filterBtn, filterMinUsd === val && s.filterBtnActive]}
                        onPress={() => setFilterMinUsd(val)}
                      >
                        <ThemedText style={[s.filterBtnTxt, filterMinUsd === val && s.filterBtnTxtActive]}>
                          {val === 0 ? "TODOS" : `$${val}+`}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <ThemedText style={s.filterCount}>
                  {filtered.length} de {event.milestones.length} milestones
                </ThemedText>
              </View>

              {/* ── MILESTONES FILTRADOS ── */}
              {filtered.map(m => (
                <View key={m.level} style={s.msCard}>
                  {/* Header: nivel + threshold */}
                  <View style={s.msHeader}>
                    <View style={s.msLevelBadge}>
                      <ThemedText style={s.msLevelTxt}>LVL {m.level}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={s.msThreshold}>
                        Milestone: ${m.thresholdUsd} USD
                      </ThemedText>
                      <ThemedText style={s.msSlpEquiv}>
                        = {m.slpEquivalent.toLocaleString()} SLP (a ${m.slpPriceAtTime} USD/SLP)
                      </ThemedText>
                    </View>
                    <ThemedText style={s.msStatus}>✓ COMPLETADO</ThemedText>
                  </View>

                  {/* Item comprado */}
                  <View style={s.msItemBox}>
                    <ThemedText style={s.msItemLabel}>ITEM ADQUIRIDO POR EL SISTEMA</ThemedText>
                    <TouchableOpacity onPress={() => Linking.openURL(m.marketUrl)}>
                      <ThemedText style={s.msItemName}>{m.item} ↗</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={s.msItemType}>
                      Tipo: {m.type.toUpperCase()} · Valor aprox: ~${m.thresholdUsd} USD al momento de compra
                    </ThemedText>
                  </View>

                  {/* TX de compra */}
                  <TouchableOpacity
                    style={s.msTxRow}
                    onPress={() => Linking.openURL(m.purchaseTxUrl)}
                  >
                    <ThemedText style={s.msTxLabel}>TX COMPRA (wallet empresa)</ThemedText>
                    <ThemedText style={s.msTxHash}>{m.purchaseTxHash} ↗</ThemedText>
                  </TouchableOpacity>

                  {/* Wallet ganadora */}
                  <View style={s.msWinnerBox}>
                    <ThemedText style={s.msWinnerLabel}>WALLET GANADOR DEL SORTEO</ThemedText>
                    <ThemedText style={s.msWinnerAddr}>{m.winnerWallet}</ThemedText>
                  </View>

                  {/* TX de entrega */}
                  <TouchableOpacity
                    style={s.msTxRow}
                    onPress={() => Linking.openURL(m.deliveryTxUrl)}
                  >
                    <ThemedText style={s.msTxLabel}>TX ENTREGA AL GANADOR</ThemedText>
                    <ThemedText style={s.msTxHash}>{m.deliveryTxHash} ↗</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

              {filtered.length === 0 && (
                <ThemedText style={{ color: C.slate, textAlign: "center", marginTop: 30, fontSize: 12 }}>
                  No hay milestones con esos filtros.
                </ThemedText>
              )}
              </>
              );
            })()}

          {/* ═══════════════════════════════════
                        FONDOS
             ═══════════════════════════════════ */}
          {tab === "fondos" && (
            <>
              <View style={s.note}>
                <ThemedText style={s.noteTxt}>
                  Distribución de los ${fmt(event.totalRaisedUsd)} USD recaudados de la venta de {event.totalTickets} tickets. Cada movimiento tiene su hash de transacción verificable en Ronin Explorer.
                </ThemedText>
              </View>

              {event.pools.map(pm => (
                <View key={pm.name} style={[s.poolRow, { borderLeftColor: pm.color }]}>
                  <View style={s.poolTop}>
                    <ThemedText style={{ fontSize: 14 }}>{pm.emoji}</ThemedText>
                    <ThemedText style={[s.poolName, { color: pm.color }]}>
                      {pm.name}
                    </ThemedText>
                    <View style={{ alignItems: "flex-end" }}>
                      <ThemedText style={[s.poolUsd, { color: pm.color }]}>
                        ${pm.totalUsd.toFixed(0)} USD
                      </ThemedText>
                      <ThemedText style={s.poolPct}>
                        {pm.pctOfTicket}% del ticket
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={s.poolDetail}>{pm.detail}</ThemedText>
                  <TouchableOpacity onPress={() => Linking.openURL(pm.txUrl)}>
                    <ThemedText style={s.poolTxLine}>
                      TX: <ThemedText style={s.poolTx}>{pm.txHash} ↗</ThemedText>
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Ingresos extra por cooldown resets */}
              {event.cooldownResets > 0 && (
                <View style={s.extraBox}>
                  <ThemedText style={s.extraTitle}>INGRESOS EXTRA POR RESET DE COOLDOWN</ThemedText>
                  <ThemedText style={s.extraBody}>
                    {event.cooldownResets} resets realizados durante la ventana de swap.{"\n"}
                    Esos fondos se distribuyeron: 50% Quema, 40% Devs, 10% Pool Anual.
                  </ThemedText>
                </View>
              )}
            </>
          )}

          {/* ═══════════════════════════════════
                       GRÁFICO
             ═══════════════════════════════════ */}
          {tab === "chart" && (
            <>
              <View style={s.note}>
                <ThemedText style={s.noteTxt}>
                  Precio del SLP/USD: 2 días antes → 2 días después del ritual. Observá el efecto de la quema de {fmt(event.slpBurned)} SLP en el mercado.
                </ThemedText>
              </View>

              <View style={s.chartBox}>
                <WebView
                  source={{ html: chartHtml(event.date) }}
                  style={{ flex: 1, backgroundColor: "#000" }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  domStorageEnabled
                  originWhitelist={["*"]}
                  backgroundColor="#000000"
                />
              </View>

              <TouchableOpacity
                style={s.chartCta}
                onPress={() => Linking.openURL("https://coinmarketcap.com/currencies/smooth-love-potion/")}
              >
                <ThemedText style={s.chartCtaTxt}>
                  ⬡ VER HISTÓRICO COMPLETO EN COINMARKETCAP →
                </ThemedText>
              </TouchableOpacity>
            </>
          )}

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  // Header
  header:    { padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderMid, marginBottom: 10 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title:     { color: C.crimson, fontWeight: "900", fontSize: 18, letterSpacing: 2 },
  sub:       { color: C.slate, fontSize: 10, letterSpacing: 1.5, marginTop: 3 },
  quickStats:{ flexDirection: "row", gap: 8 },
  qStat:     { flex: 1, alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingVertical: 8 },
  qVal:      { fontWeight: "900", fontSize: 14 },
  qKey:      { color: C.slate, fontSize: 7, letterSpacing: 1.5, marginTop: 2 },

  // Tabs
  tabs:         { flexDirection: "row", gap: 6 },
  tabBtn:       { paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: C.borderMid, backgroundColor: C.surface },
  tabActive:    { borderColor: C.crimson, backgroundColor: C.crimsonGlow },
  tabTxt:       { color: C.slate, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  tabTxtActive: { color: C.crimson },
  content:      { paddingHorizontal: 16 },

  // Actas - Stats
  grid:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  statBox: { width: "47%", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12 },
  statVal: { fontWeight: "900", fontSize: 16, marginBottom: 3 },
  statKey: { color: C.slate, fontSize: 8, letterSpacing: 2 },

  // Info boxes
  infoBox:   { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  infoLabel: { color: C.borderMid, fontSize: 8, letterSpacing: 2, marginBottom: 6 },
  infoLine:  { color: C.slate, fontSize: 11, marginBottom: 4 },

  // Wallet
  walletBox:   { backgroundColor: C.surface, borderWidth: 1, borderColor: C.crimson + "50", padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: C.crimson },
  walletLabel: { color: C.crimson, fontWeight: "700", fontSize: 11, letterSpacing: 1.5, marginBottom: 4 },
  walletLink:  { color: C.parchment, fontSize: 11 },

  // Link rows
  linkRow:      { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  linkRowTitle: { color: C.parchment, fontWeight: "700", fontSize: 12, letterSpacing: 0.5 },
  linkRowSub:   { color: C.slate, fontSize: 10, marginTop: 2 },

  // Axie list
  axieList: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 10, marginBottom: 12 },
  axieHdr:  { flexDirection: "row", gap: 4, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 4 },
  axieCol:  { color: C.borderMid, fontSize: 8, letterSpacing: 1 },
  axieRow:  { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border + "50" },
  axieId:   { color: C.crimson, fontSize: 10, fontFamily: "monospace", textDecorationLine: "underline" },
  axieTx:   { color: C.ember, fontSize: 9, fontFamily: "monospace" },
  seeAll:   { paddingVertical: 8, alignItems: "center" },
  seeAllTxt:{ color: C.crimson, fontSize: 9, letterSpacing: 2, fontWeight: "700" },

  // Note
  note:    { backgroundColor: C.surface2, borderLeftWidth: 2, borderLeftColor: C.borderMid, padding: 10, marginBottom: 14 },
  noteTxt: { color: C.slate, fontSize: 11, lineHeight: 17 },

  // ── FILTROS ──
  filterSection:      { marginBottom: 14 },
  filterLabel:        { color: C.borderMid, fontSize: 8, letterSpacing: 2, marginBottom: 6 },
  filterRow:          { flexDirection: "row", gap: 6 },
  filterBtn:          { borderWidth: 1, borderColor: C.borderMid, paddingHorizontal: 10, paddingVertical: 6 },
  filterBtnActive:    { borderColor: C.crimson, backgroundColor: C.crimsonGlow },
  filterBtnTxt:       { color: C.slate, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  filterBtnTxtActive: { color: C.crimson },
  filterCount:        { color: C.borderMid, fontSize: 9, letterSpacing: 1, marginTop: 4 },

  // ── PREMIOS / MILESTONES ──
  msCard:       { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14 },
  msHeader:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  msLevelBadge: { width: 44, height: 32, borderWidth: 2, borderColor: C.ember, justifyContent: "center", alignItems: "center", backgroundColor: C.emberDim },
  msLevelTxt:   { color: C.ember, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  msThreshold:  { color: C.goldBrt, fontWeight: "800", fontSize: 14 },
  msSlpEquiv:   { color: C.slate, fontSize: 10, marginTop: 2 },
  msStatus:     { color: C.greenBrt, fontSize: 9, fontWeight: "700", letterSpacing: 1 },

  msItemBox:    { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, padding: 10, marginBottom: 10 },
  msItemLabel:  { color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 6 },
  msItemName:   { color: C.crimsonBrt, fontWeight: "700", fontSize: 13, textDecorationLine: "underline", marginBottom: 4 },
  msItemType:   { color: C.slate, fontSize: 10 },

  msTxRow:      { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border + "50" },
  msTxLabel:    { color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 3 },
  msTxHash:     { color: C.ember, fontSize: 10, fontFamily: "monospace" },

  msWinnerBox:  { paddingVertical: 8 },
  msWinnerLabel:{ color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 3 },
  msWinnerAddr: { color: C.parchment, fontSize: 11, fontFamily: "monospace" },

  // ── FONDOS ──
  poolRow:    { borderLeftWidth: 2, paddingLeft: 12, marginBottom: 14 },
  poolTop:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  poolName:   { flex: 1, fontWeight: "700", fontSize: 11, letterSpacing: 1 },
  poolUsd:    { fontWeight: "900", fontSize: 14 },
  poolPct:    { color: C.slate, fontSize: 9 },
  poolDetail: { color: C.slate, fontSize: 11, lineHeight: 16, marginBottom: 3 },
  poolTxLine: { color: C.slate, fontSize: 9 },
  poolTx:     { color: C.ember, fontFamily: "monospace" },

  extraBox:   { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.ember, padding: 12, marginTop: 6 },
  extraTitle: { color: C.ember, fontWeight: "700", fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  extraBody:  { color: C.slate, fontSize: 11, lineHeight: 17 },

  // ── GRÁFICO ──
  chartBox:    { height: 260, backgroundColor: "#000", borderWidth: 1, borderColor: C.borderMid, marginBottom: 10 },
  chartCta:    { borderWidth: 1, borderColor: C.crimson + "50", padding: 10, alignItems: "center" },
  chartCtaTxt: { color: C.crimson, fontSize: 9, letterSpacing: 2, fontWeight: "700" },
});