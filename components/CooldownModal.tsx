/**
 * components/CooldownModal.tsx
 *
 * Modal de cooldown del swap — compartido entre /swap (pantalla real)
 * y /test (panel de QA). Es el MISMO componente a propósito, para que
 * lo que se prueba en /test sea 100% lo mismo que ve un usuario real.
 */
import { pickRandom, RINGMASTER_COOLDOWN_LINES } from "@/constants/ringmasterLines";
import { pad2, useCountdown } from "@/hooks/use-countdown";
import { Axie } from "@/lib/axie-service";
import { useEffect, useState } from "react";
import {
    Image,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { HScroller } from "./HScroller";
import { PixelPadlock, PixelRingmaster } from "./PixelArt";

const C = {
  ink: "#0a0000",
  purple: "#6b1f8f",
  amber: "#ffb300",
  parchment: "#f6e6c2",
  parchmentDim: "#a89472",
  muted: "#5a4040",
  borderMid: "#550000",
  greenBrt: "#6abf5e",
};
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

export function CooldownTimer({ until }: { until: string | null }) {
  const deadline = until ? new Date(until).getTime() : null;
  const cd = useCountdown(deadline);
  if (!cd) return null;
  if (cd.expired) return <Text style={ctm.txt}>⏳ Ya podés volver a intentarlo — actualizá la pantalla.</Text>;
  return (
    <Text style={ctm.txt}>
      🔒 Cooldown: <Text style={ctm.num}>{cd.days * 24 + cd.hours}h {pad2(cd.minutes)}m {pad2(cd.seconds)}s</Text>
    </Text>
  );
}
const ctm = StyleSheet.create({
  txt: { color: C.parchmentDim, fontFamily: MONO, fontSize: 11, textAlign: "center" },
  num: { color: C.amber, fontWeight: "900" },
});

export function CooldownOfferModal({
  visible, cooldownUntil, requiredSlp, requiredUsd, payLoading, axieLoading,
  onPaySlp, onOpenAxiePicker, onClose,
}: {
  visible: boolean; cooldownUntil: string | null; requiredSlp: number; requiredUsd: number;
  payLoading: boolean; axieLoading: boolean;
  onPaySlp: () => void; onOpenAxiePicker: () => void; onClose: () => void;
}) {
  const [line, setLine] = useState("");
  useEffect(() => {
    if (visible) setLine(pickRandom(RINGMASTER_COOLDOWN_LINES));
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={rm.overlay} onPress={onClose}>
        <Pressable style={rm.box} onPress={(e) => e.stopPropagation()}>
          <PixelPadlock size={72} />
          <PixelRingmaster size={80} />
          <Text style={rm.speech}>"{line}"</Text>
          <View style={{ marginBottom: 14 }}>
            <CooldownTimer until={cooldownUntil} />
          </View>

          <View style={{ width: "100%", gap: 10 }}>
            <TouchableOpacity style={[btn.btn, { justifyContent: "center" }]} onPress={onPaySlp} disabled={payLoading}>
              <Text style={btn.iconTxt}>💰</Text>
              <View style={{ flex: 1 }}>
                <Text style={btn.label}>{payLoading ? "..." : `PAGAR ${requiredSlp.toLocaleString()} SLP`}</Text>
                <Text style={btn.sub}>(~${requiredUsd.toFixed(2)} USD)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[btn.btn, { justifyContent: "center", borderColor: C.amber }]} onPress={onOpenAxiePicker} disabled={axieLoading}>
              <Text style={btn.iconTxt}>🐾</Text>
              <View style={{ flex: 1 }}>
                <Text style={btn.label}>ENTREGAR OTRO AXIE</Text>
                <Text style={btn.sub}>Sin cobrar — es el peaje para volver a entrar</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: "center", paddingVertical: 6 }} onPress={onClose}>
              <Text style={{ color: C.muted, fontFamily: MONO, fontSize: 9, letterSpacing: 1 }}>
                CERRAR (podés seguir viendo el resto del sitio)
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function CooldownAxiePickerModal({
  visible, axies, loading, onConfirm, onClose,
}: {
  visible: boolean; axies: Axie[]; loading: boolean;
  onConfirm: (axie: Axie) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<Axie | null>(null);
  useEffect(() => { if (!visible) setSelected(null); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={rm.overlay} onPress={onClose}>
        <Pressable style={rm.box} onPress={(e) => e.stopPropagation()}>
          <PixelRingmaster size={80} />
          <Text style={rm.speech}>"Elegí cuál me vas a dar esta vez."</Text>

          {axies.length === 0 ? (
            <Text style={{ color: C.muted, fontFamily: MONO, fontSize: 10, textAlign: "center", marginVertical: 10 }}>
              No te quedan Axies disponibles para esto.
            </Text>
          ) : (
            <View style={{ marginVertical: 10, width: "100%" }}>
              <HScroller>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {axies.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => setSelected(a)}
                      style={[ax.card, selected?.id === a.id && ax.cardSelected]}
                    >
                      <Image source={{ uri: a.imageUrl }} style={ax.img} resizeMode="contain" />
                      <Text style={ax.id}>#{a.id}</Text>
                      <Text style={ax.cls}>{a.class}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </HScroller>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14, width: "100%" }}>
            <TouchableOpacity style={[rm.btn, rm.btnGhost]} onPress={onClose} disabled={loading}>
              <Text style={rm.btnGhostTxt}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rm.btn, rm.btnAccept, !selected && { opacity: 0.4 }]}
              onPress={() => selected && onConfirm(selected)}
              disabled={!selected || loading}
            >
              <Text style={rm.btnAcceptTxt}>{loading ? "..." : "CONFIRMAR ENTREGA"}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#000000e6", alignItems: "center", justifyContent: "center", padding: 20 },
  box: { width: "100%", maxWidth: 420, borderWidth: 1.5, borderColor: C.purple, backgroundColor: C.ink, padding: 18, alignItems: "center", gap: 4 },
  speech: { color: C.parchment, fontFamily: MONO, fontSize: 11, textAlign: "center", marginTop: 10, marginBottom: 6, fontStyle: "italic" },
  btn: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: C.greenBrt, padding: 10, gap: 10, width: "100%" },
  btnGhost: { flex: 1, borderWidth: 1, borderColor: C.muted, alignItems: "center", padding: 10 },
  btnGhostTxt: { color: C.muted, fontFamily: MONO, fontSize: 10, fontWeight: "900" },
  btnAccept: { flex: 1, borderWidth: 1.5, borderColor: C.greenBrt, alignItems: "center", padding: 10 },
  btnAcceptTxt: { color: C.greenBrt, fontFamily: MONO, fontSize: 10, fontWeight: "900" },
});
const btn = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: C.greenBrt, padding: 10, gap: 10 },
  iconTxt: { fontSize: 18 },
  label: { color: C.parchment, fontFamily: MONO, fontSize: 11, fontWeight: "900" },
  sub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 9, marginTop: 2 },
});
const ax = StyleSheet.create({
  card: { width: 80, borderWidth: 1.5, borderColor: C.borderMid, backgroundColor: "#000", padding: 6, alignItems: "center" },
  cardSelected: { borderColor: C.purple, backgroundColor: C.purple + "20" },
  img: { width: 50, height: 50 },
  id: { color: C.parchment, fontFamily: MONO, fontSize: 8, marginTop: 4 },
  cls: { color: C.parchmentDim, fontFamily: MONO, fontSize: 7 },
});