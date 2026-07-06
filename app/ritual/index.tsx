/**
 * app/ritual/index.tsx — Lista de todos los rituales completados (reales)
 * 100% conectado a Supabase — sin datos hardcodeados.
 */
import { ThemedText } from "@/components/themed-text";
import { fmtSlp } from "@/hooks/use-slp-price";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#000000", surface: "#0b0000", surface2: "#130000", border: "#2a0000", borderMid: "#550000",
  crimson: "#CC0000", crimsonBrt: "#FF2200", ember: "#FF6600", gold: "#B8860B", goldBrt: "#D4A017",
  greenBrt: "#6abf5e", slate: "#5a5a6a", parchment: "#C8BEB0",
};

type RitualListItem = {
  id: string;
  event_number: number;
  label: string;
  total_raised_slp: number;
  axies_released: number;
  ritual_level: number;
  total_tickets: number;
  burned_slp: number;
  rewards_count: number;
};

export default function RitualListScreen() {
  const router = useRouter();
  const [list, setList] = useState<RitualListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    const { data: configRow } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "show_test_events_in_history")
      .maybeSingle();
    const showTestEvents = configRow?.value === "true";

    let query = supabase
      .from("events")
      .select("id, event_number, label, total_raised_slp, axies_released, ritual_level, total_tickets")
      .eq("status", "completado");

    if (!showTestEvents) {
      query = query.gt("event_number", 0); // excluye eventos de test (activable desde /test)
    }

    const { data: events, error } = await query.order("event_number", { ascending: false });

    if (error || !events) {
      console.error("[Ritual List] Error:", error);
      setList([]);
      return;
    }

    const eventIds = events.map((e) => e.id);
    let burnedByEvent: Record<string, number> = {};
    let rewardsCountByEvent: Record<string, number> = {};

    if (eventIds.length > 0) {
      const [{ data: burnRows }, { data: rewardRows }] = await Promise.all([
        supabase.from("event_funds").select("event_id, total_slp").in("event_id", eventIds).eq("name", "Quema Directa"),
        supabase.from("level_rewards_unlocked").select("event_id").in("event_id", eventIds),
      ]);
      (burnRows ?? []).forEach((r) => { burnedByEvent[r.event_id] = r.total_slp ?? 0; });
      (rewardRows ?? []).forEach((r) => { rewardsCountByEvent[r.event_id] = (rewardsCountByEvent[r.event_id] ?? 0) + 1; });
    }

    setList(events.map((e) => ({
      ...e,
      burned_slp: burnedByEvent[e.id] ?? 0,
      rewards_count: rewardsCountByEvent[e.id] ?? 0,
    })));
  }, []);

  // Recarga cada vez que volvés a esta pantalla.
  useFocusEffect(useCallback(() => { loadList(); }, [loadList]));

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={s.title}>CRÓNICA DE RITUALES</ThemedText>
        <ThemedText style={s.sub}>Todos los rituales ya finalizados, de más reciente a más viejo.</ThemedText>

        {loading && list.length === 0 ? (
          <ThemedText style={s.empty}>Cargando...</ThemedText>
        ) : list.length === 0 ? (
          <ThemedText style={s.empty}>Todavía no hay rituales completados.</ThemedText>
        ) : (
          list.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/ritual/${item.id}`)}
            >
              <ThemedText style={s.cardTitle}>Ritual #{item.event_number} — {item.label}</ThemedText>
              <View style={s.cardStatsRow}>
                <View style={s.cardStat}>
                  <ThemedText style={[s.cardStatVal, { color: C.goldBrt }]}>{fmtSlp(item.total_raised_slp)}</ThemedText>
                  <ThemedText style={s.cardStatKey}>SLP RECAUDADOS</ThemedText>
                </View>
                <View style={s.cardStat}>
                  <ThemedText style={[s.cardStatVal, { color: C.parchment }]}>{item.total_tickets}</ThemedText>
                  <ThemedText style={s.cardStatKey}>TICKETS</ThemedText>
                </View>
                <View style={s.cardStat}>
                  <ThemedText style={[s.cardStatVal, { color: C.crimson }]}>{item.axies_released}</ThemedText>
                  <ThemedText style={s.cardStatKey}>AXIES</ThemedText>
                </View>
                <View style={s.cardStat}>
                  <ThemedText style={[s.cardStatVal, { color: C.ember }]}>{item.ritual_level}</ThemedText>
                  <ThemedText style={s.cardStatKey}>NIVEL</ThemedText>
                </View>
              </View>
              <View style={[s.cardStatsRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: C.borderMid, paddingTop: 10 }]}>
                <View style={s.cardStat}>
                  <ThemedText style={[s.cardStatVal, { color: C.ember }]}>🔥 {fmtSlp(item.burned_slp)}</ThemedText>
                  <ThemedText style={s.cardStatKey}>SLP QUEMADOS</ThemedText>
                </View>
                <View style={s.cardStat}>
                  <ThemedText style={[s.cardStatVal, { color: C.goldBrt }]}>🏆 {item.rewards_count}</ThemedText>
                  <ThemedText style={s.cardStatKey}>REWARDS ALCANZADAS</ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 60 },
  title: { color: C.crimsonBrt, fontSize: 16, fontWeight: "900", letterSpacing: 2, marginBottom: 4 },
  sub: { color: C.slate, fontSize: 11, marginBottom: 20 },
  empty: { color: C.slate, textAlign: "center", marginTop: 60, fontSize: 12 },
  card: {
    borderWidth: 1, borderColor: C.borderMid, backgroundColor: C.surface,
    padding: 14, marginBottom: 12,
  },
  cardTitle: { color: C.parchment, fontSize: 13, fontWeight: "700", marginBottom: 12 },
  cardStatsRow: { flexDirection: "row", justifyContent: "space-between" },
  cardStat: { alignItems: "center", flex: 1 },
  cardStatVal: { fontSize: 14, fontWeight: "900" },
  cardStatKey: { color: C.slate, fontSize: 8, letterSpacing: 0.5, marginTop: 2 },
});