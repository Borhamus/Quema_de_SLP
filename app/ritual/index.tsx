/**
 * app/ritual/index.tsx — CRÓNICA DE RITUALES
 * Lista completa de eventos mensuales completados, 100% real.
 */
import { ThemedText } from "@/components/themed-text";
import { fmtSlp } from "@/hooks/use-slp-price";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#000000", surface: "#0b0000", border: "#2a0000", borderMid: "#550000",
  crimson: "#CC0000", ember: "#FF6600", goldBrt: "#D4A017", slate: "#5a5a6a", parchment: "#C8BEB0",
};

type RitualListItem = {
  id: string;
  event_number: number;
  label: string;
  total_raised_slp: number;
  axies_released: number;
  ritual_level: number;
  total_tickets: number;
  rewards_count: number;
  participants_count: number;
};

export default function RitualListScreen() {
  const router = useRouter();
  const [list, setList] = useState<RitualListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    const { data: events, error } = await supabase
      .from("events")
      .select("id, event_number, label, total_raised_slp, axies_released, ritual_level, total_tickets")
      .eq("status", "completado")
      .gt("event_number", 0) // excluye eventos de test
      .order("event_number", { ascending: false });

    if (error || !events) {
      console.error("[Ritual List] Error:", error);
      setList([]);
      return;
    }

    const withCounts = await Promise.all(
      events.map(async (e) => {
        const { count: rewardsCount } = await supabase
          .from("level_rewards_unlocked")
          .select("id", { count: "exact", head: true })
          .eq("event_id", e.id);

        const { count: participantsCount } = await supabase
          .from("participants")
          .select("id", { count: "exact", head: true })
          .eq("event_id", e.id);

        return {
          ...e,
          rewards_count: rewardsCount ?? 0,
          participants_count: participantsCount ?? 0,
        };
      })
    );

    setList(withCounts);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadList().finally(() => setLoading(false));
  }, [loadList]);

  // Realtime — si se cierra un evento mientras tenés esta pantalla abierta
  useEffect(() => {
    const channel = supabase
      .channel("ritual-list-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => loadList())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadList]);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={s.title}>CRÓNICA DE RITUALES</ThemedText>
        <ThemedText style={s.sub}>Todos los rituales realizados. Tocá cualquiera para ver el registro completo.</ThemedText>

        <ThemedText style={s.count}>{list.length} rituales realizados</ThemedText>

        {loading ? (
          <ThemedText style={{ color: C.slate, textAlign: "center", marginTop: 30 }}>Cargando crónica...</ThemedText>
        ) : list.length === 0 ? (
          <View style={s.emptyBox}>
            <ThemedText style={{ color: C.parchment, fontWeight: "800", fontSize: 13, marginBottom: 6, textAlign: "center" }}>
              AÚN NO HAY RITUALES COMPLETADOS
            </ThemedText>
            <ThemedText style={{ color: C.slate, fontSize: 11, textAlign: "center", lineHeight: 16 }}>
              Cuando se cierre el primer evento mensual, su registro completo va a aparecer acá.
            </ThemedText>
          </View>
        ) : (
          list.map(e => (
            <TouchableOpacity key={e.id} onPress={() => router.push(`/ritual/${e.id}`)} activeOpacity={0.8}>
              <View style={s.card}>
                <View style={s.cardH}>
                  <ThemedText style={s.cardTitle}>Ritual Realizado #{e.event_number}</ThemedText>
                  <ThemedText style={s.cardDate}>{e.label}</ThemedText>
                </View>
                <View style={s.cardStats}>
                  <View style={s.cStat}><ThemedText style={[s.cVal, { color: C.ember }]}>🔥 {fmtSlp(e.total_raised_slp)}</ThemedText><ThemedText style={s.cKey}>SLP REC.</ThemedText></View>
                  <View style={s.cStat}><ThemedText style={[s.cVal, { color: C.crimson }]}>⚡ {e.axies_released}</ThemedText><ThemedText style={s.cKey}>AXIES</ThemedText></View>
                  <View style={s.cStat}><ThemedText style={[s.cVal, { color: C.goldBrt }]}>⚔️ {e.rewards_count}</ThemedText><ThemedText style={s.cKey}>REWARDS</ThemedText></View>
                  <View style={s.cStat}><ThemedText style={[s.cVal, { color: C.slate }]}>👥 {e.participants_count}</ThemedText><ThemedText style={s.cKey}>WALLETS</ThemedText></View>
                </View>
                <View style={s.topP}>
                  <ThemedText style={s.topPL}>NIVEL ALCANZADO</ThemedText>
                  <ThemedText style={s.topPV}>Nivel {e.ritual_level} — {e.total_tickets} tickets vendidos</ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, scroll: { padding: 16 },
  title: { color: C.crimson, fontWeight: "900", fontSize: 18, letterSpacing: 3, textAlign: "center", marginBottom: 4 },
  sub: { color: C.slate, fontSize: 11, textAlign: "center", marginBottom: 16 },
  count: { color: C.borderMid, fontSize: 9, letterSpacing: 1, marginBottom: 10 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.crimson + "44", padding: 14, marginBottom: 12 },
  cardH: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardTitle: { color: C.parchment, fontWeight: "700", fontSize: 13 },
  cardDate: { color: C.slate, fontSize: 10 },
  cardStats: { flexDirection: "row", gap: 8, marginBottom: 10 },
  cStat: { flex: 1, alignItems: "center" },
  cVal: { fontWeight: "900", fontSize: 12, marginBottom: 2 },
  cKey: { color: C.slate, fontSize: 7, letterSpacing: 1 },
  topP: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  topPL: { color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 3 },
  topPV: { color: C.goldBrt, fontSize: 11, fontWeight: "700" },
  emptyBox: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid, padding: 20, marginTop: 10 },
});