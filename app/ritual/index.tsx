/**
 * app/ritual/[id]/index.tsx — Página completa de un ritual (real)
 * Tabs: Actas | Premios (rewards) | Fondos | Gráfico
 * 100% conectado a Supabase — sin datos hardcodeados.
 */
import { ThemedText } from "@/components/themed-text";
import { chartHtml } from "@/constants/ritualData";
import { fmtSlp } from "@/hooks/use-slp-price";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";

const C = {
  bg: "#000000", surface: "#0b0000", surface2: "#130000", border: "#2a0000", borderMid: "#550000",
  crimson: "#CC0000", crimsonBrt: "#FF2200", ember: "#FF6600", gold: "#B8860B", goldBrt: "#D4A017",
  greenBrt: "#6abf5e", slate: "#5a5a6a", parchment: "#C8BEB0",
};

type Tab = "actas" | "premios" | "ganadores" | "fondos" | "chart";

type EventDetail = {
  id: string;
  event_number: number;
  label: string;
  date_start: string;
  total_raised_slp: number;
  total_tickets: number;
  ritual_level: number;
  axies_released: number;
  axies_swapped: number;
  swap_pool_spent_slp: number;
  cooldown_resets: number;
  wallet_url: string | null;
};

type RewardItem = {
  id: string;
  level_reached: number;
  amount_usd: number;
  slp_equivalent: number;
  status: string;
  draw_order: number;
  winner_wallet: string | null;
  winner_ticket_id: string | null;
  delivery_tx_hash: string | null;
  delivery_tx_url: string | null;
  tickets: { qr_code: string; paid_slp: number | null } | null;
};

type ReleasedAxie = { axie_id: string; tx_hash: string | null; tx_url: string | null };
type FundRow = { name: string; emoji: string; color_hex: string; pct_of_ticket: number; total_slp: number; total_usd_ref: number; detail: string | null; tx_hash: string | null; tx_url: string | null };

export default function RitualDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("actas");
  const [showAxies, setShowAxies] = useState(false);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [axies, setAxies] = useState<ReleasedAxie[]>([]);
  const [funds, setFunds] = useState<FundRow[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const { data: eventData } = await supabase
      .from("events")
      .select("id, event_number, label, date_start, total_raised_slp, total_tickets, ritual_level, axies_released, axies_swapped, swap_pool_spent_slp, cooldown_resets, wallet_url")
      .eq("id", id)
      .maybeSingle();

    if (!eventData) {
      setEvent(null);
      return;
    }
    setEvent(eventData);

    const [{ data: rewardsData }, { data: axiesData }, { data: fundsData }, { count }] = await Promise.all([
      supabase.from("level_rewards_unlocked")
        .select("id, level_reached, amount_usd, slp_equivalent, status, draw_order, winner_wallet, winner_ticket_id, delivery_tx_hash, delivery_tx_url, tickets:winner_ticket_id(qr_code, paid_slp)")
        .eq("event_id", id).order("draw_order"),
      supabase.from("released_axies").select("axie_id, tx_hash, tx_url").eq("event_id", id),
      supabase.from("event_funds").select("name, emoji, color_hex, pct_of_ticket, total_slp, total_usd_ref, detail, tx_hash, tx_url").eq("event_id", id),
      supabase.from("participants").select("id", { count: "exact", head: true }).eq("event_id", id),
    ]);

    setRewards((rewardsData as any) ?? []);
    setAxies(axiesData ?? []);
    setFunds(fundsData ?? []);
    setParticipantsCount(count ?? 0);

    // Nombres de perfil de las wallets ganadoras (si tienen uno cargado)
    const winnerWallets = Array.from(
      new Set((rewardsData ?? []).map((r: any) => r.winner_wallet).filter(Boolean))
    );
    if (winnerWallets.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("wallet_address, display_name")
        .in("wallet_address", winnerWallets);
      const map: Record<string, string> = {};
      (profilesData ?? []).forEach((p) => { if (p.display_name) map[p.wallet_address] = p.display_name; });
      setDisplayNames(map);
    } else {
      setDisplayNames({});
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ThemedText style={{ color: C.slate, textAlign: "center", marginTop: 60 }}>Cargando ritual...</ThemedText>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={s.safe}>
        <ThemedText style={{ color: C.crimson, textAlign: "center", marginTop: 60, fontSize: 16 }}>
          Ritual no encontrado
        </ThemedText>
      </SafeAreaView>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "actas",     label: "⚔️ ACTAS"     },
    { key: "premios",   label: "🏆 PREMIOS"   },
    { key: "ganadores", label: "💸 GANADORES" },
    { key: "fondos",    label: "💰 FONDOS"    },
    { key: "chart",     label: "📈 GRÁFICO"   },
  ];

  const levels = Array.from(new Set(rewards.map(r => r.level_reached))).sort((a, b) => a - b);
  const filteredRewards = filterLevel === null ? rewards : rewards.filter(r => r.level_reached === filterLevel);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <ThemedText style={{ color: C.crimson, fontSize: 18 }}>✡</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={s.title}>RITUAL REALIZADO #{event.event_number}</ThemedText>
              <ThemedText style={s.sub}>{event.label.toUpperCase()}</ThemedText>
            </View>
          </View>
          <View style={s.quickStats}>
            <View style={s.qStat}><ThemedText style={[s.qVal, { color: C.goldBrt }]}>{fmtSlp(event.total_raised_slp)}</ThemedText><ThemedText style={s.qKey}>SLP RECAUDADOS</ThemedText></View>
            <View style={s.qStat}><ThemedText style={[s.qVal, { color: C.parchment }]}>{event.total_tickets}</ThemedText><ThemedText style={s.qKey}>TICKETS</ThemedText></View>
            <View style={s.qStat}><ThemedText style={[s.qVal, { color: C.crimson }]}>{rewards.length}</ThemedText><ThemedText style={s.qKey}>REWARDS</ThemedText></View>
          </View>
        </View>

        {/* ── TABS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 14, paddingHorizontal: 16 }}>
          <View style={s.tabs}>
            {tabs.map(t => (
              <TouchableOpacity key={t.key} style={[s.tabBtn, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
                <ThemedText style={[s.tabTxt, tab === t.key && s.tabTxtActive]}>{t.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={s.content}>

          {/* ═══════════════ ACTAS ═══════════════ */}
          {tab === "actas" && (
            <>
              <View style={s.grid}>
                {[
                  { val: `🔥 ${fmtSlp(funds.find(f => f.name === "Quema Directa")?.total_slp ?? 0)}`, key: "SLP QUEMADOS",      color: C.ember   },
                  { val: `⚡ ${event.axies_released}`,   key: "AXIES LIBERADOS",  color: C.crimson },
                  { val: `⚔️ ${event.ritual_level}`, key: "NIVEL ALCANZADO",   color: C.goldBrt },
                  { val: `👥 ${participantsCount}`, key: "PARTICIPANTES", color: C.slate },
                ].map(st => (
                  <View key={st.key} style={s.statBox}>
                    <ThemedText style={[s.statVal, { color: st.color }]}>{st.val}</ThemedText>
                    <ThemedText style={s.statKey}>{st.key}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={s.infoBox}>
                <ThemedText style={s.infoLabel}>VENTANA DE SWAP</ThemedText>
                <ThemedText style={s.infoLine}>
                  Axies swappeados: <ThemedText style={{ color: C.crimson, fontWeight: "700" }}>{event.axies_swapped}</ThemedText>
                </ThemedText>
                <ThemedText style={s.infoLine}>
                  Pool de Swap gastado: <ThemedText style={{ color: C.crimson, fontWeight: "700" }}>{fmtSlp(event.swap_pool_spent_slp)} SLP</ThemedText>
                </ThemedText>
                <ThemedText style={s.infoLine}>
                  Cooldowns reseteados: <ThemedText style={{ color: C.crimson, fontWeight: "700" }}>{event.cooldown_resets}</ThemedText>
                </ThemedText>
              </View>

              {event.wallet_url && (
                <TouchableOpacity style={s.walletBox} onPress={() => Linking.openURL(event.wallet_url!)} activeOpacity={0.8}>
                  <ThemedText style={s.walletLabel}>VERIFICÁ NUESTRA WALLET PÚBLICA</ThemedText>
                  <ThemedText style={s.walletLink}>Ver toda la actividad en Ronin Explorer →</ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={s.linkRow} onPress={() => router.push(`/ritual/${event.id}/participants`)} activeOpacity={0.8}>
                <ThemedText style={{ fontSize: 16 }}>👥</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText style={s.linkRowTitle}>PARTICIPANTES ({participantsCount})</ThemedText>
                  <ThemedText style={s.linkRowSub}>Ver lista de wallets y tickets comprados por cada una</ThemedText>
                </View>
                <ThemedText style={{ color: C.crimson, fontSize: 14 }}>→</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={s.linkRow} onPress={() => setShowAxies(!showAxies)} activeOpacity={0.8}>
                <ThemedText style={{ fontSize: 16 }}>⚡</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText style={s.linkRowTitle}>AXIES LIBERADOS ({axies.length})</ThemedText>
                  <ThemedText style={s.linkRowSub}>ID de cada Axie y TX de liberación en Ronin</ThemedText>
                </View>
                <ThemedText style={{ color: C.crimson, fontSize: 10 }}>{showAxies ? "▲" : "▼"}</ThemedText>
              </TouchableOpacity>

              {showAxies && (
                <View style={s.axieList}>
                  {axies.length === 0 ? (
                    <ThemedText style={{ color: C.slate, fontSize: 11, textAlign: "center", paddingVertical: 10 }}>
                      No hubo Axies liberados en este ritual.
                    </ThemedText>
                  ) : (
                    <>
                      <View style={s.axieHdr}>
                        <ThemedText style={[s.axieCol, { flex: 1 }]}>AXIE ID</ThemedText>
                        <ThemedText style={[s.axieCol, { flex: 2 }]}>TX LIBERACIÓN</ThemedText>
                        <ThemedText style={[s.axieCol, { width: 30, textAlign: "center" }]}>VER</ThemedText>
                      </View>
                      {axies.slice(0, 15).map((ax, i) => (
                        <View key={i} style={s.axieRow}>
                          <TouchableOpacity style={{ flex: 1 }} onPress={() => Linking.openURL(`https://app.axieinfinity.com/marketplace/axies/${ax.axie_id}/`)}>
                            <ThemedText style={s.axieId}>#{ax.axie_id}</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ flex: 2 }} onPress={() => ax.tx_url && Linking.openURL(ax.tx_url)}>
                            <ThemedText style={s.axieTx} numberOfLines={1}>{ax.tx_hash ?? "pendiente"}</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ width: 30, alignItems: "center" }} onPress={() => ax.tx_url && Linking.openURL(ax.tx_url)}>
                            <ThemedText style={{ color: C.crimson, fontSize: 10 }}>↗</ThemedText>
                          </TouchableOpacity>
                        </View>
                      ))}
                      {axies.length > 15 && (
                        <TouchableOpacity style={s.seeAll} onPress={() => router.push(`/ritual/${event.id}/axies`)}>
                          <ThemedText style={s.seeAllTxt}>VER LOS {axies.length} AXIES LIBERADOS →</ThemedText>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {/* ═══════════════ PREMIOS (REWARDS) ═══════════════ */}
          {tab === "premios" && (
            <>
              <View style={s.note}>
                <ThemedText style={s.noteTxt}>
                  Cada reward se desbloquea cuando el Pool de Recompensas cruza el umbral de su nivel. El SLP queda congelado al precio del momento exacto y se sortea entre los tickets vivos.
                </ThemedText>
              </View>

              {levels.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 14 }}>
                  <View style={s.filterRow}>
                    <TouchableOpacity style={[s.filterBtn, filterLevel === null && s.filterBtnActive]} onPress={() => setFilterLevel(null)}>
                      <ThemedText style={[s.filterBtnTxt, filterLevel === null && s.filterBtnTxtActive]}>TODOS</ThemedText>
                    </TouchableOpacity>
                    {levels.map(lv => (
                      <TouchableOpacity key={lv} style={[s.filterBtn, filterLevel === lv && s.filterBtnActive]} onPress={() => setFilterLevel(filterLevel === lv ? null : lv)}>
                        <ThemedText style={[s.filterBtnTxt, filterLevel === lv && s.filterBtnTxtActive]}>NIVEL {lv}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              {filteredRewards.length === 0 ? (
                <ThemedText style={{ color: C.slate, textAlign: "center", marginTop: 30, fontSize: 12 }}>
                  No hay rewards con esos filtros.
                </ThemedText>
              ) : (
                filteredRewards.map(r => (
                  <View key={r.id} style={s.msCard}>
                    <View style={s.msHeader}>
                      <View style={[s.msLevelBadge, { borderColor: r.status === "entregada" ? C.greenBrt : C.gold }]}>
                        <ThemedText style={[s.msLevelTxt, { color: r.status === "entregada" ? C.greenBrt : C.gold }]}>N{r.level_reached}</ThemedText>
                      </View>
                      <ThemedText style={s.msItemName}>{fmtSlp(r.slp_equivalent)} SLP (~${r.amount_usd})</ThemedText>
                      <ThemedText style={[s.msStatus, { color: r.status === "entregada" ? C.greenBrt : C.gold }]}>
                        {r.status === "entregada" ? "✓ ENTREGADA" : "⏳ PENDING"}
                      </ThemedText>
                    </View>

                    {r.status === "entregada" && r.winner_wallet ? (
                      <>
                        <View style={s.msWinnerBox}>
                          <ThemedText style={s.msWinnerLabel}>WALLET GANADORA DEL SORTEO</ThemedText>
                          <ThemedText style={s.msWinnerAddr}>{r.winner_wallet}</ThemedText>
                        </View>
                        {r.delivery_tx_url && (
                          <TouchableOpacity style={s.msTxRow} onPress={() => Linking.openURL(r.delivery_tx_url!)}>
                            <ThemedText style={s.msTxLabel}>TX ENTREGA AL GANADOR</ThemedText>
                            <ThemedText style={s.msTxHash} numberOfLines={1}>{r.delivery_tx_hash} ↗</ThemedText>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : (
                      <ThemedText style={{ color: C.slate, fontSize: 10, paddingVertical: 6 }}>
                        Sorteo #{r.draw_order} — todavía no se realizó.
                      </ThemedText>
                    )}
                  </View>
                ))
              )}
            </>
          )}

          {/* ═══════════════ GANADORES (log de transferencias) ═══════════════ */}
          {tab === "ganadores" && (
            <>
              <View style={s.note}>
                <ThemedText style={s.noteTxt}>
                  Una fila por cada premio efectivamente entregado — la wallet tenía el ticket ganador
                  al momento del sorteo, y la transferencia quedó registrada acá.
                </ThemedText>
              </View>

              {rewards.filter(r => r.status === "entregada").length === 0 ? (
                <ThemedText style={{ color: C.slate, textAlign: "center", marginTop: 30, fontSize: 12 }}>
                  Todavía no se entregó ningún premio en este ritual.
                </ThemedText>
              ) : (
                rewards.filter(r => r.status === "entregada").map(r => {
                  const name = r.winner_wallet ? displayNames[r.winner_wallet] : null;
                  const shortWallet = r.winner_wallet ? `${r.winner_wallet.slice(0, 8)}...${r.winner_wallet.slice(-6)}` : "—";
                  return (
                    <View key={r.id} style={s.msCard}>
                      <View style={s.msHeader}>
                        <View style={[s.msLevelBadge, { borderColor: C.greenBrt }]}>
                          <ThemedText style={[s.msLevelTxt, { color: C.greenBrt }]}>N{r.level_reached}</ThemedText>
                        </View>
                        <ThemedText style={s.msItemName}>{fmtSlp(r.slp_equivalent)} SLP (~${r.amount_usd})</ThemedText>
                      </View>

                      <View style={s.msWinnerBox}>
                        <ThemedText style={s.msWinnerLabel}>PAGADO A</ThemedText>
                        <ThemedText style={s.msWinnerAddr}>{name ?? shortWallet}</ThemedText>
                        {name && <ThemedText style={{ color: C.slate, fontSize: 9, marginTop: 2 }}>{shortWallet}</ThemedText>}
                      </View>

                      <View style={s.msWinnerBox}>
                        <ThemedText style={s.msWinnerLabel}>TICKET GANADOR</ThemedText>
                        <ThemedText style={s.msWinnerAddr}>{r.tickets?.qr_code ?? "—"}</ThemedText>
                        {r.tickets?.paid_slp != null && (
                          <ThemedText style={{ color: C.slate, fontSize: 9, marginTop: 2 }}>
                            Comprado por {fmtSlp(r.tickets.paid_slp)} SLP
                          </ThemedText>
                        )}
                      </View>

                      {r.delivery_tx_url && (
                        <TouchableOpacity style={s.msTxRow} onPress={() => Linking.openURL(r.delivery_tx_url!)}>
                          <ThemedText style={s.msTxLabel}>TX DE LA TRANSFERENCIA</ThemedText>
                          <ThemedText style={s.msTxHash} numberOfLines={1}>{r.delivery_tx_hash} ↗</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* ═══════════════ FONDOS ═══════════════ */}
          {tab === "fondos" && (
            <>
              <View style={s.note}>
                <ThemedText style={s.noteTxt}>
                  Distribución de los {fmtSlp(event.total_raised_slp)} SLP recaudados de la venta de {event.total_tickets} tickets. Cada movimiento tiene su hash de transacción verificable en Ronin Explorer.
                </ThemedText>
              </View>

              {funds.length === 0 ? (
                <ThemedText style={{ color: C.slate, textAlign: "center", marginTop: 20, fontSize: 12 }}>
                  El resumen de fondos se genera al finalizar el evento.
                </ThemedText>
              ) : (
                funds.map(pm => (
                  <View key={pm.name} style={[s.poolRow, { borderLeftColor: pm.color_hex }]}>
                    <View style={s.poolTop}>
                      <ThemedText style={{ fontSize: 14 }}>{pm.emoji}</ThemedText>
                      <ThemedText style={[s.poolName, { color: pm.color_hex }]}>{pm.name}</ThemedText>
                      <View style={{ alignItems: "flex-end" }}>
                        <ThemedText style={[s.poolUsd, { color: pm.color_hex }]}>{fmtSlp(pm.total_slp)} SLP</ThemedText>
                        <ThemedText style={s.poolPct}>{pm.pct_of_ticket}% del ticket</ThemedText>
                      </View>
                    </View>
                    {pm.detail && <ThemedText style={s.poolDetail}>{pm.detail}</ThemedText>}
                    {pm.tx_url && (
                      <TouchableOpacity onPress={() => Linking.openURL(pm.tx_url!)}>
                        <ThemedText style={s.poolTxLine}>TX: <ThemedText style={s.poolTx} numberOfLines={1}>{pm.tx_hash} ↗</ThemedText></ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}

              {event.cooldown_resets > 0 && (
                <View style={s.extraBox}>
                  <ThemedText style={s.extraTitle}>INGRESOS EXTRA POR RESET DE COOLDOWN</ThemedText>
                  <ThemedText style={s.extraBody}>
                    {event.cooldown_resets} resets realizados durante la ventana de swap.{"\n"}
                    Esos fondos se distribuyeron: 50% Quema, 40% Devs, 10% Pool Anual.
                  </ThemedText>
                </View>
              )}
            </>
          )}

          {/* ═══════════════ GRÁFICO ═══════════════ */}
          {tab === "chart" && (
            <>
              <View style={s.note}>
                <ThemedText style={s.noteTxt}>
                  Precio del SLP/USD: 2 días antes → 2 días después del ritual.
                </ThemedText>
              </View>

              <View style={s.chartBox}>
                {Platform.OS === "web" ? (
                  // @ts-ignore — <iframe> es un elemento DOM real, válido en build web
                  <iframe
                    srcDoc={chartHtml(event.date_start)}
                    style={{ border: 0, width: "100%", height: "100%", backgroundColor: "#000" }}
                  />
                ) : (
                  <WebView
                    source={{ html: chartHtml(event.date_start) }}
                    style={{ flex: 1, backgroundColor: "#000" }}
                    scrollEnabled={false}
                    javaScriptEnabled
                    domStorageEnabled
                    originWhitelist={["*"]}
                    backgroundColor="#000000"
                  />
                )}
              </View>
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: C.borderMid, backgroundColor: C.surface },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  title: { color: C.parchment, fontWeight: "900", fontSize: 15, letterSpacing: 1 },
  sub: { color: C.crimson, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  quickStats: { flexDirection: "row", gap: 8 },
  qStat: { flex: 1, alignItems: "center" },
  qVal: { fontWeight: "900", fontSize: 14 },
  qKey: { color: C.slate, fontSize: 7, letterSpacing: 1, marginTop: 2, textAlign: "center" },

  tabs: { flexDirection: "row", gap: 8 },
  tabBtn: { borderWidth: 1, borderColor: C.borderMid, paddingHorizontal: 12, paddingVertical: 8 },
  tabActive: { borderColor: C.crimson, backgroundColor: C.crimson + "15" },
  tabTxt: { color: C.slate, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  tabTxtActive: { color: C.crimsonBrt },

  content: { paddingHorizontal: 16 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  statBox: { flexBasis: "47%", flexGrow: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 10, alignItems: "center" },
  statVal: { fontWeight: "900", fontSize: 14, marginBottom: 2 },
  statKey: { color: C.slate, fontSize: 7, letterSpacing: 1 },

  infoBox: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  infoLabel: { color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 6 },
  infoLine: { color: C.slate, fontSize: 11, marginBottom: 4, lineHeight: 16 },

  walletBox: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.crimson + "40", padding: 12, marginBottom: 10 },
  walletLabel: { color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
  walletLink: { color: C.crimsonBrt, fontSize: 11, fontWeight: "700" },

  linkRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8 },
  linkRowTitle: { color: C.parchment, fontWeight: "700", fontSize: 12 },
  linkRowSub: { color: C.slate, fontSize: 9, marginTop: 2 },

  axieList: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 10, marginBottom: 10 },
  axieHdr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.borderMid, paddingBottom: 6, marginBottom: 4 },
  axieCol: { color: C.borderMid, fontSize: 7, letterSpacing: 1 },
  axieRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border + "50" },
  axieId: { color: C.crimson, fontSize: 11, fontWeight: "700" },
  axieTx: { color: C.slate, fontSize: 9, fontFamily: "monospace" },
  seeAll: { paddingVertical: 10, alignItems: "center" },
  seeAllTxt: { color: C.crimson, fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  note: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, padding: 10, marginBottom: 14 },
  noteTxt: { color: C.slate, fontSize: 10, lineHeight: 15 },

  filterRow: { flexDirection: "row", gap: 6 },
  filterBtn: { borderWidth: 1, borderColor: C.borderMid, paddingHorizontal: 10, paddingVertical: 6 },
  filterBtnActive: { borderColor: C.gold, backgroundColor: C.gold + "15" },
  filterBtnTxt: { color: C.slate, fontSize: 9, fontWeight: "700" },
  filterBtnTxtActive: { color: C.goldBrt },

  msCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  msHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  msLevelBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  msLevelTxt: { fontSize: 9, fontWeight: "900" },
  msItemName: { flex: 1, color: C.parchment, fontWeight: "700", fontSize: 12 },
  msStatus: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },

  msTxRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border + "50" },
  msTxLabel: { color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 3 },
  msTxHash: { color: C.ember, fontSize: 10, fontFamily: "monospace" },

  msWinnerBox: { paddingVertical: 8 },
  msWinnerLabel: { color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 3 },
  msWinnerAddr: { color: C.parchment, fontSize: 11, fontFamily: "monospace" },

  poolRow: { borderLeftWidth: 2, paddingLeft: 12, marginBottom: 14 },
  poolTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  poolName: { flex: 1, fontWeight: "700", fontSize: 11, letterSpacing: 1 },
  poolUsd: { fontWeight: "900", fontSize: 13 },
  poolPct: { color: C.slate, fontSize: 9 },
  poolDetail: { color: C.slate, fontSize: 11, lineHeight: 16, marginBottom: 3 },
  poolTxLine: { color: C.slate, fontSize: 9 },
  poolTx: { color: C.ember, fontFamily: "monospace" },

  extraBox: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.ember, padding: 12, marginTop: 6 },
  extraTitle: { color: C.ember, fontWeight: "700", fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  extraBody: { color: C.slate, fontSize: 11, lineHeight: 17 },

  chartBox: { height: 260, backgroundColor: "#000", borderWidth: 1, borderColor: C.borderMid, marginBottom: 10 },
});