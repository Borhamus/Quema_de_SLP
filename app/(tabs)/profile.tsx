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

// ── HOOK ────────────────────────────────────────────────────────
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
function PixelWallet({ size = 60 }: { size?: number }) {
  const p = size / 10;
  const r = C.red;
  const d = C.redDark;
  const a = C.amber;
  const k = "transparent";
  const map = [
    [k, k, r, r, r, r, r, r, k, k],
    [k, r, d, d, d, d, d, d, r, k],
    [r, d, d, d, d, d, d, d, d, r],
    [r, d, a, a, k, k, a, a, d, r],
    [r, d, a, k, k, k, k, a, d, r],
    [r, d, a, a, k, k, a, a, d, r],
    [r, d, d, d, d, d, d, d, d, r],
    [r, d, d, r, r, r, r, d, d, r],
    [k, r, r, r, k, k, r, r, r, k],
    [k, k, k, k, k, k, k, k, k, k],
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

function PixelTicket({ size = 56 }: { size?: number }) {
  const p = size / 8;
  const a = C.amber;
  const d = C.amberDim;
  const k = "transparent";
  const map = [
    [k, a, a, a, a, a, a, k],
    [a, d, d, d, d, d, d, a],
    [a, d, a, a, a, a, d, a],
    [k, d, a, k, k, a, d, k],
    [k, d, a, k, k, a, d, k],
    [a, d, a, a, a, a, d, a],
    [a, d, d, d, d, d, d, a],
    [k, a, a, a, a, a, a, k],
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

function PixelKey({ size = 28 }: { size?: number }) {
  const p = size / 8;
  const a = C.amber;
  const d = C.amberDim;
  const k = "transparent";
  const map = [
    [k, k, a, a, k, k, k, k],
    [k, a, d, d, a, k, k, k],
    [k, a, d, d, a, k, k, k],
    [k, k, a, a, a, a, a, a],
    [k, k, k, k, a, k, k, a],
    [k, k, k, k, a, k, a, k],
    [k, k, k, k, a, k, k, a],
    [k, k, k, k, a, a, a, a],
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

function PixelBag({ size = 64 }: { size?: number }) {
  const p = size / 8;
  const r = C.redDim;
  const d = C.redDark;
  const k = "transparent";
  const map = [
    [k, k, r, k, k, r, k, k],
    [k, k, r, k, k, r, k, k],
    [k, r, r, r, r, r, r, k],
    [r, d, r, d, d, r, d, r],
    [r, d, d, d, d, d, d, r],
    [r, d, d, r, r, d, d, r],
    [r, d, d, d, d, d, d, r],
    [k, r, r, r, r, r, r, k],
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

// ── COMPONENTS ──────────────────────────────────────────────────
function HudBar() {
  const blink = useBlink(700);
  return (
    <View style={hud.row}>
      <Text style={hud.hp}>
        HP <Text style={{ color: C.red }}>████░</Text> 1P
      </Text>
      <Animated.Text style={[hud.rec, { opacity: blink }]}>
        ● PLAYER LOG
      </Animated.Text>
      <Text style={hud.hi}>SLOT 01</Text>
    </View>
  );
}

function ArcadeButton({
  label,
  sub,
  onPress,
  color = "red",
  disabled = false,
  icon,
}: {
  label: string;
  sub?: string;
  onPress?: () => void;
  color?: "red" | "amber" | "dark";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const palette = {
    red: { bg: C.red, border: "#fff", text: "#fff" },
    amber: { bg: C.amber, border: "#000", text: "#000" },
    dark: { bg: "#1a0008", border: C.redDark, text: C.parchmentDim },
  }[color];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        btn.btn,
        { backgroundColor: palette.bg, borderColor: palette.border },
        disabled && { opacity: 0.5 },
      ]}
    >
      {icon && <View style={btn.icon}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={[btn.label, { color: palette.text }]}>{label}</Text>
        {sub && <Text style={[btn.sub, { color: palette.text }]}>{sub}</Text>}
      </View>
      <Text style={[btn.arrow, { color: palette.text }]}>▸</Text>
    </TouchableOpacity>
  );
}

function EmptySlot() {
  return (
    <View style={empty.slot}>
      <Text style={empty.dash}>━ ━ ━</Text>
    </View>
  );
}

// ── SCREEN ──────────────────────────────────────────────────────
export default function ProfileScreen() {
  const eventoActivo = true;
  const tickets: any[] = [];
  const ticketsCount = 0;
  const yearProgress = 0;
  const yearGoal = 12;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HudBar />

        {/* Player card header */}
        <View style={card.playerWrap}>
          <View style={card.idStrip}>
            <Text style={card.idStripTxt}>★ PLAYER 1 ★</Text>
            <Text style={card.idStripCode}>ID :: GUEST-00</Text>
          </View>

          <View style={card.playerBody}>
            <View style={card.avatar}>
              <PixelWallet size={64} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={card.playerName}>NO CONECTADO</Text>
              <Text style={card.playerSub}>Conectá tu Ronin para empezar</Text>
              <View style={card.statusRow}>
                <View style={[card.statusDot, { backgroundColor: C.redDim }]} />
                <Text style={card.statusTxt}>OFFLINE</Text>
              </View>
            </View>
          </View>

          <View style={card.connectWrap}>
            <ArcadeButton
              label="INSERT WALLET"
              sub="Conectar Ronin"
              color="red"
              icon={<Text style={btn.iconTxt}>◈</Text>}
            />
          </View>
        </View>

        {/* Tickets HUD */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>MIS TICKETS DEL MES</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={tk.panel}>
          <View style={tk.tape}>
            <Text style={tk.tapeTxt}>▸ COIN COUNTER</Text>
            <Text style={tk.tapeMonth}>NOV / 2024</Text>
          </View>
          <View style={tk.body}>
            <View style={tk.counterCol}>
              <Text style={tk.bigNum}>
                {String(ticketsCount).padStart(2, "0")}
              </Text>
              <Text style={tk.bigLabel}>TICKETS</Text>
            </View>
            <View style={tk.divider} />
            <View style={{ flex: 1 }}>
              <Text style={tk.miniLabel}>LLAVE ANUAL // PROGRESS</Text>
              <View style={tk.progressRow}>
                {Array.from({ length: yearGoal }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      tk.progressSeg,
                      i < yearProgress
                        ? { backgroundColor: C.amber }
                        : { backgroundColor: "#1a0a0a" },
                    ]}
                  />
                ))}
              </View>
              <Text style={tk.progressTxt}>
                <Text style={{ color: C.amber }}>{yearProgress}</Text>
                <Text style={{ color: C.parchmentDim }}>/{yearGoal} MESES</Text>
              </Text>
            </View>
          </View>

          {eventoActivo && (
            <View style={tk.buyWrap}>
              <ArcadeButton
                label="COMPRAR TICKET"
                sub="3 USD en SLP · podés comprar más de uno"
                color="amber"
                icon={<PixelTicket size={28} />}
              />
            </View>
          )}
        </View>

        {/* Bag */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>TU BOLSA // INVENTORY</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionCount}>
            {String(tickets.length).padStart(2, "0")}/06
          </Text>
        </View>

        <View style={bag.panel}>
          <View style={bag.grid}>
            {tickets.length === 0 ? (
              <>
                {/* 6 empty slots in 3x2 grid */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <EmptySlot key={i} />
                ))}
              </>
            ) : (
              tickets.map((_, i) => <EmptySlot key={i} />)
            )}
          </View>
          {tickets.length === 0 && (
            <View style={bag.emptyMsg}>
              <PixelBag size={48} />
              <Text style={bag.emptyTxt}>BOLSA VACÍA</Text>
              <Text style={bag.emptySub}>Tus tickets aparecerán acá</Text>
            </View>
          )}
        </View>

        {/* Mint key */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>LLAVE ANUAL</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={mint.panel}>
          <View style={mint.row}>
            <PixelKey size={36} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={mint.title}>MINTEAR LLAVE 2024</Text>
              <Text style={mint.sub}>
                Necesitás 12/12 tickets para forjar tu llave anual
              </Text>
            </View>
          </View>
          <View style={mint.lock}>
            <Text style={mint.lockTxt}>
              ⚠ REQUIRES {yearGoal}/{yearGoal} MESES
            </Text>
          </View>
          <View style={{ marginTop: 10 }}>
            <ArcadeButton
              label="MINTEAR LLAVE"
              sub="Bloqueado"
              color="dark"
              disabled
            />
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
    marginBottom: 12,
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

const card = StyleSheet.create({
  playerWrap: { borderWidth: 2, borderColor: C.red, backgroundColor: C.ink },
  idStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.red,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  idStripTxt: {
    color: "#fff",
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "900",
  },
  idStripCode: {
    color: "#fff",
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  playerBody: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    borderWidth: 2,
    borderColor: C.redDark,
    padding: 6,
    backgroundColor: "#000",
  },
  playerName: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  playerSub: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 11,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusDot: { width: 8, height: 8 },
  statusTxt: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  connectWrap: { padding: 12, paddingTop: 0 },
});

const btn = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  icon: { width: 32, alignItems: "center" },
  iconTxt: { color: "#fff", fontFamily: MONO, fontSize: 20, fontWeight: "900" },
  label: {
    fontFamily: MONO,
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: "900",
  },
  sub: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
    opacity: 0.85,
  },
  arrow: { fontFamily: MONO, fontSize: 18, fontWeight: "900" },
});

const tk = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.amber, backgroundColor: C.ink },
  tape: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1a1100",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.amberDim,
  },
  tapeTxt: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },
  tapeMonth: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
  },
  body: { flexDirection: "row", padding: 16, gap: 14, alignItems: "center" },
  counterCol: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  bigNum: {
    color: C.amber,
    fontFamily: MONO,
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 60,
    letterSpacing: -2,
    textShadowColor: "rgba(255,179,0,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bigLabel: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 2,
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: C.redDark,
    marginHorizontal: 4,
  },
  miniLabel: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
  },
  progressRow: { flexDirection: "row", gap: 3 },
  progressSeg: { flex: 1, height: 16, borderWidth: 1, borderColor: C.redDark },
  progressTxt: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 1.5,
    marginTop: 8,
    fontWeight: "700",
  },
  buyWrap: { padding: 12, paddingTop: 0 },
});

const bag = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderColor: C.redDark,
    backgroundColor: C.ink,
    padding: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  emptyMsg: {
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.redDark,
  },
  emptyTxt: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 3,
    fontWeight: "900",
    marginTop: 10,
  },
  emptySub: {
    color: C.muted,
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 4,
  },
});

const empty = StyleSheet.create({
  slot: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: C.redDark,
    justifyContent: "center",
    alignItems: "center",
  },
  dash: { color: C.muted, fontFamily: MONO, fontSize: 12, letterSpacing: 2 },
});

const mint = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderColor: C.redDark,
    backgroundColor: C.ink,
    padding: 14,
  },
  row: { flexDirection: "row", alignItems: "center" },
  title: {
    color: C.parchment,
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  sub: {
    color: C.parchmentDim,
    fontFamily: MONO,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  lock: {
    marginTop: 12,
    backgroundColor: "#1a0008",
    borderLeftWidth: 3,
    borderLeftColor: C.red,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  lockTxt: {
    color: C.red,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },
});
