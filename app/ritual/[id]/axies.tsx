/**
 * app/ritual/[id]/axies.tsx
 * Lista completa de Axies liberados con ID y TX de liberación.
 */
import React from "react";
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { C, getEvent } from "@/constants/ritualData";

export default function ReleasedAxiesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEvent(Number(id));

  if (!event) return (
    <SafeAreaView style={s.safe}>
      <ThemedText style={s.empty}>Ritual no encontrado</ThemedText>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <ThemedText style={s.title}>
          AXIES LIBERADOS — RITUAL #{event.id}
        </ThemedText>
        <ThemedText style={s.sub}>
          {event.axiesReleased} Axies removidos permanentemente del ecosistema
        </ThemedText>

        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>{event.axiesReleased}</ThemedText>
            <ThemedText style={s.summaryKey}>LIBERADOS</ThemedText>
          </View>
          <View style={s.summaryDiv} />
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>{event.axiesSwapped}</ThemedText>
            <ThemedText style={s.summaryKey}>SWAPPEADOS</ThemedText>
          </View>
          <View style={s.summaryDiv} />
          <View style={s.summaryItem}>
            <ThemedText style={s.summaryVal}>${event.floorPriceUsd}</ThemedText>
            <ThemedText style={s.summaryKey}>FLOOR PRICE</ThemedText>
          </View>
        </View>

        {/* Nota */}
        <View style={s.note}>
          <ThemedText style={s.noteTxt}>
            Cada Axie fue comprado al floor price del marketplace durante la ventana de swap y luego liberado (Release) al cierre del evento. La transacción en Ronin Explorer demuestra la operación irreversible. Tocá el ID del Axie para verlo en el marketplace, o la TX para verificar en Ronin.
          </ThemedText>
        </View>

        {/* Table header */}
        <View style={s.tableHeader}>
          <ThemedText style={[s.col, { flex: 0.4 }]}>#</ThemedText>
          <ThemedText style={[s.col, { flex: 1.5 }]}>AXIE ID</ThemedText>
          <ThemedText style={[s.col, { flex: 2.5 }]}>TX LIBERACIÓN</ThemedText>
          <ThemedText style={[s.col, { width: 40, textAlign: "center" }]}>
            VER
          </ThemedText>
        </View>

        {/* Rows */}
        {event.releasedAxies.map((ax, i) => (
          <View key={i} style={s.row}>
            <ThemedText style={[s.rowIdx, { flex: 0.4 }]}>
              {i + 1}
            </ThemedText>

            <TouchableOpacity
              style={{ flex: 1.5 }}
              onPress={() =>
                Linking.openURL(
                  `https://app.axieinfinity.com/marketplace/axies/${ax.axieId}/`
                )
              }
            >
              <ThemedText style={s.axieId}>#{ax.axieId}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 2.5 }}
              onPress={() => Linking.openURL(ax.txUrl)}
            >
              <ThemedText style={s.txHash}>{ax.txHash}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ width: 40, alignItems: "center" }}
              onPress={() => Linking.openURL(ax.txUrl)}
            >
              <ThemedText style={s.viewLink}>↗</ThemedText>
            </TouchableOpacity>
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
  sub:   { color: C.slate, fontSize: 11, marginBottom: 14 },

  summaryRow:  { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryVal:  { color: C.crimson, fontWeight: "900", fontSize: 18 },
  summaryKey:  { color: C.slate, fontSize: 7, letterSpacing: 1.5, marginTop: 2 },
  summaryDiv:  { width: 1, height: 30, backgroundColor: C.borderMid },

  note:    { backgroundColor: C.surface2, borderLeftWidth: 2, borderLeftColor: C.borderMid, padding: 10, marginBottom: 14 },
  noteTxt: { color: C.slate, fontSize: 11, lineHeight: 17 },

  tableHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderMid },
  col:         { color: C.borderMid, fontSize: 8, letterSpacing: 1.5 },

  row:      { flexDirection: "row", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border + "50" },
  rowIdx:   { color: C.slate, fontSize: 9 },
  axieId:   { color: C.crimson, fontSize: 10, fontFamily: "monospace", textDecorationLine: "underline" },
  txHash:   { color: C.ember, fontSize: 9, fontFamily: "monospace" },
  viewLink: { color: C.crimson, fontSize: 12, fontWeight: "700" },
});
