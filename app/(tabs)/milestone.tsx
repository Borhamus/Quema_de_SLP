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
  border: "#2a0a10",
  ok: "#00ff66",
};

const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

// ── DATA (intacta) ──────────────────────────────────────────────
const GOAL_TOTAL = 500;
const CURRENT_TOTAL = 135;

const milestonesData = [
  {
    id: 1,
    amount: 50,
    title: "Milestone 1: Reclutamiento",
    status: "completed",
    bought: "Axie #1234 (Pekin)",
    txHash: "0x8a...4b2",
  },
  {
    id: 2,
    amount: 100,
    title: "Milestone 2: Equipamiento",
    status: "completed",
    bought: "Item: Espada Legendaria",
    txHash: "0x7c...9a1",
  },
  {
    id: 3,
    amount: 200,
    title: "Milestone 3: Expansión",
    status: "pending",
    bought: null,
    txHash: null,
  },
  {
    id: 4,
    amount: 500,
    title: "Milestone Final: Gran Premio",
    status: "pending",
    bought: null,
    txHash: null,
  },
];

// ── HOOKS ───────────────────────────────────────────────────────
function useBlink(period = 900) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 0.25,
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

// ── COMPONENTS ──────────────────────────────────────────────────
function HudBar() {
  const blink = useBlink(700);
  return (
    <View style={hud.row}>
      <Text style={hud.hp}>
        HP <Text style={{ color: C.red }}>████░</Text> 1P
      </Text>
      <Animated.Text style={[hud.rec, { opacity: blink }]}>
        ● LIVE GOAL
      </Animated.Text>
      <Text style={hud.hi}>HISC {GOAL_TOTAL.toString().padStart(6, "0")}</Text>
    </View>
  );
}

function PowerMeter({ value, total }: { value: number; total: number }) {
  const segs = 28;
  const filled = Math.round((value / total) * segs);
  return (
    <View style={pm.wrap}>
      <View style={pm.frame}>
        {Array.from({ length: segs }).map((_, i) => {
          const on = i < filled;
          const isHot = on && i >= segs - 5;
          return (
            <View
              key={i}
              style={[
                pm.seg,
                on && { backgroundColor: isHot ? C.red : C.amber },
                !on && { backgroundColor: "#1a0a0a" },
              ]}
            />
          );
        })}
      </View>
      <View style={pm.labels}>
        <Text style={pm.value}>${value}</Text>
        <Text style={pm.pct}>{Math.round((value / total) * 100)}%</Text>
        <Text style={pm.goal}>${total}</Text>
      </View>
    </View>
  );
}

// Pixel coin (8x8 grid drawn with views)
function PixelCoin({ size = 32 }: { size?: number }) {
  const p = size / 8;
  const g = "#ffb300";
  const d = "#7a5200";
  const w = "#fff5cc";
  const k = "transparent";
  const map = [
    [k, k, g, g, g, g, k, k],
    [k, g, d, d, d, d, g, k],
    [g, d, w, g, g, d, d, g],
    [g, d, g, g, g, g, d, g],
    [g, d, g, g, g, g, d, g],
    [g, d, w, g, g, d, d, g],
    [k, g, d, d, d, d, g, k],
    [k, k, g, g, g, g, k, k],
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

// Pixel lock for locked milestones
function PixelLock({ size = 28 }: { size?: number }) {
  const p = size / 8;
  const r = C.redDim;
  const d = "#3a0510";
  const k = "transparent";
  const map = [
    [k, k, r, r, r, r, k, k],
    [k, r, d, k, k, d, r, k],
    [k, r, d, k, k, d, r, k],
    [r, r, r, r, r, r, r, r],
    [r, d, d, d, d, d, d, r],
    [r, d, d, r, r, d, d, r],
    [r, d, d, d, d, d, d, r],
    [r, r, r, r, r, r, r, r],
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

function MilestoneCard({ item, index }: { item: any; index: number }) {
  const done = item.status === "completed";
  return (
    <View style={[mc.card, done ? mc.cardDone : mc.cardLocked]}>
      {/* Tape header */}
      <View style={[mc.tape, done ? mc.tapeDone : mc.tapeLocked]}>
        <Text style={mc.tapeIdx}>
          STAGE {String(index + 1).padStart(2, "0")}
        </Text>
        <Text style={[mc.tapeStatus, { color: done ? C.ok : C.parchmentDim }]}>
          {done ? "▸ CLEARED" : "▸ LOCKED"}
        </Text>
      </View>

      <View style={mc.body}>
        <View style={mc.left}>
          {done ? <PixelCoin size={36} /> : <PixelLock size={32} />}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={mc.amount}>
            META{" "}
            <Text style={{ color: done ? C.amber : C.parchmentDim }}>
              ${item.amount}
            </Text>
          </Text>
          <Text style={mc.title}>
            {item.title.replace(/^Milestone[^:]*:\s*/i, "")}
          </Text>

          {done && (
            <View style={mc.reward}>
              <Text style={mc.rewardLabel}>▣ DROP OBTENIDO</Text>
              <Text style={mc.assetName}>{item.bought}</Text>
              <Text style={mc.tx}>TX :: {item.txHash}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function ConnectorDots() {
  return (
    <View style={{ alignItems: "center", marginVertical: 4 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{ width: 4, height: 4, backgroundColor: C.redDim }}
          />
        ))}
      </View>
    </View>
  );
}

// ── SCREEN ──────────────────────────────────────────────────────
export default function MilestoneScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HudBar />

        {/* Title block */}
        <View style={styles.titleWrap}>
          <Text style={styles.coin}>◆ COMMUNITY QUEST ◆</Text>
          <Text style={styles.title}>PROGRESO</Text>
          <Text style={styles.titleAccent}>COMUNITARIO</Text>
          <View style={styles.underline} />
        </View>

        {/* Power meter */}
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelHeadTxt}>▸ POWER METER</Text>
            <Text style={styles.panelHeadTxtDim}>FUND // POOL</Text>
          </View>
          <PowerMeter value={CURRENT_TOTAL} total={GOAL_TOTAL} />
        </View>

        {/* Stages */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>STAGES / LOGROS</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionCount}>
            {milestonesData.filter((m) => m.status === "completed").length}/
            {milestonesData.length}
          </Text>
        </View>

        {milestonesData.map((item, i) => (
          <View key={item.id}>
            <MilestoneCard item={item} index={i} />
            {i < milestonesData.length - 1 && <ConnectorDots />}
          </View>
        ))}

        {/* Treasury vault */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>TESORERÍA // VAULT</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={vault.box}>
          <View style={vault.head}>
            <Text style={vault.headTxt}>⌬ PROJECT VAULT</Text>
            <View style={vault.dotGreen} />
          </View>
          <Text style={vault.desc}>
            Todos los activos comprados por los milestones se almacenan en esta
            billetera pública en Ronin Network.
          </Text>
          <View style={vault.addrRow}>
            <View style={vault.addrChip}>
              <Text style={vault.addrLabel}>WALLET</Text>
              <Text style={vault.addr}>ronin:9f...3a2b</Text>
            </View>
            <TouchableOpacity style={vault.copyBtn} activeOpacity={0.7}>
              <Text style={vault.copyTxt}>COPY</Text>
            </TouchableOpacity>
          </View>
          <View style={vault.bottomTape}>
            <Text style={vault.bottomTxt}>
              ★ PUBLIC // VERIFIABLE ON-CHAIN ★
            </Text>
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
  scrollContent: { padding: 16, paddingTop: 8, paddingBottom: 60 },
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
  panel: {
    backgroundColor: C.ink,
    borderWidth: 2,
    borderColor: C.red,
    padding: 14,
    marginBottom: 22,
  },
  panelHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  panelHeadTxt: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },
  panelHeadTxtDim: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
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
  sectionCount: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.5,
  },
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

const pm = StyleSheet.create({
  wrap: {},
  frame: {
    flexDirection: "row",
    height: 22,
    gap: 2,
    padding: 3,
    backgroundColor: "#0a0000",
    borderWidth: 1,
    borderColor: C.redDark,
  },
  seg: { flex: 1, height: "100%" },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    alignItems: "center",
  },
  value: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  pct: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  goal: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 1,
  },
});

const mc = StyleSheet.create({
  card: {
    borderWidth: 2,
    marginBottom: 4,
    backgroundColor: C.ink,
  },
  cardDone: { borderColor: C.amber },
  cardLocked: { borderColor: C.redDark },
  tape: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tapeDone: { backgroundColor: "#2a1d00" },
  tapeLocked: { backgroundColor: "#1a0008" },
  tapeIdx: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  tapeStatus: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  body: {
    flexDirection: "row",
    padding: 14,
    gap: 14,
    alignItems: "flex-start",
  },
  left: { paddingTop: 2 },
  amount: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  reward: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#000",
    borderLeftWidth: 3,
    borderLeftColor: C.amber,
  },
  rewardLabel: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 2,
  },
  assetName: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  tx: {
    color: C.muted,
    fontFamily: MONO,
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1,
  },
});

const vault = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderColor: C.amber,
    backgroundColor: C.ink,
    padding: 0,
    marginBottom: 18,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1100",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.amberDim,
  },
  headTxt: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
  },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.ok },
  desc: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 11,
    lineHeight: 18,
    padding: 14,
    paddingBottom: 4,
  },
  addrRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
    alignItems: "stretch",
  },
  addrChip: {
    flex: 1,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.redDark,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addrLabel: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 2,
  },
  addr: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: C.red,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  copyTxt: {
    color: "#fff",
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "900",
  },
  bottomTape: {
    backgroundColor: "#1a1100",
    paddingVertical: 6,
    alignItems: "center",
  },
  bottomTxt: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 3,
  },
});
