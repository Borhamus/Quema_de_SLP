import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

// ── PIXEL ART ───────────────────────────────────────────────────
function PixelTrophy({ size = 96 }: { size?: number }) {
  const p = size / 10;
  const a = C.amber;
  const d = C.amberDim;
  const r = C.red;
  const k = "transparent";
  const map = [
    [k, a, a, a, a, a, a, a, a, k],
    [a, a, d, d, d, d, d, d, a, a],
    [a, d, a, a, a, a, a, a, d, a],
    [k, d, a, r, r, r, r, a, d, k],
    [k, d, a, a, r, r, a, a, d, k],
    [k, d, a, a, a, a, a, a, d, k],
    [k, k, d, a, a, a, a, d, k, k],
    [k, k, k, d, d, d, d, k, k, k],
    [k, k, a, a, a, a, a, a, k, k],
    [k, a, a, a, a, a, a, a, a, k],
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

function PixelKeyHole({ size = 60 }: { size?: number }) {
  const p = size / 6;
  const a = C.amber;
  const d = C.amberDim;
  const k = "transparent";
  const map = [
    [k, k, a, a, k, k],
    [k, a, d, d, a, k],
    [k, a, d, d, a, k],
    [k, a, d, d, a, k],
    [a, d, d, d, d, a],
    [a, a, a, a, a, a],
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

function PixelSkull({ size = 56 }: { size?: number }) {
  const p = size / 8;
  const w = C.parchment;
  const d = C.parchmentDim;
  const k = "transparent";
  const r = C.red;
  const map = [
    [k, w, w, w, w, w, w, k],
    [w, w, w, w, w, w, w, w],
    [w, r, w, w, w, w, r, w],
    [w, w, w, d, d, w, w, w],
    [w, w, w, w, w, w, w, w],
    [k, w, d, w, w, d, w, k],
    [k, k, w, d, d, w, k, k],
    [k, k, k, w, w, k, k, k],
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

function HudBar() {
  const blink = useBlink(700);
  return (
    <View style={hud.row}>
      <Text style={hud.hp}>
        HP <Text style={{ color: C.red }}>████░</Text> 1P
      </Text>
      <Animated.Text style={[hud.rec, { opacity: blink }]}>
        ● FINAL BOSS
      </Animated.Text>
      <Text style={hud.hi}>STAGE ∞</Text>
    </View>
  );
}

// ── SCREEN ──────────────────────────────────────────────────────
export default function SpecialScreen() {
  const blink = useBlink(900);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <HudBar />

        {/* Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.coin}>◆ ANNUAL CHAMPIONSHIP ◆</Text>
          <Text style={styles.title}>GRAN</Text>
          <Text style={styles.titleAccent}>EVENTO ANUAL</Text>
          <View style={styles.underline} />
        </View>

        {/* Hero trophy panel */}
        <View style={hero.panel}>
          <View style={hero.tape}>
            <Animated.Text style={[hero.tapeTxt, { opacity: blink }]}>
              ★ LEGENDS ONLY ★
            </Animated.Text>
          </View>

          <View style={hero.body}>
            {/* Rays bg */}
            <View style={hero.rays}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    hero.ray,
                    { transform: [{ rotate: `${i * 30}deg` }] },
                  ]}
                />
              ))}
            </View>
            <PixelTrophy size={120} />
            <View style={{ flexDirection: "row", gap: 22, marginTop: 14 }}>
              <PixelSkull size={36} />
              <PixelSkull size={36} />
            </View>
          </View>

          <View style={hero.tapeBottom}>
            <Text style={hero.tapeTxtBottom}>◀ INSERT KEY TO CHALLENGE ▶</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={info.card}>
          <View style={info.head}>
            <Text style={info.headTxt}>▸ BRIEFING</Text>
          </View>
          <Text style={info.desc}>
            Solo para leyendas. Para entrar necesitás usar una{" "}
            <Text style={{ color: C.amber, fontWeight: "900" }}>
              llave anual
            </Text>{" "}
            minteada desde tu perfil.
          </Text>
        </View>

        {/* Key slot */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>KEY SLOT</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={slot.panel}>
          <View style={slot.slotInner}>
            {/* dashed border simulated via dash row */}
            <View style={slot.dashRow}>
              {Array.from({ length: 22 }).map((_, i) => (
                <View key={i} style={slot.dashTop} />
              ))}
            </View>

            <View style={slot.slotBody}>
              <PixelKeyHole size={56} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={slot.slotLabel}>INSERTAR LLAVE 2024</Text>
                <Text style={slot.slotSub}>
                  Bloqueado · Sin llave detectada
                </Text>
              </View>
              <Animated.View style={[slot.cursor, { opacity: blink }]} />
            </View>

            <View style={slot.dashRow}>
              {Array.from({ length: 22 }).map((_, i) => (
                <View key={i} style={slot.dashTop} />
              ))}
            </View>
          </View>
        </View>

        {/* Locked button */}
        <View style={{ marginTop: 16 }}>
          <TouchableOpacity disabled style={btn.btn}>
            <Text style={btn.iconTxt}>⛔</Text>
            <View style={{ flex: 1 }}>
              <Text style={btn.label}>PARTICIPAR EN SORTEO ESPECIAL</Text>
              <Text style={btn.sub}>REQUIRES ANNUAL KEY</Text>
            </View>
            <Text style={btn.arrow}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Rules / Prize teaser */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>PRIZE POOL</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={prize.panel}>
          <View style={prize.row}>
            <Text style={prize.romano}>I</Text>
            <View style={prize.divider} />
            <View style={{ flex: 1 }}>
              <Text style={prize.title}>GRAND PRIZE</Text>
              <Text style={prize.desc}>
                Pool acumulado del año · top spender
              </Text>
            </View>
          </View>
          <View style={prize.row}>
            <Text style={prize.romano}>II</Text>
            <View style={prize.divider} />
            <View style={{ flex: 1 }}>
              <Text style={prize.title}>ORIGIN AXIES</Text>
              <Text style={prize.desc}>
                3 ganadores · sorteo entre llaveros
              </Text>
            </View>
          </View>
          <View style={prize.row}>
            <Text style={prize.romano}>III</Text>
            <View style={prize.divider} />
            <View style={{ flex: 1 }}>
              <Text style={prize.title}>MYSTERY BOX</Text>
              <Text style={prize.desc}>Loot drop sorpresa para todos</Text>
            </View>
          </View>
        </View>

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
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 4,
    lineHeight: 38,
  },
  titleAccent: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 4,
    lineHeight: 38,
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

const hero = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderColor: C.amber,
    backgroundColor: C.ink,
    marginBottom: 16,
  },
  tape: { backgroundColor: C.amber, paddingVertical: 6, alignItems: "center" },
  tapeTxt: {
    color: "#000",
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: "900",
  },
  body: {
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  rays: {
    position: "absolute",
    width: 360,
    height: 360,
    alignItems: "center",
    justifyContent: "center",
  },
  ray: {
    position: "absolute",
    width: 4,
    height: 360,
    backgroundColor: "rgba(255,179,0,0.08)",
  },
  tapeBottom: {
    backgroundColor: "#1a1100",
    paddingVertical: 6,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.amberDim,
  },
  tapeTxtBottom: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
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
    lineHeight: 20,
    padding: 14,
  },
});

const slot = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderColor: C.amber,
    backgroundColor: "#0a0700",
    padding: 10,
  },
  slotInner: { backgroundColor: "#000", paddingHorizontal: 12 },
  dashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  dashTop: { width: 8, height: 2, backgroundColor: C.amberDim },
  slotBody: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  slotLabel: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  slotSub: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 11,
    marginTop: 4,
  },
  cursor: { width: 10, height: 18, backgroundColor: C.amber },
});

const btn = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.redDark,
    backgroundColor: "#1a0008",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    opacity: 0.7,
  },
  iconTxt: { color: C.red, fontFamily: MONO, fontSize: 18 },
  label: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: "900",
  },
  sub: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 2,
    fontWeight: "700",
  },
  arrow: { color: C.red, fontFamily: MONO, fontSize: 18, fontWeight: "900" },
});

const prize = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.redDark, backgroundColor: C.ink },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.redDark,
    gap: 14,
  },
  romano: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    width: 40,
    textAlign: "center",
  },
  divider: { width: 1, alignSelf: "stretch", backgroundColor: C.redDark },
  title: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  desc: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
});
