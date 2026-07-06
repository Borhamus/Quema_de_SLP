/**
 * app/(tabs)/special.tsx — EVENTO ANUAL
 * (antes "boss" — renombrado según lo pedido)
 *
 * Conservamos toda la pirotecnia visual del altar de fuego.
 * Lo nuevo: pool en vivo desde Supabase, modal de cámara para
 * leer el QR de la Llave Anual, y la validación de seguridad:
 * el QR solo apunta a un ID — la prueba real de ownership es
 * que la wallet CONECTADA coincida con el owner_wallet guardado.
 */
import { useWallet } from "@/contexts/wallet-context";
import { fmtSlp } from "@/hooks/use-slp-price";
import { supabase } from "@/lib/supabase";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
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
const FIRE_PALETTE: Record<string, string> = { ".": "transparent", W: "#fff5cc", Y: "#ffd84a", O: "#ff7a1a", R: "#ff0033", D: "#7a0a1f" };
const FIRE_FRAMES: string[][] = [
  ["...Y....","..YOY...",".YOWOY..",".OWWWOY.","YOWWWWOY","OWWRWWOO","ROWRRWOR","RROORROR",".DRRRRD."],
  ["....Y...","...YOY..","..YOWO..",".YOWWOY.",".OWWWWOY","YOWRWWOO","OORRWWOR","RROORROR",".DRRRRD."],
  ["...Y....","..YOY...",".YOWOY..","YOWWWOY.","OWWWWWO.","OWWRWWOY","RORRWWOR","RORRRROR",".DRRRRD."],
  ["..Y..Y..",".YOY.OY.","YOWOYOOY","OWWWOWWO","OWWRWWOO","ROWRWWOR","RROORROR","RRRRRRRR",".DDRRDD."],
];
function PixelFire({ size = 90, frame }: { size?: number; frame: number }) {
  const rows = FIRE_FRAMES[frame % FIRE_FRAMES.length];
  const cols = rows[0].length;
  const p = size / cols;
  return (
    <View style={{ width: size, height: p * rows.length }}>
      {rows.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.split("").map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: FIRE_PALETTE[c] }} />)}
        </View>
      ))}
    </View>
  );
}
function PixelAltar({ width = 160 }: { width?: number }) {
  const stone = "#3a2a28", stoneL = "#5a3e3a", stoneD = "#1d1414";
  const block = (w: number, h: number, c: string) => <View style={{ width: w, height: h, backgroundColor: c }} />;
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row" }}>{block(width, 6, stoneL)}</View>
      <View style={{ flexDirection: "row" }}>{block(width, 4, stone)}</View>
      <View style={{ flexDirection: "row", marginTop: 2 }}>{block(width * 0.62, 14, stoneD)}</View>
      <View style={{ flexDirection: "row" }}>{block(width * 0.62, 14, stone)}</View>
      <View style={{ flexDirection: "row", marginTop: 2 }}>{block(width * 1.08, 8, stone)}</View>
      <View style={{ flexDirection: "row" }}>{block(width * 1.08, 6, stoneD)}</View>
    </View>
  );
}
function PixelStalactites({ count = 9 }: { count?: number }) {
  const stoneL = "#2a1a18", stoneD = "#0a0404";
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-start" }}>
      {Array.from({ length: count }).map((_, i) => {
        const h = 4 + ((i * 7) % 5);
        return (
          <View key={i} style={{ alignItems: "center" }}>
            {Array.from({ length: h }).map((_, r) => (
              <View key={r} style={{ width: Math.max(2, 14 - r * 3), height: 4, backgroundColor: r === 0 ? stoneL : stoneD }} />
            ))}
          </View>
        );
      })}
    </View>
  );
}
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
  return <Animated.View style={{ position: "absolute", left: x, bottom: 36, width: 3, height: 3, backgroundColor: color, transform: [{ translateY }, { translateX }], opacity }} />;
}
function PixelTrophy({ size = 96 }: { size?: number }) {
  const p = size / 10; const a = C.amber; const d = C.amberDim; const r = C.red; const k = "transparent";
  const map = [
    [k,a,a,a,a,a,a,a,a,k],[a,a,d,d,d,d,d,d,a,a],[a,d,a,a,a,a,a,a,d,a],
    [k,d,a,r,r,r,r,a,d,k],[k,d,a,a,r,r,a,a,d,k],[k,d,a,a,a,a,a,a,d,k],
    [k,k,d,a,a,a,a,d,k,k],[k,k,k,d,d,d,d,k,k,k],[k,k,a,a,a,a,a,a,k,k],[k,a,a,a,a,a,a,a,a,k],
  ];
  return <View style={{ width: size, height: size }}>{map.map((row, y) => <View key={y} style={{ flexDirection: "row" }}>{row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}</View>)}</View>;
}
function PixelKeyHole({ size = 60 }: { size?: number }) {
  const p = size / 6; const a = C.amber; const d = C.amberDim; const k = "transparent";
  const map = [[k,k,a,a,k,k],[k,a,d,d,a,k],[k,a,d,d,a,k],[k,a,d,d,a,k],[a,d,d,d,d,a],[a,a,a,a,a,a]];
  return <View style={{ width: size, height: size }}>{map.map((row, y) => <View key={y} style={{ flexDirection: "row" }}>{row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}</View>)}</View>;
}
function PixelSkull({ size = 56 }: { size?: number }) {
  const p = size / 8; const w = C.parchment; const d = C.parchmentDim; const k = "transparent"; const r = C.red;
  const map = [
    [k,w,w,w,w,w,w,k],[w,w,w,w,w,w,w,w],[w,r,w,w,w,w,r,w],[w,w,w,d,d,w,w,w],
    [w,w,w,w,w,w,w,w],[k,w,d,w,w,d,w,k],[k,k,w,d,d,w,k,k],[k,k,k,w,w,k,k,k],
  ];
  return <View style={{ width: size, height: size }}>{map.map((row, y) => <View key={y} style={{ flexDirection: "row" }}>{row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}</View>)}</View>;
}

function HudBar() {
  const blink = useBlink(700);
  return (
    <View style={hud.row}>
      <Text style={hud.hp}>HP <Text style={{ color: C.red }}>████░</Text> 1P</Text>
      <Animated.Text style={[hud.rec, { opacity: blink }]}>● EVENTO ANUAL</Animated.Text>
      <Text style={hud.hi}>STAGE ∞</Text>
    </View>
  );
}

// ── TIPOS ────────────────────────────────────────────────────────
type AnnualPoolData = { year: number; pool_slp: number; status: string };
type MyKey = { id: string; year: number; status: "vivo" | "usado" | "quemada" };

// ── QR SCANNER MODAL — con la validación de seguridad ───────────
function KeyScannerModal({
  visible, onClose, address, onGranted,
}: {
  visible: boolean; onClose: () => void; address: string | null; onGranted: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (visible) {
      setScanning(true);
      setVerifying(false);
      setResult(null);
      if (!permission?.granted) requestPermission();
    }
  }, [visible]);

  const handleScan = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);

    const match = data.match(/^FYNOLTS-ANNUAL-KEY:(.+)$/);
    if (!match) {
      setResult({ ok: false, message: "Este QR no es una Llave Anual válida." });
      return;
    }
    const keyId = match[1];

    if (!address) {
      setResult({ ok: false, message: "Conectá tu wallet antes de escanear." });
      return;
    }

    setVerifying(true);

    // PASO 1 (UI): chequeo rápido de ownership antes de pedirle nada a la wallet
    const { data: keyRow } = await supabase
      .from("annual_keys")
      .select("id, owner_wallet, status, year")
      .eq("id", keyId)
      .maybeSingle();

    if (!keyRow) {
      setVerifying(false);
      setResult({ ok: false, message: "Llave no encontrada." });
      return;
    }

    if (keyRow.owner_wallet !== address) {
      setVerifying(false);
      setResult({ ok: false, message: "Esta llave no pertenece a tu wallet conectada." });
      return;
    }

    if (keyRow.status !== "vivo") {
      setVerifying(false);
      setResult({ ok: false, message: "Esta llave ya fue usada." });
      return;
    }

    // PASO 2: la wallet "confirma" la transacción — simulando exactamente
    // el popup que aparece al comprar un Axie en Sky Mavis. Acá usamos
    // personal_sign como prueba de que la wallet conectada autoriza la
    // acción (igual patrón que el login).
    try {
      const provider = (window as any)?.ronin?.provider;
      if (provider) {
        const message = `Confirmo el uso de mi Llave Anual ${keyRow.year} (${keyId}) para acceder al Evento Anual.`;
        await provider.request({ method: "personal_sign", params: [message, address] });
      }
    } catch (e: any) {
      setVerifying(false);
      setResult({ ok: false, message: e?.code === 4001 ? "Firma rechazada." : "Error al firmar la confirmación." });
      return;
    }

    // PASO 3 (servidor): la validación real e inviolable — repite todo
    // del lado de Supabase, nunca confía solo en lo que pasó en el cliente.
    const { data: consumeResult, error } = await supabase.rpc("consume_annual_key", {
      p_key_id: keyId,
      p_wallet_address: address,
    });

    setVerifying(false);

    if (error) {
      setResult({ ok: false, message: error.message });
      return;
    }

    setResult({ ok: true, message: "🔥 La llave se consumió. Las puertas se abren." });
    onGranted();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={qs.overlay}>
        <View style={qs.box}>
          <Text style={qs.title}>⬡ CERRADURA DEL RITUAL ⬡</Text>
          <Text style={qs.sub}>Colocá tu llave (QR) frente a la cámara</Text>

          {!permission?.granted ? (
            <View style={qs.permBox}>
              <Text style={qs.permTxt}>Necesitamos acceso a tu cámara para leer la llave.</Text>
              <TouchableOpacity style={qs.permBtn} onPress={requestPermission}>
                <Text style={qs.permBtnTxt}>HABILITAR CÁMARA</Text>
              </TouchableOpacity>
            </View>
          ) : result ? (
            <View style={qs.resultBox}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>{result.ok ? "🗝️" : "⚠"}</Text>
              <Text style={[qs.resultTxt, { color: result.ok ? C.ok : C.red }]}>{result.message}</Text>
              {!result.ok && (
                <TouchableOpacity
                  style={qs.retryBtn}
                  onPress={() => { setScanning(true); setResult(null); }}
                >
                  <Text style={qs.retryBtnTxt}>REINTENTAR</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={qs.cameraWrap}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="front"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanning ? handleScan : undefined}
              />
              <View style={qs.scanFrame} />
              {verifying && (
                <View style={qs.verifyOverlay}>
                  <Text style={qs.verifyTxt}>⏳ VERIFICANDO LLAVE...</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={qs.closeBtn}>
            <Text style={qs.closeTxt}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const qs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", padding: 20 },
  box: { backgroundColor: C.ink, borderWidth: 2, borderColor: C.amber, padding: 20, alignItems: "center", width: "100%", maxWidth: 360 },
  title: { color: C.amber, fontFamily: MONO, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  sub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, textAlign: "center", marginTop: 6, marginBottom: 16 },
  cameraWrap: { width: 260, height: 260, backgroundColor: "#000", overflow: "hidden", position: "relative" },
  scanFrame: { position: "absolute", top: 30, left: 30, right: 30, bottom: 30, borderWidth: 2, borderColor: C.amber, borderRadius: 130 },
  verifyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center" },
  verifyTxt: { color: C.amber, fontFamily: MONO, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  permBox: { width: 260, alignItems: "center", paddingVertical: 30 },
  permTxt: { color: C.parchmentDim, fontFamily: MONO, fontSize: 11, textAlign: "center", marginBottom: 16, lineHeight: 16 },
  permBtn: { borderWidth: 1.5, borderColor: C.amber, paddingHorizontal: 18, paddingVertical: 10 },
  permBtnTxt: { color: C.amber, fontFamily: MONO, fontWeight: "900", fontSize: 11 },
  resultBox: { width: 260, alignItems: "center", paddingVertical: 30 },
  resultTxt: { fontFamily: MONO, fontSize: 12, textAlign: "center", lineHeight: 18, fontWeight: "700" },
  retryBtn: { marginTop: 18, borderWidth: 1.5, borderColor: C.amber, paddingHorizontal: 18, paddingVertical: 10 },
  retryBtnTxt: { color: C.amber, fontFamily: MONO, fontWeight: "900", fontSize: 10 },
  closeBtn: { marginTop: 18, borderWidth: 1.5, borderColor: C.red, paddingHorizontal: 24, paddingVertical: 10 },
  closeTxt: { color: C.red, fontFamily: MONO, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});

// ── SCREEN ──────────────────────────────────────────────────────
export default function SpecialScreen() {
  const { address, isAuthenticated } = useWallet();
  const blink = useBlink(900);
  const fireFrame = useFireFrame(140, FIRE_FRAMES.length);
  const trophyFloat = useFloat(2400, 4);
  const glow = usePulse(1800);
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  const currentYear = new Date().getFullYear();
  const [pool, setPool] = useState<AnnualPoolData | null>(null);
  const [myKeys, setMyKeys] = useState<MyKey[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  const loadData = useCallback(async () => {
    const { data: poolData } = await supabase
      .from("annual_pool")
      .select("year, pool_slp, status")
      .eq("year", currentYear)
      .maybeSingle();
    setPool(poolData ?? { year: currentYear, pool_slp: 0, status: "acumulando" });

    if (address) {
      const { data: keysData } = await supabase
        .from("annual_keys")
        .select("id, year, status")
        .eq("owner_wallet", address)
        .eq("year", currentYear);
      setMyKeys(keysData ?? []);
    } else {
      setMyKeys([]);
    }
  }, [address, currentYear]);

  useEffect(() => { loadData(); }, [loadData]);

  // Recarga cada vez que volvés a esta pantalla.
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const liveKeys = myKeys.filter(k => k.status === "vivo");
  const rewardEach = pool ? Math.floor(pool.pool_slp / 10) : 0;
  const hasUsableKey = liveKeys.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HudBar />

        <View style={styles.titleWrap}>
          <Text style={styles.coin}>◆ ANNUAL CHAMPIONSHIP ◆</Text>
          <Text style={styles.title}>GRAN</Text>
          <Text style={styles.titleAccent}>EVENTO ANUAL</Text>
          <View style={styles.underline} />
        </View>

        {/* Hero trophy panel — sin cambios visuales */}
        <View style={hero.panel}>
          <View style={hero.tape}><Animated.Text style={[hero.tapeTxt, { opacity: blink }]}>★ LEGENDS ONLY ★</Animated.Text></View>
          <View style={hero.body}>
            <View style={hero.caveBg} />
            <View style={hero.caveBg2} />
            <View style={hero.stalacWrap}><PixelStalactites count={11} /></View>
            <Animated.View style={[hero.glow, { opacity: glowOpacity }]} />
            <Animated.View style={[hero.glowInner, { opacity: glowOpacity }]} />
            <Ember x={70} delay={0} dur={2400} color="#ffb300" />
            <Ember x={100} delay={400} dur={2800} color="#ff7a1a" />
            <Ember x={130} delay={900} dur={2200} color="#ffd84a" />
            <Ember x={160} delay={200} dur={3000} color="#ff0033" />
            <Ember x={190} delay={1200} dur={2600} color="#ff7a1a" />
            <Ember x={220} delay={700} dur={2400} color="#ffb300" />
            <Ember x={250} delay={1500} dur={2900} color="#ffd84a" />
            <Animated.View style={[hero.trophyWrap, { transform: [{ translateY: trophyFloat }] }]}><PixelTrophy size={72} /></Animated.View>
            <View style={hero.fireWrap}><PixelFire size={88} frame={fireFrame} /></View>
            <View style={hero.altarWrap}><PixelAltar width={150} /></View>
            <View style={hero.skullL}><PixelSkull size={28} /></View>
            <View style={hero.skullR}><PixelSkull size={28} /></View>
          </View>
          <View style={hero.tapeBottom}><Text style={hero.tapeTxtBottom}>◀ INSERT KEY TO CHALLENGE ▶</Text></View>
        </View>

        {/* Pool en vivo */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>POOL ESPECIAL {currentYear}</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={pool_.panel}>
          <Text style={pool_.poolLabel}>ACUMULADO HASTA AHORA</Text>
          <Text style={pool_.poolVal}>{pool ? fmtSlp(pool.pool_slp) : "—"} SLP</Text>
          <View style={pool_.divider} />
          <View style={pool_.row}>
            <View style={pool_.col}>
              <Text style={pool_.colVal}>10</Text>
              <Text style={pool_.colKey}>GANADORES</Text>
            </View>
            <View style={pool_.colDiv} />
            <View style={pool_.col}>
              <Text style={pool_.colVal}>{fmtSlp(rewardEach)}</Text>
              <Text style={pool_.colKey}>SLP C/U (EST.)</Text>
            </View>
            <View style={pool_.colDiv} />
            <View style={pool_.col}>
              <Text style={pool_.colVal}>{pool?.status === "acumulando" ? "ABIERTO" : pool?.status?.toUpperCase() ?? "—"}</Text>
              <Text style={pool_.colKey}>ESTADO</Text>
            </View>
          </View>
        </View>

        {/* Info card */}
        <View style={info.card}>
          <View style={info.head}><Text style={info.headTxt}>▸ BRIEFING</Text></View>
          <Text style={info.desc}>
            Solo para leyendas. Para entrar necesitás usar una{" "}
            <Text style={{ color: C.amber, fontWeight: "900" }}>llave anual</Text> minteada desde tu perfil — 12 tickets, uno de cada mes del año.
          </Text>
        </View>

        {/* Key slot — ahora funcional */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>KEY SLOT</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={slot.panel}>
          <View style={slot.slotInner}>
            <View style={slot.dashRow}>{Array.from({ length: 22 }).map((_, i) => <View key={i} style={slot.dashTop} />)}</View>
            <View style={slot.slotBody}>
              <PixelKeyHole size={56} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={slot.slotLabel}>
                  {isAuthenticated ? `${liveKeys.length} LLAVE${liveKeys.length !== 1 ? "S" : ""} ${currentYear}` : "INSERTAR LLAVE"}
                </Text>
                <Text style={slot.slotSub}>
                  {!isAuthenticated ? "Conectá tu wallet primero" : hasUsableKey ? "Lista para usar — escaneá tu QR" : "Sin llaves vivas todavía"}
                </Text>
              </View>
              <Animated.View style={[slot.cursor, { opacity: blink }]} />
            </View>
            <View style={slot.dashRow}>{Array.from({ length: 22 }).map((_, i) => <View key={i} style={slot.dashTop} />)}</View>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <TouchableOpacity
            disabled={!isAuthenticated || !hasUsableKey}
            style={[btn.btn, (!isAuthenticated || !hasUsableKey) && { opacity: 0.5 }]}
            onPress={() => setScannerOpen(true)}
          >
            <Text style={btn.iconTxt}>🗝️</Text>
            <View style={{ flex: 1 }}>
              <Text style={btn.label}>ABRIR LAS PUERTAS</Text>
              <Text style={btn.sub}>{hasUsableKey ? "ESCANEAR LLAVE PARA PARTICIPAR" : "REQUIERE UNA LLAVE VIVA"}</Text>
            </View>
            <Text style={btn.arrow}>{hasUsableKey ? "▸" : "✕"}</Text>
          </TouchableOpacity>
        </View>

        {/* Reglas */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>CÓMO FUNCIONA EL SORTEO</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={prize.panel}>
          <View style={prize.row}>
            <Text style={prize.romano}>I</Text>
            <View style={prize.divider} />
            <View style={{ flex: 1 }}>
              <Text style={prize.title}>10 REWARDS IGUALES</Text>
              <Text style={prize.desc}>El pool total se divide entre 10 ganadores, en partes iguales.</Text>
            </View>
          </View>
          <View style={prize.row}>
            <Text style={prize.romano}>II</Text>
            <View style={prize.divider} />
            <View style={{ flex: 1 }}>
              <Text style={prize.title}>SORTEO SECUENCIAL</Text>
              <Text style={prize.desc}>Se sortea una recompensa a la vez, en orden. Y una llave que ya ganó una reward no participa de nuevo.</Text>
            </View>
          </View>
          <View style={prize.row}>
            <Text style={prize.romano}>III</Text>
            <View style={prize.divider} />
            <View style={{ flex: 1 }}>
              <Text style={prize.title}>LLAVES TRANSFERIBLES</Text>
              <Text style={prize.desc}>Tu llave es un NFT — podés guardarla, venderla o usarla vos mismo.</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <KeyScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        address={address}
        onGranted={loadData}
      />
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingTop: 8, paddingBottom: 60 },
  titleWrap: { alignItems: "center", marginTop: 8, marginBottom: 18 },
  coin: { color: C.amber, fontFamily: MONO, fontSize: 11, letterSpacing: 3, marginBottom: 6 },
  title: { color: C.parchment, fontFamily: MONO, fontSize: 36, fontWeight: "900", letterSpacing: 4, lineHeight: 38 },
  titleAccent: { color: C.red, fontFamily: MONO, fontSize: 36, fontWeight: "900", letterSpacing: 4, lineHeight: 38, textShadowColor: "rgba(255,0,51,0.6)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  underline: { width: 80, height: 3, backgroundColor: C.red, marginTop: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 10, gap: 8 },
  sectionDot: { width: 8, height: 8, backgroundColor: C.red },
  sectionTitle: { color: C.parchment, fontFamily: MONO, fontSize: 12, letterSpacing: 2, fontWeight: "700" },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.redDark },
});

const hud = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.redDark, marginBottom: 4 },
  hp: { color: C.parchment, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
  rec: { color: C.red, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5 },
  hi: { color: C.amber, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
});

const hero = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.amber, backgroundColor: C.ink, marginBottom: 16 },
  tape: { backgroundColor: C.amber, paddingVertical: 6, alignItems: "center" },
  tapeTxt: { color: "#000", fontFamily: MONO, fontSize: 12, letterSpacing: 4, fontWeight: "900" },
  body: { height: 280, overflow: "hidden", position: "relative", backgroundColor: "#0a0404" },
  caveBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0a0404" },
  caveBg2: { position: "absolute", left: 0, right: 0, bottom: 0, height: 120, backgroundColor: "#160808" },
  stalacWrap: { position: "absolute", top: 0, left: 0, right: 0 },
  glow: { position: "absolute", bottom: 30, alignSelf: "center", width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(255,120,30,0.28)" },
  glowInner: { position: "absolute", bottom: 60, alignSelf: "center", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,200,80,0.45)" },
  trophyWrap: { position: "absolute", top: 56, alignSelf: "center" },
  fireWrap: { position: "absolute", bottom: 58, alignSelf: "center" },
  altarWrap: { position: "absolute", bottom: 6, alignSelf: "center" },
  skullL: { position: "absolute", bottom: 14, left: 26 },
  skullR: { position: "absolute", bottom: 14, right: 26 },
  tapeBottom: { backgroundColor: "#1a1100", paddingVertical: 6, alignItems: "center", borderTopWidth: 1, borderTopColor: C.amberDim },
  tapeTxtBottom: { color: C.amber, fontFamily: MONO, fontSize: 10, letterSpacing: 3, fontWeight: "700" },
});

const pool_ = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.amber, backgroundColor: C.ink, padding: 16, alignItems: "center" },
  poolLabel: { color: C.muted, fontFamily: MONO, fontSize: 9, letterSpacing: 2 },
  poolVal: { color: C.amber, fontFamily: MONO, fontSize: 28, fontWeight: "900", marginTop: 6 },
  divider: { height: 1, backgroundColor: C.amberDim, width: "100%", marginVertical: 14 },
  row: { flexDirection: "row", width: "100%" },
  col: { flex: 1, alignItems: "center" },
  colVal: { color: C.parchment, fontFamily: MONO, fontSize: 14, fontWeight: "900" },
  colKey: { color: C.muted, fontFamily: MONO, fontSize: 7, letterSpacing: 1, marginTop: 4, textAlign: "center" },
  colDiv: { width: 1, backgroundColor: C.amberDim, marginHorizontal: 8 },
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
  btn: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: C.amber, backgroundColor: "#1a1100", paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  iconTxt: { fontSize: 22 },
  label: { color: C.amber, fontFamily: MONO, fontSize: 13, letterSpacing: 2, fontWeight: "900" },
  sub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 9, letterSpacing: 1, marginTop: 2, fontWeight: "700" },
  arrow: { color: C.amber, fontFamily: MONO, fontSize: 18, fontWeight: "900" },
});

const prize = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.redDark, backgroundColor: C.ink },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: C.redDark, gap: 14 },
  romano: { color: C.amber, fontFamily: MONO, fontSize: 24, fontWeight: "900", letterSpacing: 2, width: 40, textAlign: "center" },
  divider: { width: 1, alignSelf: "stretch", backgroundColor: C.redDark },
  title: { color: C.parchment, fontFamily: MONO, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  desc: { color: C.parchmentDim, fontFamily: MONO, fontSize: 11, marginTop: 4, lineHeight: 16 },
});