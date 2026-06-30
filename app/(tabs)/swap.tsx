/**
 * app/(tabs)/swap.tsx — SWAP
 *
 * El telón se abre/cierra según el status REAL del evento activo
 * (status='swap'). Cuando está abierto:
 *   1. Pide login si no hay wallet conectada
 *   2. Valida que la wallet tenga al menos 1 ticket de ese evento
 *   3. Carga los Axies de la wallet (Moralis — mock por ahora)
 *   4. El "Pentagrama" — entregás un Axie, el Cirquero te da SLP
 *      (floor price), con esa estética de mercader oscuro/sombrío
 */
import { useWallet } from "@/contexts/wallet-context";
import { fmtSlp, usdToSlp, useSlpPrice } from "@/hooks/use-slp-price";
import { Axie, getAxiesForWallet } from "@/lib/axie-service";
import { supabase } from "@/lib/supabase";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
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
  purple: "#6b1f8f",
  purpleDim: "#3a1050",
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
function usePulse(period = 2200) {
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

// ── PIXEL ART (reusado del archivo original) ─────────────────────
function PixelPadlock({ size = 96 }: { size?: number }) {
  const p = size / 10; const r = C.red; const d = C.redDark; const a = C.amber; const k = "transparent";
  const map = [
    [k,k,k,r,r,r,r,k,k,k],[k,k,r,d,d,d,d,r,k,k],[k,r,d,k,k,k,k,d,r,k],[k,r,d,k,k,k,k,d,r,k],
    [r,r,r,r,r,r,r,r,r,r],[r,d,d,d,d,d,d,d,d,r],[r,d,d,a,a,a,a,d,d,r],[r,d,d,a,k,k,a,d,d,r],
    [r,d,d,d,a,a,d,d,d,r],[r,r,r,r,r,r,r,r,r,r],
  ];
  return <View style={{ width: size, height: size }}>{map.map((row, y) => <View key={y} style={{ flexDirection: "row" }}>{row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}</View>)}</View>;
}

// ── RINGMASTER (cirquero oscuro) — pixel art original ─────────────
function PixelRingmaster({ size = 100 }: { size?: number }) {
  const p = size / 12;
  const purple = C.purple, purpleD = C.purpleDim, gold = C.amber, skin = "#c89a7a", k = "transparent", black = "#0a0a0a", white = "#e8e0d0";
  const map = [
    [k,k,k,k,gold,gold,gold,gold,k,k,k,k],
    [k,k,k,gold,purple,purple,purple,gold,k,k,k,k],
    [k,k,k,purple,purpleD,purpleD,purple,purple,k,k,k,k],
    [k,k,skin,skin,skin,skin,skin,k,k,k,k,k],
    [k,k,skin,black,skin,skin,black,k,k,k,k,k],
    [k,k,k,skin,skin,skin,skin,k,k,k,k,k],
    [k,gold,purple,purple,purple,purple,purple,gold,k,k,k,k],
    [gold,purple,purpleD,purple,purple,purpleD,purple,purple,gold,k,k,k],
    [k,purple,purpleD,purple,purple,purpleD,purple,k,k,k,k,k],
    [k,k,white,k,k,k,white,k,k,k,k,k],
    [k,k,black,k,k,k,black,k,k,k,k,k],
    [k,k,black,k,k,k,black,k,k,k,k,k],
  ];
  return <View style={{ width: size, height: size * (12 / 12) }}>{map.map((row, y) => <View key={y} style={{ flexDirection: "row" }}>{row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}</View>)}</View>;
}

function PixelCoinStack({ size = 40 }: { size?: number }) {
  const p = size / 8; const a = C.amber; const d = C.amberDim; const k = "transparent";
  const map = [
    [k,k,a,a,a,a,k,k],[k,a,d,d,d,d,a,k],[a,d,a,a,a,a,d,a],
    [k,a,d,d,d,d,a,k],[k,k,a,d,d,a,k,k],[k,a,d,d,d,d,a,k],
    [a,d,a,a,a,a,d,a],[k,a,a,a,a,a,a,k],
  ];
  return <View style={{ width: size, height: size }}>{map.map((row, y) => <View key={y} style={{ flexDirection: "row" }}>{row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}</View>)}</View>;
}

function HudBar({ poolSlp }: { poolSlp: number | null }) {
  const blink = useBlink(700);
  return (
    <View style={hud.row}>
      <Text style={hud.hp}>HP <Text style={{ color: C.red }}>████░</Text> 1P</Text>
      <Animated.Text style={[hud.rec, { opacity: blink }]}>● SWAP DEALER</Animated.Text>
      <Text style={hud.hi}>{poolSlp !== null ? `${fmtSlp(poolSlp)} SLP` : "—"}</Text>
    </View>
  );
}

// ── PENTAGRAMA — el lugar de la transacción ───────────────────────
function PentagramFrame({ children }: { children: React.ReactNode }) {
  const pulse = usePulse(2400);
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <View style={pent.wrap}>
      <Animated.View style={[pent.glow, { opacity: glowOpacity }]} />
      <View style={pent.star}>
        {/* líneas del pentagrama — geometría simple con bordes rotados */}
        {[0, 72, 144, 216, 288].map((deg) => (
          <View key={deg} style={[pent.line, { transform: [{ rotate: `${deg}deg` }] }]} />
        ))}
      </View>
      <View style={pent.content}>{children}</View>
    </View>
  );
}
const pent = StyleSheet.create({
  wrap: { aspectRatio: 1, maxWidth: 280, alignSelf: "center", justifyContent: "center", alignItems: "center", marginVertical: 10 },
  glow: { position: "absolute", width: "90%", height: "90%", borderRadius: 1000, backgroundColor: "rgba(107,31,143,0.35)" },
  star: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  line: { position: "absolute", width: "85%", height: 1.5, backgroundColor: C.purple + "70" },
  content: { alignItems: "center", justifyContent: "center", padding: 20 },
  label: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, fontStyle: "italic", textAlign: "center", marginTop: 10, lineHeight: 15, maxWidth: 200 },
});

// ── AXIE CARD (selección) ─────────────────────────────────────────
function AxieCard({ axie, selected, onPress }: { axie: Axie; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[ax.card, selected && ax.cardSelected]}>
      <View style={ax.imgWrap}>
        <Image source={{ uri: axie.imageUrl }} style={ax.img} resizeMode="contain" />
      </View>
      <Text style={ax.name} numberOfLines={1}>#{axie.id}</Text>
      <Text style={ax.cls}>{axie.class.toUpperCase()}</Text>
      {selected && (
        <View style={ax.selectedBadge}><Text style={ax.selectedBadgeTxt}>✓</Text></View>
      )}
    </TouchableOpacity>
  );
}
const ax = StyleSheet.create({
  card: { width: 90, borderWidth: 1.5, borderColor: C.redDark, backgroundColor: C.ink, padding: 8, alignItems: "center", position: "relative" },
  cardSelected: { borderColor: C.purple, backgroundColor: C.purpleDim + "30" },
  imgWrap: { width: 64, height: 64, backgroundColor: "#000" },
  img: { width: "100%", height: "100%" },
  name: { color: C.parchment, fontFamily: MONO, fontSize: 9, marginTop: 6, fontWeight: "700" },
  cls: { color: C.muted, fontFamily: MONO, fontSize: 7, letterSpacing: 0.5, marginTop: 2 },
  selectedBadge: { position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.purple, alignItems: "center", justifyContent: "center" },
  selectedBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "900" },
});

// ── MODAL DE OFERTA DEL CIRQUERO ──────────────────────────────────
function RingmasterOfferModal({
  visible, axie, floorPriceSlp, floorPriceUsd, loading, result, onConfirm, onClose,
}: {
  visible: boolean; axie: Axie | null; floorPriceSlp: number; floorPriceUsd: number;
  loading: boolean; result: { ok: boolean; message: string } | null;
  onConfirm: () => void; onClose: () => void;
}) {
  if (!axie) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={rm.overlay}>
        <View style={rm.box}>
          <PixelRingmaster size={88} />
          <Text style={rm.speech}>
            "Mmh... un {axie.class.toLowerCase()}... no vale gran cosa, pero te daré unas monedas. ¿Trato hecho?"
          </Text>

          <View style={rm.axiePreview}>
            <Image source={{ uri: axie.imageUrl }} style={rm.axieImg} resizeMode="contain" />
          </View>

          <View style={rm.offerBox}>
            <Text style={rm.offerLabel}>TE OFREZCO</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <PixelCoinStack size={28} />
              <Text style={rm.offerVal}>{fmtSlp(floorPriceSlp)} SLP</Text>
            </View>
            <Text style={rm.offerUsd}>(~${floorPriceUsd.toFixed(2)} USD · floor price)</Text>
          </View>

          {result && (
            <Text style={[rm.resultTxt, { color: result.ok ? C.ok : C.red }]}>{result.message}</Text>
          )}

          {!result?.ok && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16, width: "100%" }}>
              <TouchableOpacity style={[rm.btn, rm.btnGhost]} onPress={onClose} disabled={loading}>
                <Text style={rm.btnGhostTxt}>RECHAZAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[rm.btn, rm.btnAccept]} onPress={onConfirm} disabled={loading}>
                <Text style={rm.btnAcceptTxt}>{loading ? "..." : "ACEPTAR TRATO"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {result?.ok && (
            <TouchableOpacity style={[rm.btn, rm.btnGhost, { marginTop: 16, width: "100%" }]} onPress={onClose}>
              <Text style={rm.btnGhostTxt}>CERRAR</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center", padding: 20 },
  box: { backgroundColor: C.ink, borderWidth: 2, borderColor: C.purple, padding: 20, alignItems: "center", width: "100%", maxWidth: 340 },
  speech: { color: C.parchmentDim, fontFamily: MONO, fontSize: 11, fontStyle: "italic", textAlign: "center", marginTop: 10, marginBottom: 16, lineHeight: 16 },
  axiePreview: { width: 80, height: 80, backgroundColor: "#000", borderWidth: 1, borderColor: C.redDark, marginBottom: 14 },
  axieImg: { width: "100%", height: "100%" },
  offerBox: { alignItems: "center", borderWidth: 1, borderColor: C.amber + "50", padding: 12, width: "100%" },
  offerLabel: { color: C.muted, fontFamily: MONO, fontSize: 8, letterSpacing: 1.5, marginBottom: 6 },
  offerVal: { color: C.amber, fontFamily: MONO, fontSize: 20, fontWeight: "900" },
  offerUsd: { color: C.parchmentDim, fontFamily: MONO, fontSize: 9, marginTop: 4 },
  resultTxt: { fontFamily: MONO, fontSize: 11, textAlign: "center", marginTop: 14, lineHeight: 16 },
  btn: { flex: 1, paddingVertical: 12, alignItems: "center", borderWidth: 1.5 },
  btnGhost: { borderColor: C.redDark },
  btnGhostTxt: { color: C.parchmentDim, fontFamily: MONO, fontWeight: "900", fontSize: 11 },
  btnAccept: { borderColor: C.purple, backgroundColor: C.purpleDim + "40" },
  btnAcceptTxt: { color: "#fff", fontFamily: MONO, fontWeight: "900", fontSize: 11 },
});

// ── TIPOS ────────────────────────────────────────────────────────
type ActiveEvent = { id: string; event_number: number; status: string; swap_pool_slp: number };

// ── SCREEN ──────────────────────────────────────────────────────
export default function SwapScreen() {
  const { address, isAuthenticated, connectAndAuthenticate, isConnecting, isVerifying } = useWallet();
  const { price: slpPrice } = useSlpPrice();
  const blink = useBlink(1100);
  const pulse = usePulse(2200);
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });

  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [hasTicket, setHasTicket] = useState<boolean | null>(null);
  const [axies, setAxies] = useState<Axie[]>([]);
  const [axiesLoading, setAxiesLoading] = useState(false);
  const [selectedAxie, setSelectedAxie] = useState<Axie | null>(null);

  const [offerOpen, setOfferOpen] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<{ ok: boolean; message: string } | null>(null);

  // ── Floor price simulado (mismo para todos los Axies, por simplicidad) ──
  const FLOOR_PRICE_USD = 0.45;
  const floorPriceSlp = usdToSlp(FLOOR_PRICE_USD, slpPrice);

  const loadEvent = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("id, event_number, status, swap_pool_slp")
      .eq("status", "swap")
      .order("event_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    setEvent(data ?? null);
  }, []);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  useEffect(() => {
    const channel = supabase
      .channel("swap-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => loadEvent())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadEvent]);

  // Verificar ticket holder + cargar Axies cuando hay evento abierto y wallet conectada
  useEffect(() => {
    if (!event || !address) {
      setHasTicket(null);
      setAxies([]);
      return;
    }

    (async () => {
      const { count } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("wallet_address", address);

      const owns = (count ?? 0) > 0;
      setHasTicket(owns);

      if (owns) {
        setAxiesLoading(true);
        const list = await getAxiesForWallet(address);
        setAxies(list);
        setAxiesLoading(false);
      }
    })();
  }, [event, address]);

  const handleConfirmSwap = async () => {
    if (!selectedAxie || !event || !address) return;
    setSwapping(true);
    setSwapResult(null);

    const { data, error } = await supabase.rpc("swap_axie", {
      p_event_id: event.id,
      p_wallet_address: address,
      p_axie_id: selectedAxie.id,
      p_floor_price_slp: floorPriceSlp,
      p_tx_hash: "SIM-SWAP-" + Date.now(),
    });

    setSwapping(false);

    if (error) {
      setSwapResult({ ok: false, message: error.message });
      return;
    }
    if (data?.success === false) {
      setSwapResult({ ok: false, message: data.message ?? "El swap no pudo completarse." });
      await loadEvent();
      return;
    }

    setSwapResult({ ok: true, message: `🔮 Trato cerrado. Recibiste ${fmtSlp(floorPriceSlp)} SLP.` });
    setAxies((prev) => prev.filter((a) => a.id !== selectedAxie.id));
    await loadEvent();
  };

  const isSwapOpen = !!event;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HudBar poolSlp={event?.swap_pool_slp ?? null} />

        {!isSwapOpen ? (
          // ── CORTINA CERRADA — sin cambios visuales del original ──
          <>
            <View style={styles.titleWrap}>
              <Text style={styles.coin}>◆ NIGHT MODE ◆</Text>
              <Text style={styles.titleAccent}>CORTINA</Text>
              <Text style={styles.title}>CERRADA</Text>
              <View style={styles.underline} />
            </View>

            <View style={curtain.panel}>
              <View style={curtain.tape}><Animated.Text style={[curtain.tapeTxt, { opacity: blink }]}>⚠ DO NOT ENTER ⚠</Animated.Text></View>
              <View style={curtain.body}>
                <View style={curtain.stripes}>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <View key={i} style={[curtain.stripe, { backgroundColor: i % 2 === 0 ? "#1a0008" : "#000" }]} />
                  ))}
                </View>
                <Animated.View style={[curtain.lockGlow, { opacity: pulseOpacity }]} />
                <PixelPadlock size={104} />
              </View>
              <View style={curtain.tape}><Text style={curtain.tapeTxt2}>◀ ROOM SEALED ▶</Text></View>
            </View>

            <View style={info.card}>
              <View style={info.head}><Text style={info.headTxt}>▸ EVENT SCHEDULE</Text></View>
              <Text style={info.desc}>
                El intercambio de Axies se habilita automáticamente cuando el ritual entra en fase de swap (Día 4).
              </Text>
            </View>
          </>
        ) : (
          // ── TELÓN ABIERTO ──────────────────────────────────────
          <>
            <View style={styles.titleWrap}>
              <Text style={styles.coin}>◆ EL CIRCO OSCURO ◆</Text>
              <Text style={styles.titleAccent}>LA TIENDA</Text>
              <Text style={styles.title}>DEL CIRQUERO</Text>
              <View style={styles.underline} />
            </View>

            {!isAuthenticated ? (
              <View style={gate.box}>
                <PixelRingmaster size={80} />
                <Text style={gate.txt}>"Acercate... pero primero, mostrame quién sos."</Text>
                <TouchableOpacity
                  style={gate.btn}
                  onPress={connectAndAuthenticate}
                  disabled={isConnecting || isVerifying}
                >
                  <Text style={gate.btnTxt}>
                    {isConnecting || isVerifying ? "CONECTANDO..." : "CONECTAR WALLET"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : hasTicket === false ? (
              <View style={gate.box}>
                <PixelRingmaster size={80} />
                <Text style={gate.txt}>
                  "Sin ticket no hay trato. Volvé cuando hayas participado del ritual."
                </Text>
              </View>
            ) : hasTicket === null || axiesLoading ? (
              <View style={gate.box}>
                <Text style={{ color: C.parchmentDim, fontFamily: MONO, fontSize: 11 }}>
                  Buscando tus Axies en la wallet...
                </Text>
              </View>
            ) : (
              <>
                <PentagramFrame>
                  <PixelRingmaster size={90} />
                  <Text style={pent.label}>"Dame uno... a cambio de unas monedas."</Text>
                </PentagramFrame>

                <View style={styles.sectionHead}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>TUS AXIES</Text>
                  <View style={styles.sectionLine} />
                  <Text style={styles.sectionCount}>{axies.length}</Text>
                </View>

                {axies.length === 0 ? (
                  <View style={gate.box}>
                    <Text style={gate.txt}>"No tenés nada que ofrecerme..."</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {axies.map((a) => (
                        <AxieCard
                          key={a.id}
                          axie={a}
                          selected={selectedAxie?.id === a.id}
                          onPress={() => setSelectedAxie(a)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                )}

                <TouchableOpacity
                  disabled={!selectedAxie}
                  style={[btn.btn, !selectedAxie && { opacity: 0.4 }]}
                  onPress={() => { setSwapResult(null); setOfferOpen(true); }}
                >
                  <Text style={btn.iconTxt}>🔮</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={btn.label}>OFRECER AL CIRQUERO</Text>
                    <Text style={btn.sub}>
                      {selectedAxie ? `Por ${fmtSlp(floorPriceSlp)} SLP (~$${FLOOR_PRICE_USD})` : "Elegí un Axie primero"}
                    </Text>
                  </View>
                  <Text style={btn.arrow}>▸</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <RingmasterOfferModal
        visible={offerOpen}
        axie={selectedAxie}
        floorPriceSlp={floorPriceSlp}
        floorPriceUsd={FLOOR_PRICE_USD}
        loading={swapping}
        result={swapResult}
        onConfirm={handleConfirmSwap}
        onClose={() => { setOfferOpen(false); setSwapResult(null); setSelectedAxie(null); }}
      />
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingTop: 8, paddingBottom: 60 },
  titleWrap: { alignItems: "center", marginTop: 8, marginBottom: 18 },
  coin: { color: C.purple, fontFamily: MONO, fontSize: 11, letterSpacing: 3, marginBottom: 6 },
  title: { color: C.parchment, fontFamily: MONO, fontSize: 30, fontWeight: "900", letterSpacing: 3, lineHeight: 32 },
  titleAccent: { color: C.red, fontFamily: MONO, fontSize: 30, fontWeight: "900", letterSpacing: 3, lineHeight: 32, textShadowColor: "rgba(255,0,51,0.6)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  underline: { width: 80, height: 3, backgroundColor: C.red, marginTop: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 10, gap: 8 },
  sectionDot: { width: 8, height: 8, backgroundColor: C.purple },
  sectionTitle: { color: C.parchment, fontFamily: MONO, fontSize: 12, letterSpacing: 2, fontWeight: "700" },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.redDark },
  sectionCount: { color: C.amber, fontFamily: MONO, fontSize: 11, letterSpacing: 1.5 },
});

const hud = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.redDark, marginBottom: 4 },
  hp: { color: C.parchment, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
  rec: { color: C.red, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5 },
  hi: { color: C.amber, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
});

const curtain = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.red, backgroundColor: C.ink, marginBottom: 16 },
  tape: { backgroundColor: C.red, paddingVertical: 6, alignItems: "center" },
  tapeTxt: { color: "#fff", fontFamily: MONO, fontSize: 11, letterSpacing: 3, fontWeight: "900" },
  tapeTxt2: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  body: { height: 200, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  stripes: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  stripe: { flex: 1 },
  lockGlow: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,0,51,0.3)" },
});

const info = StyleSheet.create({
  card: { borderWidth: 2, borderColor: C.redDark, backgroundColor: C.ink },
  head: { backgroundColor: "#1a0008", paddingHorizontal: 12, paddingVertical: 6 },
  headTxt: { color: C.red, fontFamily: MONO, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  desc: { color: C.parchmentDim, fontFamily: MONO, fontSize: 12, lineHeight: 20, padding: 14 },
});

const gate = StyleSheet.create({
  box: { borderWidth: 2, borderColor: C.purpleDim, backgroundColor: C.ink, alignItems: "center", padding: 24, gap: 14 },
  txt: { color: C.parchmentDim, fontFamily: MONO, fontSize: 11, fontStyle: "italic", textAlign: "center", lineHeight: 16 },
  btn: { borderWidth: 1.5, borderColor: C.purple, paddingHorizontal: 20, paddingVertical: 10 },
  btnTxt: { color: "#fff", fontFamily: MONO, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});

const btn = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: C.purple, backgroundColor: C.purpleDim + "30", paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  iconTxt: { fontSize: 22 },
  label: { color: "#fff", fontFamily: MONO, fontSize: 13, letterSpacing: 2, fontWeight: "900" },
  sub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 9, letterSpacing: 0.5, marginTop: 2, fontWeight: "700" },
  arrow: { color: "#fff", fontFamily: MONO, fontSize: 18, fontWeight: "900" },
});