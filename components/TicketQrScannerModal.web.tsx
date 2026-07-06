/**
 * components/TicketQrScannerModal.web.tsx
 *
 * Versión SOLO PARA WEB de este modal. Expo/Metro elige este archivo
 * automáticamente en el navegador (por el sufijo .web.tsx) — en
 * celular se sigue usando TicketQrScannerModal.tsx (expo-camera).
 *
 * Por qué existe este archivo aparte: expo-camera tiene un bug
 * conocido y sin arreglo consistente en web — el permiso se concede
 * (el navegador muestra el círculo de "grabando") pero el video
 * nunca se pinta, queda todo negro. En vez de pelear con eso, acá
 * hablamos directo con la cámara usando las APIs nativas del
 * navegador (getUserMedia) + jsQR para decodificar cada cuadro —
 * mismo resultado, sin el bug.
 */
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = {
  ink: "#0a0000",
  red: "#ff0033",
  amber: "#ffb300",
  parchmentDim: "#a89472",
  ok: "#00ff66",
};
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const SCAN_TIMEOUT_MS = 10000;

type FoundEvent = { event_id: string; event_number: number; event_label: string };
type Stage = "idle" | "scanning" | "checking" | "found" | "not_found";

export function TicketQrScannerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [found, setFound] = useState<FoundEvent | null>(null);
  const [notFoundMsg, setNotFoundMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageRef = useRef<Stage>("idle"); // para leer el stage actual dentro del loop de rAF sin re-crear el loop

  useEffect(() => { stageRef.current = stage; }, [stage]);

  const stopCamera = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  };

  useEffect(() => {
    if (!visible) {
      stopCamera();
      setStage("idle");
      setFound(null);
      setNotFoundMsg(null);
    }
    return () => stopCamera();
  }, [visible]);

  const handleFound = async (qrData: string) => {
    stopCamera();
    setStage("checking");

    const { data: result, error } = await supabase.rpc("find_ticket_by_qr", { p_qr_code: qrData });

    if (error || !result?.success) {
      setNotFoundMsg(result?.message ?? "No se encontró ningún evento con ese QR. Volvé a intentarlo.");
      setStage("not_found");
      return;
    }

    setFound({ event_id: result.event_id, event_number: result.event_number, event_label: result.event_label });
    setStage("found");
  };

  const frameCountRef = useRef(0);

  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (stageRef.current === "scanning" && video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      // Recortamos al mismo cuadrado centrado que se ve en pantalla
      // (la vista previa usa objectFit:cover, que ya hace este recorte
      // visualmente) — así el QR ocupa la imagen entera que analiza
      // jsQR, en vez de quedar chiquito dentro del panorama completo
      // de la cámara.
      const size = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        frameCountRef.current++;
        if (frameCountRef.current % 60 === 0) {
          console.log(`[TicketQrScannerModal] escaneando... recorte ${size}x${size}, frame #${frameCountRef.current}`);
        }
        if (code?.data) {
          console.log("[TicketQrScannerModal] QR detectado:", code.data);
          handleFound(code.data);
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  // El <video> recién existe en el DOM una vez que stage === "scanning"
  // (React tiene que renderizarlo primero). Por eso conectamos el stream
  // acá, reaccionando al cambio de stage, en vez de hacerlo justo después
  // de pedir la cámara — en ese momento el <video> todavía no existe.
  useEffect(() => {
    if (stage === "scanning" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [stage]);

  const handleActivateCamera = async () => {
    setFound(null);
    setNotFoundMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setStage("scanning");
      rafRef.current = requestAnimationFrame(tick);
      timeoutRef.current = setTimeout(() => {
        stopCamera();
        setNotFoundMsg("No se encontró ningún evento a tiempo. La cámara se cerró sola — volvé a intentarlo.");
        setStage("not_found");
      }, SCAN_TIMEOUT_MS);
    } catch (e: any) {
      console.error("[TicketQrScannerModal] getUserMedia falló:", e);
      const detail = e?.name ? `${e.name}: ${e.message ?? ""}` : String(e);
      setNotFoundMsg(
        `No pudimos acceder a tu cámara.\n\nDetalle real: ${detail}\n\n` +
        `Causas típicas: otra pestaña/app (Zoom, la cámara de Windows, otra ventana de esta misma app) está usando la cámara ahora mismo — cerrala e intentá de nuevo.`
      );
      setStage("not_found");
    }
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
              <Text style={s.permTxt}>Tocá para prender la cámara y empezar a escanear.</Text>
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
            <View style={s.centerBox}>
              <View style={s.cameraWrap}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                {/* @ts-ignore — <video>/<canvas> son elementos DOM reales, válidos porque este archivo solo se bundlea para web */}
                <video
                  ref={videoRef as any}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                />
                {/* @ts-ignore */}
                <canvas ref={canvasRef as any} style={{ display: "none" }} />
                <View style={s.scanFrame} pointerEvents="none" />
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