import React, { useEffect, useRef, useState } from "react";
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

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

function useBlink(period = 900) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.2, duration: period / 2, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: period / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [period, v]);
  return v;
}

// Cycle frame index every `ms`
function useFireFrame(ms = 140, frames = 4) {
  const [f, setF] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setF((x) => (x + 1) % frames), ms);
    return () => clearInterval(id);
  }, [ms, frames]);
  return f;
}

function useFloat(duration = 2400, range = 4) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, v]);
  return v.interpolate({ inputRange: [0, 1], outputRange: [-range, range] });
}

function usePulse(period = 1800) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: period / 2, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: period / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [period, v]);
  return v;
}

// ── PIXEL FIRE ──────────────────────────────────────────────────
const FIRE_PALETTE: Record<string, string> = {
  ".": "transparent",
  W: "#fff5cc",
  Y: "#ffd84a",
  O: "#ff7a1a",
  R: "#ff0033",
  D: "#7a0a1f",
};

const FIRE_FRAMES: string[][] = [
  [
    "...Y....",
    "..YOY...",
    ".YOWOY..",
    ".OWWWOY.",
    "YOWWWWOY",
    "OWWRWWOO",
    "ROWRRWOR",
    "RROORROR",
    ".DRRRRD.",
  ],
  [
    "....Y...",
    "...YOY..",
    "..YOWO..",
    ".YOWWOY.",
    ".OWWWWOY",
    "YOWRWWOO",
    "OORRWWOR",
    "RROORROR",
    ".DRRRRD.",
  ],
  [
    "...Y....",
    "..YOY...",
    ".YOWOY..",
    "YOWWWOY.",
    "OWWWWWO.",
    "OWWRWWOY",
    "RORRWWOR",
    "RORRRROR",
    ".DRRRRD.",
  ],
  [
    "..Y..Y..",
    ".YOY.OY.",
    "YOWOYOOY",
    "OWWWOWWO",
    "OWWRWWOO",
    "ROWRWWOR",
    "RROORROR",
    "RRRRRRRR",
    ".DDRRDD.",
  ],
];

function PixelFire({ size = 90, frame }: { size?: number; frame: number }) {
  const rows = FIRE_FRAMES[frame % FIRE_FRAMES.length];
  const cols = rows[0].length;
  const p = size / cols;
  return (
    <View style={{ width: size, height: p * rows.length }}>
      {rows.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.split("").map((c, x) => (
            <View key={x} style={{ width: p, height: p, backgroundColor: FIRE_PALETTE[c] }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// Stone altar pedestal
function PixelAltar({ width = 160 }: { width?: number }) {
  const stone = "#3a2a28";
  const stoneL = "#5a3e3a";
  const stoneD = "#1d1414";
  const block = (w: number, h: number, c: string, ml = 0) => (
    <View style={{ width: w, height: h, backgroundColor: c, marginLeft: ml }} />
  );
  return (
    <View style={{ alignItems: "center" }}>
      {/* top slab */}
      <View style={{ flexDirection: "row" }}>
        {block(width, 6, stoneL)}
      </View>
      <View style={{ flexDirection: "row" }}>
        {block(width, 4, stone)}
      </View>
      {/* middle column */}
      <View style={{ flexDirection: "row", marginTop: 2 }}>
        {block(width * 0.62, 14, stoneD)}
      </View>
      <View style={{ flexDirection: "row" }}>
        {block(width * 0.62, 14, stone)}
      </View>
      {/* base */}
      <View style={{ flexDirection: "row", marginTop: 2 }}>
        {block(width * 1.08, 8, stone)}
      </View>
      <View style={{ flexDirection: "row" }}>
        {block(width * 1.08, 6, stoneD)}
      </View>
    </View>
  );
}

// Cave stalactites along the top
function PixelStalactites({ count = 9 }: { count?: number }) {
  // Each stalactite: pyramid of rows narrowing downward
  const stoneL = "#2a1a18";
  const stoneD = "#0a0404";
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start" }}>
      {Array.from({ length: count }).map((_, i) => {
        const h = 4 + ((i * 7) % 5); // 4..8 rows tall
        const w = 14;
        return (
          <View key={i} style={{ alignItems: "center" }}>
            {Array.from({ length: h }).map((_, r) => {
              const rowW = Math.max(2, w - r * 3);
              return (
                <View
                  key={r}
                  style={{
                    width: rowW,
                    height: 4,
                    backgroundColor: r === 0 ? stoneL : stoneD,
                  }}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

// Animated rising ember particle
function Ember({ x, delay, dur, color }: { x: number; delay: number; dur: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, dur, v]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -140] });
  const translateX = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 6, -4] });
  const opacity = v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 0.6, 0] });
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        bottom: 36,
        width: 3,
        height: 3,
        backgroundColor: color,
        transform: [{ translateY }, { translateX }],
        opacity,
      }}
    />
  );
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
      <Animated.Text style={[hud.rec, { opacity: blink }]}>● FINAL BOSS</Animated.Text>
      <Text style={hud.hi}>STAGE ∞</Text>
    </View>
  );
}

// ── SCREEN ──────────────────────────────────────────────────────
export default function SpecialScreen() {
  const blink = useBlink(900);
  const fireFrame = useFireFrame(140, FIRE_FRAMES.length);
  const trophyFloat = useFloat(2400, 4);
  const glow = usePulse(1800);
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
            <Animated.Text style={[hero.tapeTxt, { opacity: blink }]}>★ LEGENDS ONLY ★</Animated.Text>
          </View>

          <View style={hero.body}>
            {/* Cave background layers */}
            <View style={hero.caveBg} />
            <View style={hero.caveBg2} />

            {/* Stalactites along top */}
            <View style={hero.stalacWrap}>
              <PixelStalactites count={11} />
            </View>

            {/* Fire glow (pulsing) */}
            <Animated.View style={[hero.glow, { opacity: glowOpacity }]} />
            <Animated.View style={[hero.glowInner, { opacity: glowOpacity }]} />

            {/* Rising embers */}
            <Ember x={70} delay={0} dur={2400} color="#ffb300" />
            <Ember x={100} delay={400} dur={2800} color="#ff7a1a" />
            <Ember x={130} delay={900} dur={2200} color="#ffd84a" />
            <Ember x={160} delay={200} dur={3000} color="#ff0033" />
            <Ember x={190} delay={1200} dur={2600} color="#ff7a1a" />
            <Ember x={220} delay={700} dur={2400} color="#ffb300" />
            <Ember x={250} delay={1500} dur={2900} color="#ffd84a" />

            {/* Floating trophy (the prize) above the fire */}
            <Animated.View style={[hero.trophyWrap, { transform: [{ translateY: trophyFloat }] }]}>
              <PixelTrophy size={72} />
            </Animated.View>

            {/* The fire itself (animated sprite) */}
            <View style={hero.fireWrap}>
              <PixelFire size={88} frame={fireFrame} />
            </View>

            {/* Stone altar pedestal */}
            <View style={hero.altarWrap}>
              <PixelAltar width={150} />
            </View>

            {/* Skull sentinels */}
            <View style={hero.skullL}>
              <PixelSkull size={28} />
            </View>
            <View style={hero.skullR}>
              <PixelSkull size={28} />
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
            <Text style={{ color: C.amber, fontWeight: "900" }}>llave anual</Text> minteada desde tu perfil.
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
                <Text style={slot.slotSub}>Bloqueado · Sin llave detectada</Text>
              </View>
              <Animated.View
                style={[
                  slot.cursor,
                  { opacity: blink },
                ]}
              />
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
              <Text style={prize.desc}>Pool acumulado del año · top spender</Text>
            </View>
          </View>
          <View style={prize.row}>
            <Text style={prize.romano}>II</Text>
            <View style={prize.divider} />
            <View style={{ flex: 1 }}>
              <Text style={prize.title}>ORIGIN AXIES</Text>
              <Text style={prize.desc}>3 ganadores · sorteo entre llaveros</Text>
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
  coin: { color: C.amber, fontFamily: MONO, fontSize: 11, letterSpacing: 3, marginBottom: 6 },
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
  sectionTitle: { color: C.parchment, fontFamily: MONO, fontSize: 12, letterSpacing: 2, fontWeight: "700" },
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
  hp: { color: C.parchment, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
  rec: { color: C.red, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5 },
  hi: { color: C.amber, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
});

const hero = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.amber, backgroundColor: C.ink, marginBottom: 16 },
  tape: { backgroundColor: C.amber, paddingVertical: 6, alignItems: "center" },
  tapeTxt: { color: "#000", fontFamily: MONO, fontSize: 12, letterSpacing: 4, fontWeight: "900" },
  body: {
    height: 280,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0a0404",
  },
  caveBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a0404",
  },
  caveBg2: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: "#160808",
  },
  stalacWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  glow: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,120,30,0.28)",
  },
  glowInner: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,200,80,0.45)",
  },
  trophyWrap: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
  },
  fireWrap: {
    position: "absolute",
    bottom: 58,
    alignSelf: "center",
  },
  altarWrap: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
  },
  skullL: { position: "absolute", bottom: 14, left: 26 },
  skullR: { position: "absolute", bottom: 14, right: 26 },
  rays: { width: 0, height: 0 },
  ray: { width: 0, height: 0 },
  tapeBottom: { backgroundColor: "#1a1100", paddingVertical: 6, alignItems: "center", borderTopWidth: 1, borderTopColor: C.amberDim },
  tapeTxtBottom: { color: C.amber, fontFamily: MONO, fontSize: 10, letterSpacing: 3, fontWeight: "700" },
});

const info = StyleSheet.create({
  card: { borderWidth: 2, borderColor: C.redDark, backgroundColor: C.ink },
  head: { backgroundColor: "#1a0008", paddingHorizontal: 12, paddingVertical: 6 },
  headTxt: { color: C.red, fontFamily: MONO, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  desc: { color: C.parchmentDim, fontFamily: MONO, fontSize: 12, lineHeight: 20, padding: 14 },
});

const slot = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.amber, backgroundColor: "#0a0700", padding: 10 },
  slotInner: { backgroundColor: "#000", paddingHorizontal: 12 },
  dashRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  dashTop: { width: 8, height: 2, backgroundColor: C.amberDim },
  slotBody: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  slotLabel: { color: C.amber, fontFamily: MONO, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  slotSub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 11, marginTop: 4 },
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
  label: { color: C.parchmentDim, fontFamily: MONO, fontSize: 13, letterSpacing: 2, fontWeight: "900" },
  sub: { color: C.red, fontFamily: MONO, fontSize: 9, letterSpacing: 2, marginTop: 2, fontWeight: "700" },
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
  title: { color: C.parchment, fontFamily: MONO, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  desc: { color: C.parchmentDim, fontFamily: MONO, fontSize: 11, marginTop: 4, lineHeight: 16 },
});
