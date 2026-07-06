/**
 * components/TicketQrModal.tsx
 *
 * Modal que muestra el QR de un ticket finalizado, con botón de
 * descarga. Esta es la versión NATIVA (celular) — usa
 * react-native-qrcode-svg, que en nativo sí funciona bien.
 *
 * En web se usa TicketQrModal.web.tsx en su lugar (Expo elige el
 * archivo automáticamente según la plataforma) — ahí no se usa esta
 * librería porque su export a PNG es poco confiable en navegador.
 */
import { useRef } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

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
  const qrRef = useRef<any>(null);

  if (!ticket) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.title}>RITUAL #{ticket.event_number}</Text>
          <Text style={s.sub}>Guardá este QR — te va a servir para buscar este evento desde Home.</Text>

          <View style={s.qrWrap}>
            <QRCode value={ticket.qr_code} size={200} backgroundColor="#fff" color="#000" getRef={(c) => (qrRef.current = c)} />
          </View>

          <Text style={s.idTxt} numberOfLines={1}>{ticket.qr_code}</Text>

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
  qrWrap: { padding: 16, backgroundColor: "#fff" },
  idTxt: { color: C.muted, fontFamily: MONO, fontSize: 8, marginTop: 14, maxWidth: 260 },
  closeBtn: { marginTop: 18, borderWidth: 1.5, borderColor: C.red, paddingHorizontal: 24, paddingVertical: 10 },
  closeTxt: { color: C.red, fontFamily: MONO, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});