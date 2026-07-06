/**
 * components/TicketQrModal.web.tsx
 *
 * Versión SOLO WEB. En vez de react-native-qrcode-svg (SVG + puente
 * a PNG poco confiable en navegador — el archivo descargado salía
 * corrupto), acá se genera el QR directo como PNG con la librería
 * `qrcode` (hecha para esto en navegador), y la descarga es un link
 * <a download> normal — sin puentes raros de por medio.
 */
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = {
  ink: "#0a0000",
  red: "#ff0033",
  amber: "#ffb300",
  parchmentDim: "#a89472",
  muted: "#5a4040",
};
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

export type TicketQrData = { event_number: number; qr_code: string };

export function TicketQrModal({ visible, ticket, onClose }: { visible: boolean; ticket: TicketQrData | null; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !ticket) { setDataUrl(null); return; }
    QRCode.toDataURL(ticket.qr_code, { width: 300, margin: 2, color: { dark: "#000000", light: "#ffffff" } })
      .then(setDataUrl)
      .catch((e) => console.error("[TicketQrModal] Error generando QR:", e));
  }, [visible, ticket]);

  if (!ticket) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `ticket-${ticket.qr_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.title}>RITUAL #{ticket.event_number}</Text>
          <Text style={s.sub}>Guardá este QR — te va a servir para buscar este evento desde Home.</Text>

          <View style={s.qrWrap}>
            {dataUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              // @ts-ignore — <img> es un elemento DOM real, válido porque este archivo solo se bundlea para web
              <img src={dataUrl} width={200} height={200} alt="QR del ticket" />
            ) : (
              <Text style={{ color: C.muted, fontFamily: MONO, fontSize: 10 }}>Generando QR...</Text>
            )}
          </View>

          <Text style={s.idTxt} numberOfLines={1}>{ticket.qr_code}</Text>

          <TouchableOpacity onPress={handleDownload} disabled={!dataUrl} style={[s.closeBtn, { borderColor: C.amber, marginTop: 16, opacity: dataUrl ? 1 : 0.4 }]}>
            <Text style={[s.closeTxt, { color: C.amber }]}>⬇ DESCARGAR PNG</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeTxt}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 },
  box: { backgroundColor: C.ink, borderWidth: 2, borderColor: C.amber, padding: 24, alignItems: "center", width: "100%", maxWidth: 320 },
  title: { color: C.amber, fontFamily: MONO, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  sub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, textAlign: "center", marginTop: 6, marginBottom: 18 },
  qrWrap: { padding: 16, backgroundColor: "#fff", width: 232, height: 232, alignItems: "center", justifyContent: "center" },
  idTxt: { color: C.muted, fontFamily: MONO, fontSize: 8, marginTop: 14, maxWidth: 260 },
  closeBtn: { marginTop: 18, borderWidth: 1.5, borderColor: C.red, paddingHorizontal: 24, paddingVertical: 10 },
  closeTxt: { color: C.red, fontFamily: MONO, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});