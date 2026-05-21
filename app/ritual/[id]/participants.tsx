/**
 * app/ritual/[id]/participants.tsx
 * Lista de wallets participantes y tickets comprados por cada una.
 */
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { C, getEvent } from "@/constants/ritualData";

export default function ParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEvent(Number(id));

  if (!event) return (
    <SafeAreaView style={s.safe}>
      <ThemedText style={s.empty}>Ritual no encontrado</ThemedText>
    </SafeAreaView>
  );

  const sorted = [...event.participantList].sort((a, b) => b.tickets - a.tickets);
  const totalTickets = sorted.reduce((a, p) => a + p.tickets, 0);

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <ThemedText style={s.title}>
          PARTICIPANTES — RITUAL #{event.id}
        </ThemedText>
        <ThemedText style={s.sub}>{event.label}</ThemedText>

        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>
              {event.participantList.length}
            </ThemedText>
            <ThemedText style={s.summaryKey}>WALLETS</ThemedText>
          </View>
          <View style={s.summaryDiv} />
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>{totalTickets}</ThemedText>
            <ThemedText style={s.summaryKey}>TICKETS TOTALES</ThemedText>
          </View>
          <View style={s.summaryDiv} />
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>
              ${event.totalRaisedUsd.toLocaleString()}
            </ThemedText>
            <ThemedText style={s.summaryKey}>USD RECAUDADOS</ThemedText>
          </View>
        </View>

        {/* Nota */}
        <View style={s.note}>
          <ThemedText style={s.noteTxt}>
            Cada wallet aparece con la cantidad de tickets que compró durante la ventana de 72 horas. Un ticket = un NFT ERC-721 en la wallet Ronin del participante.
          </ThemedText>
        </View>

        {/* Table header */}
        <View style={s.tableHeader}>
          <ThemedText style={[s.col, { flex: 0.4 }]}>#</ThemedText>
          <ThemedText style={[s.col, { flex: 3 }]}>WALLET</ThemedText>
          <ThemedText style={[s.col, { flex: 1, textAlign: "right" }]}>
            TICKETS
          </ThemedText>
        </View>

        {/* Rows */}
        {sorted.map((p, i) => (
          <View key={i} style={s.row}>
            <ThemedText style={[s.rowNum, { flex: 0.4 }]}>
              {i + 1}
            </ThemedText>
            <ThemedText style={[s.rowWallet, { flex: 3 }]}>
              {p.wallet}
            </ThemedText>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View style={s.ticketBadge}>
                <ThemedText style={s.ticketVal}>{p.tickets}</ThemedText>
              </View>
            </View>
          </View>
        ))}

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
  summaryVal:  { color: C.crimson, fontWeight: "900", fontSize: 18 },
  summaryKey:  { color: C.slate, fontSize: 7, letterSpacing: 1.5, marginTop: 2 },
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
