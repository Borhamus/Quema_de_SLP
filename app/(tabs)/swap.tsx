import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── ARCADE PALETTE ──────────────────────────────────────────────
const C = {
  bg: "#000",
  ink: "#0a0000",
  red: "#ff0033",
  redDim: "#7a0a1f",
  redDark: "#3a0510",
  amber: "#ffb300",
  amberDim: "#6b4a00",
  parchment: "#f6e6c2",
  parchmentDim: "#a89472",
  muted: "#5a4040",
  ok: "#00ff66",
};

const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

function useBlink(period = 900) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 0.2,
          duration: period / 2,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 1,
          duration: period / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [period, v]);
  return v;
}

function usePulse(period = 2200) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: period / 2,
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: period / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [period, v]);
  return v;
}

// ── PIXEL LOCK ──────────────────────────────────────────────────
function PixelPadlock({ size = 96 }: { size?: number }) {
  const p = size / 10;
  const r = C.red;
  const d = C.redDark;
  const a = C.amber;
  const k = "transparent";
  const map = [
    [k, k, k, r, r, r, r, k, k, k],
    [k, k, r, d, d, d, d, r, k, k],
    [k, r, d, k, k, k, k, d, r, k],
    [k, r, d, k, k, k, k, d, r, k],
    [r, r, r, r, r, r, r, r, r, r],
    [r, d, d, d, d, d, d, d, d, r],
    [r, d, d, a, a, a, a, d, d, r],
    [r, d, d, a, k, k, a, d, d, r],
    [r, d, d, d, a, a, d, d, d, r],
    [r, r, r, r, r, r, r, r, r, r],
  ];
  return (
    <View style={{ width: size, height: size }}>
      {map.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.map((c, x) => (
            <View key={x} style={{ width: p, height: p, backgroundColor: c }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// Pixel black hole / portal swirl using concentric rings
function PixelBlackHole({ size = 110 }: { size?: number }) {
  const rings = [
    { d: 0, c: "#000" },
    { d: 2, c: C.redDark },
    { d: 4, c: C.redDim },
    { d: 6, c: C.red },
    { d: 8, c: C.amber },
  ];
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {rings.map((r, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: size - r.d * (size / 12),
            height: size - r.d * (size / 12),
            backgroundColor: r.c,
            borderWidth: 2,
            borderColor: i === rings.length - 1 ? C.parchment : "#000",
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          width: size * 0.18,
          height: size * 0.18,
          backgroundColor: "#000",
        }}
      />
    </View>
  );
}

function HudBar() {
  const blink = useBlink(700);
  return (
    <View style={hud.row}>
      <Text style={hud.hp}>
        HP <Text style={{ color: C.red }}>████░</Text> 1P
      </Text>
      <Animated.Text style={[hud.rec, { opacity: blink }]}>
        ● SWAP ROOM
      </Animated.Text>
      <Text style={hud.hi}>CH-02</Text>
    </View>
  );
}

// ── SCREEN ──────────────────────────────────────────────────────
export default function SwapScreen() {
  const isSwapOpen = false; // Cambia a true para ver la interfaz de swap
  const blink = useBlink(1100);
  const pulse = usePulse(2200);
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.9],
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <HudBar />

        {!isSwapOpen ? (
          // ── CURTAIN CLOSED ─────────────────────────────────────
          <>
            <View style={styles.titleWrap}>
              <Text style={styles.coin}>◆ NIGHT MODE ◆</Text>
              <Text style={styles.titleAccent}>CORTINA</Text>
              <Text style={styles.title}>CERRADA</Text>
              <View style={styles.underline} />
            </View>

            <View style={curtain.panel}>
              {/* Top tape */}
              <View style={curtain.tape}>
                <Animated.Text style={[curtain.tapeTxt, { opacity: blink }]}>
                  ⚠ DO NOT ENTER ⚠
                </Animated.Text>
              </View>

              {/* Padlock + diagonal stripes */}
              <View style={curtain.body}>
                <View style={curtain.stripes}>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        curtain.stripe,
                        { backgroundColor: i % 2 === 0 ? "#1a0008" : "#000" },
                      ]}
                    />
                  ))}
                </View>
                <Animated.View
                  style={[curtain.lockGlow, { opacity: pulseOpacity }]}
                />
                <PixelPadlock size={104} />
              </View>

              {/* Bottom tape */}
              <View style={curtain.tape}>
                <Text style={curtain.tapeTxt2}>◀ ROOM SEALED ▶</Text>
              </View>
            </View>

            {/* Description card */}
            <View style={info.card}>
              <View style={info.head}>
                <Text style={info.headTxt}>▸ EVENT SCHEDULE</Text>
              </View>
              <Text style={info.desc}>
                El intercambio de Axies se habilitará automáticamente al
                finalizar la fase de venta de tickets.
              </Text>

              {/* Countdown placeholder */}
              <View style={info.timerRow}>
                <View style={info.timerBox}>
                  <Text style={info.timerNum}>72</Text>
                  <Text style={info.timerLbl}>HRS</Text>
                </View>
                <Animated.Text style={[info.colon, { opacity: blink }]}>
                  :
                </Animated.Text>
                <View style={info.timerBox}>
                  <Text style={info.timerNum}>00</Text>
                  <Text style={info.timerLbl}>MIN</Text>
                </View>
                <Animated.Text style={[info.colon, { opacity: blink }]}>
                  :
                </Animated.Text>
                <View style={info.timerBox}>
                  <Text style={info.timerNum}>00</Text>
                  <Text style={info.timerLbl}>SEC</Text>
                </View>
              </View>

              <View style={info.footerTape}>
                <Text style={info.footerTxt}>★ AUTO-UNLOCK ON PHASE END ★</Text>
              </View>
            </View>
          </>
        ) : (
          // ── SWAP OPEN ──────────────────────────────────────────
          <>
            <View style={styles.titleWrap}>
              <Text style={styles.coin}>◆ EVENT FINAL ◆</Text>
              <Text style={styles.title}>AGUJERO</Text>
              <Text style={styles.titleAccent}>NEGRO</Text>
              <View style={styles.underline} />
            </View>

            <View style={openS.pool}>
              <View style={openS.poolHead}>
                <Text style={openS.poolHeadTxt}>▸ SWAP POOL</Text>
                <View style={openS.dotGreen} />
              </View>
              <View style={{ alignItems: "center", paddingVertical: 18 }}>
                <PixelBlackHole size={110} />
              </View>
              <View style={openS.poolBody}>
                <Text style={openS.poolLabel}>DINERO DISPONIBLE</Text>
                <Text style={openS.poolValue}>$1,250.00</Text>
                <Text style={openS.poolUnit}>USD ★ READY TO SWAP</Text>
              </View>
            </View>

            <View style={floor.panel}>
              <View style={floor.row}>
                <Text style={floor.label}>FLOOR PRICE</Text>
                <Text style={floor.value}>0.0015 ETH</Text>
              </View>
              <View style={floor.bar} />
              <Text style={floor.note}>▸ AUTO-PRICED FROM RONIN MARKET</Text>
            </View>

            <View style={styles.sectionHead}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>TUS AXIES</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={list.empty}>
              <Text style={list.emptyTitle}>▣ INVENTORY EMPTY</Text>
              <Text style={list.emptySub}>
                Conectá tu wallet para listar tus Axies
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingTop: 8, paddingBottom: 60 },
  titleWrap: { alignItems: "center", marginTop: 8, marginBottom: 18 },
  coin: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 6,
  },
  title: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 4,
    lineHeight: 42,
  },
  titleAccent: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 4,
    lineHeight: 42,
    textShadowColor: "rgba(255,0,51,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  underline: { width: 80, height: 3, backgroundColor: C.red, marginTop: 10 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
    gap: 8,
  },
  sectionDot: { width: 8, height: 8, backgroundColor: C.red },
  sectionTitle: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.redDark },
});

const hud = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.redDark,
    marginBottom: 4,
  },
  hp: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  rec: { color: C.red, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5 },
  hi: { color: C.amber, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
});

const curtain = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderColor: C.red,
    backgroundColor: C.ink,
    marginBottom: 18,
  },
  tape: { backgroundColor: C.red, paddingVertical: 6, alignItems: "center" },
  tapeTxt: {
    color: "#fff",
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: "900",
  },
  tapeTxt2: {
    color: "#fff",
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "900",
  },
  body: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  stripes: { ...StyleSheet.absoluteFillObject, flexDirection: "column" },
  stripe: { flex: 1 },
  lockGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    backgroundColor: "rgba(255,0,51,0.18)",
  },
});

const info = StyleSheet.create({
  card: { borderWidth: 2, borderColor: C.redDark, backgroundColor: C.ink },
  head: {
    backgroundColor: "#1a0008",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headTxt: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },
  desc: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 12,
    lineHeight: 18,
    padding: 14,
    paddingBottom: 6,
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    paddingTop: 8,
    gap: 4,
  },
  timerBox: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.amberDim,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 70,
  },
  timerNum: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
    lineHeight: 34,
  },
  timerLbl: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 2,
  },
  colon: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 32,
    fontWeight: "900",
    paddingHorizontal: 2,
  },
  footerTape: {
    backgroundColor: "#1a0008",
    paddingVertical: 6,
    alignItems: "center",
  },
  footerTxt: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: "700",
  },
});

const openS = StyleSheet.create({
  pool: {
    borderWidth: 2,
    borderColor: C.amber,
    backgroundColor: C.ink,
    marginBottom: 14,
  },
  poolHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1100",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.amberDim,
  },
  poolHeadTxt: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },
  dotGreen: { width: 8, height: 8, backgroundColor: C.ok },
  poolBody: { alignItems: "center", paddingBottom: 18 },
  poolLabel: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
  },
  poolValue: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 4,
    textShadowColor: "rgba(255,179,0,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  poolUnit: {
    color: C.ok,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 4,
    fontWeight: "700",
  },
});

const floor = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderColor: C.redDark,
    backgroundColor: C.ink,
    padding: 14,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
  },
  value: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bar: { height: 2, backgroundColor: C.red, marginVertical: 10, opacity: 0.5 },
  note: { color: C.red, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5 },
});

const list = StyleSheet.create({
  empty: {
    borderWidth: 1,
    borderColor: C.redDark,
    backgroundColor: "#0a0000",
    padding: 30,
    alignItems: "center",
  },
  emptyTitle: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 3,
    fontWeight: "900",
  },
  emptySub: {
    color: C.muted,
    fontFamily: MONO,
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 1,
  },
});
