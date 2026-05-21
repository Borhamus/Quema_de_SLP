import { ThemedText } from "@/components/themed-text";
import { C, PAST_EVENTS, fmt } from "@/constants/ritualData";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RitualListScreen() {
  const router = useRouter();
  const list = [...PAST_EVENTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={s.title}>CRÓNICA DE RITUALES</ThemedText>
        <ThemedText style={s.sub}>Todos los rituales realizados. Tocá cualquiera para ver el registro completo.</ThemedText>

        <ThemedText style={s.count}>{list.length} rituales realizados</ThemedText>

        {list.map(e => (
          <TouchableOpacity key={e.id} onPress={() => router.push(`/ritual/${e.id}`)} activeOpacity={0.8}>
            <View style={s.card}>
              <View style={s.cardH}><ThemedText style={s.cardTitle}>Ritual Realizado #{e.id}</ThemedText><ThemedText style={s.cardDate}>{e.label}</ThemedText></View>
              <View style={s.cardStats}>
                <View style={s.cStat}><ThemedText style={[s.cVal, { color: C.ember }]}>🔥 {fmt(e.slpBurned)}</ThemedText><ThemedText style={s.cKey}>SLP</ThemedText></View>
                <View style={s.cStat}><ThemedText style={[s.cVal, { color: C.crimson }]}>⚡ {e.axiesReleased}</ThemedText><ThemedText style={s.cKey}>AXIES</ThemedText></View>
                <View style={s.cStat}><ThemedText style={[s.cVal, { color: C.goldBrt }]}>⚔️ {e.milestones.length}</ThemedText><ThemedText style={s.cKey}>MILESTONES</ThemedText></View>
                <View style={s.cStat}><ThemedText style={[s.cVal, { color: C.slate }]}>👥 {e.participantList.length}</ThemedText><ThemedText style={s.cKey}>WALLETS</ThemedText></View>
              </View>
              <View style={s.topP}><ThemedText style={s.topPL}>RECAUDADO</ThemedText><ThemedText style={s.topPV}>${fmt(e.totalRaisedUsd)} USD — {e.totalTickets} tickets</ThemedText></View>
            </View>
          </TouchableOpacity>
        ))}
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
  cVal: { fontWeight: "900", fontSize: 13, marginBottom: 2 },
  cKey: { color: C.slate, fontSize: 7, letterSpacing: 1 },
  topP: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  topPL: { color: C.borderMid, fontSize: 8, letterSpacing: 1.5, marginBottom: 3 },
  topPV: { color: C.goldBrt, fontSize: 11, fontWeight: "700" },
});