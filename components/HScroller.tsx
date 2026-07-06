/**
 * components/HScroller.tsx
 *
 * Envoltorio para listas horizontales (Axies, etc). El scroll táctil
 * de un ScrollView horizontal a veces no engancha bien con mouse en
 * web (sobre todo si hay TouchableOpacity adentro, que puede robarse
 * el gesto). En vez de pelear con eso, esto agrega flechas ◀ ▶ que
 * SIEMPRE funcionan con un click, sin depender de drag/gestos — y
 * solo aparecen si el contenido realmente no entra completo.
 */
import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function HScroller({ children, step = 200 }: { children: React.ReactNode; step?: number }) {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const showArrows = contentWidth > containerWidth + 4;
  const canLeft = scrollX > 4;
  const canRight = scrollX < contentWidth - containerWidth - 4;

  const scrollBy = (delta: number) => {
    const target = Math.max(0, Math.min(scrollX + delta, contentWidth - containerWidth));
    scrollRef.current?.scrollTo({ x: target, animated: true });
  };

  return (
    <View style={hs.row}>
      {showArrows && (
        <TouchableOpacity onPress={() => scrollBy(-step)} disabled={!canLeft} style={[hs.arrowBtn, !canLeft && hs.arrowDisabled]}>
          <Text style={hs.arrowTxt}>◀</Text>
        </TouchableOpacity>
      )}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        style={{ flex: 1 }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={32}
      >
        {children}
      </ScrollView>
      {showArrows && (
        <TouchableOpacity onPress={() => scrollBy(step)} disabled={!canRight} style={[hs.arrowBtn, !canRight && hs.arrowDisabled]}>
          <Text style={hs.arrowTxt}>▶</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const hs = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  arrowBtn: { width: 30, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#1a0000", borderWidth: 1, borderColor: "#550000" },
  arrowDisabled: { opacity: 0.3 },
  arrowTxt: { color: "#ffb300", fontSize: 16, fontWeight: "900" },
});