/**
 * app/ritual/[id]/participants.tsx
 * Lista de wallets participantes y tickets comprados por cada una.
 * 100% conectado a Supabase.
 */
import { ThemedText } from "@/components/themed-text";
import { fmtSlp } from "@/hooks/use-slp-price";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#000000", surface: "#0b0000", surface2: "#130000", border: "#2a0000", borderMid: "#550000",
  crimson: "#CC0000", ember: "#FF6600", emberDim: "#FF660020", slate: "#5a5a6a", parchment: "#C8BEB0",
};

type Participant = { wallet_address: string; tickets_count: number };
type EventInfo = { event_number: number; label: string; total_raised_slp: number };

export default function ParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: eventData }, { data: participantsData }] = await Promise.all([
        supabase.from("events").select("event_number, label, total_raised_slp").eq("id", id).maybeSingle(),
        supabase.from("participants").select("wallet_address, tickets_count").eq("event_id", id).order("tickets_count", { ascending: false }),
      ]);
      setEvent(eventData ?? null);
      setParticipants(participantsData ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ThemedText style={s.empty}>Cargando participantes...</ThemedText>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={s.safe}>
        <ThemedText style={s.empty}>Ritual no encontrado</ThemedText>
      </SafeAreaView>
    );
  }

  const totalTickets = participants.reduce((a, p) => a + p.tickets_count, 0);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <ThemedText style={s.title}>PARTICIPANTES — RITUAL #{event.event_number}</ThemedText>
        <ThemedText style={s.sub}>{event.label}</ThemedText>

        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>{participants.length}</ThemedText>
            <ThemedText style={s.summaryKey}>WALLETS</ThemedText>
          </View>
          <View style={s.summaryDiv} />
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>{totalTickets}</ThemedText>
            <ThemedText style={s.summaryKey}>TICKETS TOTALES</ThemedText>
          </View>
          <View style={s.summaryDiv} />
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>{fmtSlp(event.total_raised_slp)}</ThemedText>
            <ThemedText style={s.summaryKey}>SLP RECAUDADOS</ThemedText>
          </View>
        </View>

        <View style={s.note}>
          <ThemedText style={s.noteTxt}>
            Cada wallet aparece con la cantidad de tickets que compró durante la ventana de 72 horas. Un ticket = un NFT en la wallet Ronin del participante.
          </ThemedText>
        </View>

        {participants.length === 0 ? (
          <ThemedText style={{ color: C.slate, textAlign: "center", marginTop: 20 }}>
            No hubo participantes registrados en este ritual.
          </ThemedText>
        ) : (
          <>
            <View style={s.tableHeader}>
              <ThemedText style={[s.col, { flex: 0.4 }]}>#</ThemedText>
              <ThemedText style={[s.col, { flex: 3 }]}>WALLET</ThemedText>
              <ThemedText style={[s.col, { flex: 1, textAlign: "right" }]}>TICKETS</ThemedText>
            </View>

            {participants.map((p, i) => (
              <View key={i} style={s.row}>
                <ThemedText style={[s.rowNum, { flex: 0.4 }]}>{i + 1}</ThemedText>
                <ThemedText style={[s.rowWallet, { flex: 3 }]} numberOfLines={1}>{p.wallet_address}</ThemedText>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <View style={s.ticketBadge}>
                    <ThemedText style={s.ticketVal}>{p.tickets_count}</ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  empty:  { color: C.crimson, textAlign: "center", marginTop: 60 },

  title: { color: C.crimson, fontWeight: "900", fontSize: 15, letterSpacing: 2, marginBottom: 3 },
  sub:   { color: C.slate, fontSize: 11, marginBottom: 16 },

  summaryRow:  { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryVal:  { color: C.crimson, fontWeight: "900", fontSize: 16 },
  summaryKey:  { color: C.slate, fontSize: 7, letterSpacing: 1.5, marginTop: 2, textAlign: "center" },
  summaryDiv:  { width: 1, height: 30, backgroundColor: C.borderMid },

  note:    { backgroundColor: C.surface2, borderLeftWidth: 2, borderLeftColor: C.borderMid, padding: 10, marginBottom: 14 },
  noteTxt: { color: C.slate, fontSize: 11, lineHeight: 17 },

  tableHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderMid },
  col:         { color: C.borderMid, fontSize: 8, letterSpacing: 1.5 },

  row:       { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border + "50" },
  rowNum:    { color: C.slate, fontSize: 10 },
  rowWallet: { color: C.parchment, fontSize: 10, fontFamily: "monospace" },

  ticketBadge: { borderWidth: 1, borderColor: C.ember + "60", paddingHorizontal: 8, paddingVertical: 2, backgroundColor: C.emberDim },
  ticketVal:   { color: C.ember, fontWeight: "900", fontSize: 13 },
});