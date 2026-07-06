/**
 * components/BuyTicketsModal.tsx
 *
 * Modal de compra de tickets — compartido entre /profile y /milestone.
 * Es EL MISMO componente en los dos lugares a propósito: si algún día
 * cambia el flujo de compra, se cambia en un solo archivo.
 */
import { fmtSlp, usdToSlp } from "@/hooks/use-slp-price";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  ink: "#0a0000",
  red: "#ff0033",
  redDark: "#3a0510",
  amber: "#ffb300",
  parchment: "#f6e6c2",
  parchmentDim: "#a89472",
  muted: "#5a4040",
  ok: "#00ff66",
};
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

export type BuyTicketsActiveEvent = {
  id: string;
  ticket_price_usd: number;
};

function ConfirmButton({ label, sub, loading, onPress }: { label: string; sub?: string; loading?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={[cb.btn, loading && { opacity: 0.5 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={cb.label}>{loading ? "COMPRANDO..." : label}</Text>
        {sub && !loading && <Text style={cb.sub}>{sub}</Text>}
      </View>
      <Text style={cb.arrow}>{loading ? "◌" : "▸"}</Text>
    </TouchableOpacity>
  );
}
const cb = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", backgroundColor: C.red, borderWidth: 2, borderColor: "#fff", paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  label: { color: "#fff", fontFamily: MONO, fontSize: 14, letterSpacing: 2, fontWeight: "900" },
  sub: { color: "#fff", fontFamily: MONO, fontSize: 10, letterSpacing: 0.5, marginTop: 2, opacity: 0.85 },
  arrow: { color: "#fff", fontFamily: MONO, fontSize: 18, fontWeight: "900" },
});

export function BuyTicketsModal({
  visible, onClose, activeEvent, address, slpPrice, onBought,
}: {
  visible: boolean; onClose: () => void; activeEvent: BuyTicketsActiveEvent;
  address: string; slpPrice: number; onBought: () => void;
}) {
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const qtyNum = Math.max(1, Math.min(1000, parseInt(qty || "1", 10) || 1));
  const totalUsd = activeEvent.ticket_price_usd * qtyNum;
  const totalSlp = usdToSlp(totalUsd, slpPrice);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Un solo viaje a la base para todos los tickets — la función
      // consulta el precio de SLP UNA vez, no una por ticket. Por eso
      // comprar 1000 de una anda bien en vez de sentirse "colgado".
      const slpForThisTicket = usdToSlp(activeEvent.ticket_price_usd, slpPrice);
      const { error: rpcError } = await supabase.rpc("buy_tickets_bulk", {
        p_event_id: activeEvent.id,
        p_wallet_address: address,
        p_qty: qtyNum,
        p_paid_slp_per_ticket: slpForThisTicket,
        p_tx_hash_prefix: "SIM-TX-" + Date.now(),
      });
      if (rpcError) throw rpcError;

      setSuccess(`✓ ${qtyNum} ticket${qtyNum > 1 ? "s" : ""} comprado${qtyNum > 1 ? "s" : ""} con éxito.`);
      onBought();
    } catch (e: any) {
      setError(e?.message ?? "Error al comprar el ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={qm.overlay}>
        <View style={[qm.box, { borderColor: C.red }]}>
          <Text style={[qm.title, { color: C.red }]}>COMPRAR TICKETS</Text>
          <Text style={qm.sub}>Elegí cuántos tickets querés comprar</Text>

          <View style={bm.qtyRow}>
            <TouchableOpacity style={bm.qtyBtn} onPress={() => setQty(String(qtyNum - 1))} disabled={qtyNum <= 1}>
              <Text style={bm.qtyBtnTxt}>−</Text>
            </TouchableOpacity>
            <TextInput
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
              style={bm.qtyInput}
              maxLength={4}
            />
            <TouchableOpacity style={bm.qtyBtn} onPress={() => setQty(String(qtyNum + 1))} disabled={qtyNum >= 50}>
              <Text style={bm.qtyBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={bm.totalBox}>
            <Text style={bm.totalLabel}>TOTAL A PAGAR</Text>
            <Text style={bm.totalSlp}>{fmtSlp(totalSlp)} SLP</Text>
            <Text style={bm.totalUsd}>(~${totalUsd.toFixed(2)} USD)</Text>
          </View>

          {error && <Text style={bm.errorTxt}>{error}</Text>}
          {success && <Text style={bm.successTxt}>{success}</Text>}

          <View style={{ width: "100%", marginTop: 16 }}>
            <ConfirmButton
              label="CONFIRMAR COMPRA"
              sub="Simulado — sin transacción on-chain real todavía"
              loading={loading}
              onPress={handleBuy}
            />
          </View>

          <TouchableOpacity onPress={onClose} style={[qm.closeBtn, { marginTop: 10 }]}>
            <Text style={qm.closeTxt}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const qm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 },
  box: { backgroundColor: C.ink, borderWidth: 2, borderColor: C.amber, padding: 24, alignItems: "center", width: "100%", maxWidth: 320 },
  title: { color: C.amber, fontFamily: MONO, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  sub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, textAlign: "center", marginTop: 6, marginBottom: 18 },
  closeBtn: { marginTop: 18, borderWidth: 1.5, borderColor: C.red, paddingHorizontal: 24, paddingVertical: 10 },
  closeTxt: { color: C.red, fontFamily: MONO, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});

const bm = StyleSheet.create({
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  qtyBtn: { width: 40, height: 40, borderWidth: 1.5, borderColor: C.red, alignItems: "center", justifyContent: "center" },
  qtyBtnTxt: { color: C.red, fontSize: 20, fontWeight: "900" },
  qtyInput: { width: 60, height: 40, borderWidth: 1.5, borderColor: C.parchmentDim, color: C.parchment, fontFamily: MONO, fontSize: 18, textAlign: "center", fontWeight: "900" },
  totalBox: { alignItems: "center", borderWidth: 1, borderColor: C.amber + "50", padding: 12, width: "100%" },
  totalLabel: { color: C.muted, fontFamily: MONO, fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
  totalSlp: { color: C.amber, fontFamily: MONO, fontSize: 20, fontWeight: "900" },
  totalUsd: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, marginTop: 2 },
  errorTxt: { color: C.red, fontFamily: MONO, fontSize: 10, marginTop: 12, textAlign: "center" },
  successTxt: { color: C.ok, fontFamily: MONO, fontSize: 10, marginTop: 12, textAlign: "center" },
});