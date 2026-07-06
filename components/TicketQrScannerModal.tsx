/**
 * components/TicketQrScannerModal.tsx
 *
 * Modal de cámara para leer el QR de un ticket y saltar al ritual al
 * que pertenece.
 *
 * IMPORTANTE: la cámara NUNCA se activa sola. Siempre hay un botón
 * "ACTIVAR CÁMARA" que el usuario tiene que tocar — esto no es solo
 * por claridad de UX, es necesario para que el navegador arranque
 * el video de verdad (en varios navegadores, si la cámara se monta
 * automáticamente sin un click directo del usuario, el permiso queda
 * "concedido" pero el video nunca llega a mostrarse — pantalla negra).
 *
 * Comportamiento:
 *  - Pantalla inicial: botón para activar la cámara.
 *  - Al activarla: escanea durante 10 segundos como máximo.
 *  - Si encuentra un ticket válido antes: para, muestra "Evento
 *    encontrado" con un botón "IR AL RITUAL →" (no navega solo).
 *  - Si pasan los 10s sin encontrar nada: se cierra sola la cámara y
 *    muestra el mensaje de "no se encontró", con botón para reintentar.
 */
import { supabase } from "@/lib/supabase";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = {
  ink: "#0a0000",
  red: "#ff0033",
  amber: "#ffb300",
  parchmentDim: "#a89472",
  muted: "#5a4040",
  ok: "#00ff66",
};
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const SCAN_TIMEOUT_MS = 10000;

type FoundEvent = { event_id: string; event_number: number; event_label: string };
type Stage = "idle" | "scanning" | "checking" | "found" | "not_found";

export function TicketQrScannerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>("idle");
  const [found, setFound] = useState<FoundEvent | null>(null);
  const [notFoundMsg, setNotFoundMsg] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScanTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Se llama SOLO desde el onPress del botón — nunca automáticamente.
  const handleActivateCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res?.granted) return; // el usuario rechazó el permiso, nos quedamos en "idle"
    }
    setFound(null);
    setNotFoundMsg(null);
    setStage("scanning");
    clearScanTimeout();
    timeoutRef.current = setTimeout(() => {
      setStage("not_found");
      setNotFoundMsg("No se encontró ningún evento a tiempo. La cámara se cerró sola — volvé a intentarlo.");
    }, SCAN_TIMEOUT_MS);
  };

  // Al cerrar el modal, todo vuelve a "idle" (cámara apagada del todo).
  useEffect(() => {
    if (!visible) {
      clearScanTimeout();
      setStage("idle");
      setFound(null);
      setNotFoundMsg(null);
    }
    return () => clearScanTimeout();
  }, [visible]);

  const handleScan = async ({ data }: { data: string }) => {
    if (stage !== "scanning") return;
    clearScanTimeout();
    setStage("checking");

    const { data: result, error } = await supabase.rpc("find_ticket_by_qr", { p_qr_code: data });

    if (error || !result?.success) {
      setStage("not_found");
      setNotFoundMsg(result?.message ?? "No se encontró ningún evento con ese QR. Volvé a intentarlo.");
      return;
    }

    setFound({ event_id: result.event_id, event_number: result.event_number, event_label: result.event_label });
    setStage("found");
  };

  const handleGoToRitual = () => {
    if (!found) return;
    onClose();
    router.push(`/ritual/${found.event_id}` as any);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.title}>⚔ BUSCAR RITUAL POR QR ⚔</Text>
          <Text style={s.sub}>Mostrale a la cámara el QR de un ticket finalizado</Text>

          {stage === "idle" ? (
            <View style={s.centerBox}>
              <Text style={s.permTxt}>
                {!permission?.granted
                  ? "Necesitamos acceso a tu cámara para leer el QR."
                  : "Tocá para prender la cámara y empezar a escanear."}
              </Text>
              <TouchableOpacity style={s.actionBtn} onPress={handleActivateCamera}>
                <Text style={s.actionBtnTxt}>📷 ACTIVAR CÁMARA</Text>
              </TouchableOpacity>
            </View>
          ) : stage === "found" && found ? (
            <View style={s.centerBox}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🔮</Text>
              <Text style={[s.resultTxt, { color: C.ok }]}>
                Evento encontrado: Ritual #{found.event_number} — {found.event_label}
              </Text>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.amber, borderColor: C.amber, marginTop: 16 }]} onPress={handleGoToRitual}>
                <Text style={[s.actionBtnTxt, { color: "#000" }]}>IR →</Text>
              </TouchableOpacity>
            </View>
          ) : stage === "not_found" ? (
            <View style={s.centerBox}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>⚠</Text>
              <Text style={[s.resultTxt, { color: C.red }]}>{notFoundMsg}</Text>
              <TouchableOpacity style={s.actionBtn} onPress={handleActivateCamera}>
                <Text style={s.actionBtnTxt}>REINTENTAR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // stage === "scanning" | "checking" — acá SÍ existe <CameraView>,
            // recién montado por el click de handleActivateCamera.
            <View style={s.centerBox}>
              <View style={s.cameraWrap}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="front"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={stage === "scanning" ? handleScan : undefined}
                />
                <View style={s.scanFrame} />
                {stage === "checking" && (
                  <View style={s.checkingOverlay}>
                    <Text style={s.checkingTxt}>⏳ BUSCANDO...</Text>
                  </View>
                )}
              </View>
              <Text style={s.hintTxt}>Encuadrá el QR dentro del cuadrado — tenés 10 segundos</Text>
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeTxt}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", padding: 20 },
  box: { backgroundColor: C.ink, borderWidth: 2, borderColor: C.amber, padding: 20, alignItems: "center", width: "100%", maxWidth: 360 },
  title: { color: C.amber, fontFamily: MONO, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  sub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, textAlign: "center", marginTop: 6, marginBottom: 16 },
  cameraWrap: { width: 260, height: 260, backgroundColor: "#000", overflow: "hidden", position: "relative" },
  scanFrame: { position: "absolute", top: 30, left: 30, right: 30, bottom: 30, borderWidth: 3, borderColor: C.amber },
  hintTxt: { color: C.parchmentDim, fontFamily: MONO, fontSize: 9, textAlign: "center", marginTop: 10 },
  checkingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center" },
  checkingTxt: { color: C.amber, fontFamily: MONO, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  centerBox: { width: 260, alignItems: "center", paddingVertical: 10 },
  permTxt: { color: C.parchmentDim, fontFamily: MONO, fontSize: 11, textAlign: "center", marginBottom: 16, lineHeight: 16 },
  resultTxt: { fontFamily: MONO, fontSize: 12, textAlign: "center", lineHeight: 18, fontWeight: "700" },
  actionBtn: { marginTop: 8, borderWidth: 1.5, borderColor: C.amber, paddingHorizontal: 18, paddingVertical: 10 },
  actionBtnTxt: { color: C.amber, fontFamily: MONO, fontWeight: "900", fontSize: 11 },
  closeBtn: { marginTop: 18, borderWidth: 1.5, borderColor: C.red, paddingHorizontal: 24, paddingVertical: 10 },
  closeTxt: { color: C.red, fontFamily: MONO, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});