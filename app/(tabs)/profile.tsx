/**
 * app/(tabs)/profile.tsx
 * Pantalla de perfil — wallet, tickets NFT reales, llaves anuales con QR.
 * 100% conectado a Supabase. Identidad = wallet_address directo.
 */
import { BuyTicketsModal } from "@/components/BuyTicketsModal";
import { TicketQrModal } from "@/components/TicketQrModal";
import { useWallet } from "@/contexts/wallet-context";
import { fmtSlp, usdToSlp, useSlpPrice } from "@/hooks/use-slp-price";
import { useWalletProfile } from "@/hooks/use-wallet-profile";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
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

// ── TIPOS ────────────────────────────────────────────────────────
type TicketRow = {
  id: string;
  qr_code: string;
  status: "vivo" | "usado" | "evento-finalizado";
  purchased_at: string;
  event_number: number;
  event_label: string;
};

type AnnualKeyRow = {
  id: string;
  year: number;
  status: "vivo" | "usado" | "quemada";
  minted_at: string;
};

type ActiveEvent = {
  id: string;
  event_number: number;
  status: string;
  ticket_price_usd: number;
};

type ShopItem = {
  id: string;
  type: "avatar" | "frame" | "banner";
  name: string;
  image_url: string;
  price_slp: number;
};

// ── HOOKS ───────────────────────────────────────────────────────
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

// ── PIXEL ART ───────────────────────────────────────────────────
function PixelWallet({ size = 60 }: { size?: number }) {
  const p = size / 10;
  const r = C.red; const d = C.redDark; const a = C.amber; const k = "transparent";
  const map = [
    [k,k,r,r,r,r,r,r,k,k],[k,r,d,d,d,d,d,d,r,k],[r,d,d,d,d,d,d,d,d,r],
    [r,d,a,a,k,k,a,a,d,r],[r,d,a,k,k,k,k,a,d,r],[r,d,a,a,k,k,a,a,d,r],
    [r,d,d,d,d,d,d,d,d,r],[r,d,d,r,r,r,r,d,d,r],[k,r,r,r,k,k,r,r,r,k],
    [k,k,k,k,k,k,k,k,k,k],
  ];
  return (
    <View style={{ width: size, height: size }}>
      {map.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}
        </View>
      ))}
    </View>
  );
}

function PixelTicket({ size = 56, dim = false }: { size?: number; dim?: boolean }) {
  const p = size / 8;
  const a = dim ? C.muted : C.amber; const d = dim ? C.muted : C.amberDim; const k = "transparent";
  const map = [
    [k,a,a,a,a,a,a,k],[a,d,d,d,d,d,d,a],[a,d,a,a,a,a,d,a],[k,d,a,k,k,a,d,k],
    [k,d,a,k,k,a,d,k],[a,d,a,a,a,a,d,a],[a,d,d,d,d,d,d,a],[k,a,a,a,a,a,a,k],
  ];
  return (
    <View style={{ width: size, height: size }}>
      {map.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}
        </View>
      ))}
    </View>
  );
}

function PixelKey({ size = 28 }: { size?: number }) {
  const p = size / 8;
  const a = C.amber; const d = C.amberDim; const k = "transparent";
  const map = [
    [k,k,a,a,k,k,k,k],[k,a,d,d,a,k,k,k],[k,a,d,d,a,k,k,k],[k,k,a,a,a,a,a,a],
    [k,k,k,k,a,k,k,a],[k,k,k,k,a,k,a,k],[k,k,k,k,a,k,k,a],[k,k,k,k,a,a,a,a],
  ];
  return (
    <View style={{ width: size, height: size }}>
      {map.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}
        </View>
      ))}
    </View>
  );
}

function PixelBag({ size = 64 }: { size?: number }) {
  const p = size / 8;
  const r = C.redDim; const d = C.redDark; const k = "transparent";
  const map = [
    [k,k,r,k,k,r,k,k],[k,k,r,k,k,r,k,k],[k,r,r,r,r,r,r,k],[r,d,r,d,d,r,d,r],
    [r,d,d,d,d,d,d,r],[r,d,d,r,r,d,d,r],[r,d,d,d,d,d,d,r],[k,r,r,r,r,r,r,k],
  ];
  return (
    <View style={{ width: size, height: size }}>
      {map.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}
        </View>
      ))}
    </View>
  );
}

// ── COMPONENTS BASE ─────────────────────────────────────────────
function HudBar({ address }: { address?: string | null }) {
  const blink = useBlink(700);
  return (
    <View style={hud.row}>
      <Text style={hud.hp}>HP <Text style={{ color: C.red }}>████░</Text> 1P</Text>
      <Animated.Text style={[hud.rec, { opacity: blink }]}>● PLAYER LOG</Animated.Text>
      <Text style={hud.hi}>{address ? "ONLINE" : "SLOT 01"}</Text>
    </View>
  );
}

function ArcadeButton({
  label, sub, onPress, color = "red", disabled = false, icon, loading = false,
}: {
  label: string; sub?: string; onPress?: () => void;
  color?: "red" | "amber" | "dark" | "green"; disabled?: boolean;
  icon?: React.ReactNode; loading?: boolean;
}) {
  const palette = {
    red:   { bg: C.red,      border: "#fff",      text: "#fff" },
    amber: { bg: C.amber,    border: "#000",      text: "#000" },
    dark:  { bg: "#1a0008",  border: C.redDark,   text: C.parchmentDim },
    green: { bg: C.ok,       border: "#000",      text: "#000" },
  }[color];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[btn.btn, { backgroundColor: palette.bg, borderColor: palette.border }, (disabled || loading) && { opacity: 0.5 }]}
    >
      {icon && <View style={btn.icon}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={[btn.label, { color: palette.text }]}>
          {loading ? "CONECTANDO..." : label}
        </Text>
        {sub && !loading && <Text style={[btn.sub, { color: palette.text }]}>{sub}</Text>}
      </View>
      <Text style={[btn.arrow, { color: palette.text }]}>
        {loading ? "◌" : "▸"}
      </Text>
    </TouchableOpacity>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <TouchableOpacity onPress={onDismiss} style={err.wrap}>
      <Text style={err.icon}>⚠</Text>
      <Text style={err.msg}>{message}</Text>
      <Text style={err.x}>✕</Text>
    </TouchableOpacity>
  );
}

function shortAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

// ── TICKET STATUS BADGE ─────────────────────────────────────────
function ticketStatusInfo(status: TicketRow["status"]) {
  if (status === "vivo") return { label: "VIVO", color: C.ok, desc: "Participa en sorteos" };
  if (status === "usado") return { label: "USADO", color: C.amber, desc: "Ya ganó una reward" };
  return { label: "EVENTO FINALIZADO", color: C.muted, desc: "Cuenta para Llave Anual" };
}

// ── TICKET CARD ──────────────────────────────────────────────────
function TicketCard({ ticket, onPressQr }: { ticket: TicketRow; onPressQr: () => void }) {
  const info = ticketStatusInfo(ticket.status);
  const canShowQr = ticket.status === "evento-finalizado";
  return (
    <View style={[tkc.card, { borderColor: info.color + "70" }]}>
      <View style={tkc.iconCol}>
        <PixelTicket size={36} dim={ticket.status !== "vivo"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tkc.eventName}>Ritual #{ticket.event_number} — {ticket.event_label}</Text>
        <Text style={tkc.qr}>{ticket.qr_code}</Text>
        <Text style={[tkc.statusTxt, { color: info.color }]}>● {info.label}</Text>
        <Text style={tkc.statusDesc}>{info.desc}</Text>
        {canShowQr && (
          <TouchableOpacity onPress={onPressQr} style={tkc.qrLink}>
            <Text style={tkc.qrLinkTxt}>▦ CLICK ACÁ PARA VER EL QR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const tkc = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, borderWidth: 1.5, backgroundColor: C.ink, padding: 10, marginBottom: 8, alignItems: "center" },
  iconCol: { width: 44, alignItems: "center" },
  eventName: { color: C.parchment, fontFamily: MONO, fontSize: 11, fontWeight: "700" },
  qr: { color: C.parchmentDim, fontFamily: MONO, fontSize: 9, marginTop: 2 },
  statusTxt: { fontFamily: MONO, fontSize: 9, fontWeight: "900", marginTop: 4, letterSpacing: 0.5 },
  statusDesc: { color: C.muted, fontFamily: MONO, fontSize: 8, marginTop: 1 },
  qrLink: { marginTop: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: C.amber, paddingHorizontal: 8, paddingVertical: 4 },
  qrLinkTxt: { color: C.amber, fontFamily: MONO, fontSize: 9, fontWeight: "900" },
});

// ── ANNUAL KEY CARD + QR MODAL ──────────────────────────────────
function AnnualKeyCard({ keyRow, onPressQr }: { keyRow: AnnualKeyRow; onPressQr: () => void }) {
  const isUsed = keyRow.status !== "vivo";
  return (
    <View style={[kc.card, { borderColor: isUsed ? C.muted : C.amber }]}>
      <View style={kc.iconCol}>
        <PixelKey size={26} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={kc.title}>LLAVE ANUAL {keyRow.year}</Text>
        <Text style={[kc.status, { color: isUsed ? C.muted : C.ok }]}>
          {isUsed ? `● ${keyRow.status.toUpperCase()}` : "● LISTA PARA USAR"}
        </Text>
      </View>
      <TouchableOpacity onPress={onPressQr} style={kc.qrBtn} disabled={isUsed}>
        <Text style={[kc.qrBtnTxt, isUsed && { opacity: 0.4 }]}>▦ QR</Text>
      </TouchableOpacity>
    </View>
  );
}
const kc = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, borderWidth: 1.5, backgroundColor: C.ink, padding: 10, marginBottom: 8, alignItems: "center" },
  iconCol: { width: 36, alignItems: "center" },
  title: { color: C.amber, fontFamily: MONO, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  status: { fontFamily: MONO, fontSize: 9, fontWeight: "700", marginTop: 3 },
  qrBtn: { borderWidth: 1.5, borderColor: C.amber, paddingHorizontal: 10, paddingVertical: 8 },
  qrBtnTxt: { color: C.amber, fontFamily: MONO, fontSize: 11, fontWeight: "900" },
});

function KeyQrModal({ visible, keyRow, onClose }: { visible: boolean; keyRow: AnnualKeyRow | null; onClose: () => void }) {
  if (!keyRow) return null;
  // El QR codifica el ID de la llave — esto es lo que /special va a leer
  // para "consumirla" en el evento anual.
  const qrValue = `FYNOLTS-ANNUAL-KEY:${keyRow.id}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={qm.overlay}>
        <View style={qm.box}>
          <Text style={qm.title}>LLAVE ANUAL {keyRow.year}</Text>
          <Text style={qm.sub}>Mostrá este QR en el Evento Anual para participar</Text>

          <View style={qm.qrWrap}>
            <QRCode value={qrValue} size={200} backgroundColor="#fff" color="#000" />
          </View>

          <Text style={qm.idTxt} numberOfLines={1}>{keyRow.id}</Text>

          <TouchableOpacity onPress={onClose} style={qm.closeBtn}>
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
  qrWrap: { padding: 16, backgroundColor: "#fff" },
  idTxt: { color: C.muted, fontFamily: MONO, fontSize: 8, marginTop: 14, maxWidth: 260 },
  closeBtn: { marginTop: 18, borderWidth: 1.5, borderColor: C.red, paddingHorizontal: 24, paddingVertical: 10 },
  closeTxt: { color: C.red, fontFamily: MONO, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});

// ── AVATAR (tocable) ─────────────────────────────────────────────
function ProfileAvatar({ avatarUrl, onPress }: { avatarUrl: string | null; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={av.wrap}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={av.img} />
      ) : (
        <PixelWallet size={56} />
      )}
      <View style={av.editBadge}>
        <Text style={av.editBadgeTxt}>✎</Text>
      </View>
    </TouchableOpacity>
  );
}
const av = StyleSheet.create({
  wrap: { width: 64, height: 64, position: "relative" },
  img: { width: 64, height: 64, backgroundColor: "#000" },
  editBadge: { position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: C.amber, borderWidth: 2, borderColor: C.ink, alignItems: "center", justifyContent: "center" },
  editBadgeTxt: { color: "#000", fontSize: 11, fontWeight: "900" },
});

// ── AVATAR PICKER MODAL ──────────────────────────────────────────
function AvatarPickerModal({
  visible, onClose, currentAvatarId, address, onSaved,
}: {
  visible: boolean; onClose: () => void; currentAvatarId: string | null;
  address: string; onSaved: () => void;
}) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    supabase
      .from("shop_items")
      .select("id, type, name, image_url, price_slp")
      .eq("type", "avatar")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, [visible]);

  const handleSelect = async (item: ShopItem) => {
    setSaving(item.id);
    const { error } = await supabase.rpc("upsert_profile", {
      p_wallet_address: address,
      p_avatar_item_id: item.id,
    });
    setSaving(null);
    if (!error) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={qm.overlay}>
        <View style={[qm.box, { maxWidth: 360 }]}>
          <Text style={qm.title}>ELEGIR AVATAR</Text>
          <Text style={qm.sub}>Tocá uno para usarlo en tu perfil</Text>

          {loading ? (
            <Text style={{ color: C.parchmentDim, fontFamily: MONO, fontSize: 11, marginVertical: 20 }}>
              Cargando avatares...
            </Text>
          ) : (
            <View style={ap.grid}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  disabled={saving === item.id}
                  style={[ap.cell, item.id === currentAvatarId && ap.cellSelected]}
                >
                  <Image source={{ uri: item.image_url }} style={ap.cellImg} />
                  {item.id === currentAvatarId && (
                    <View style={ap.cellCheck}><Text style={ap.cellCheckTxt}>✓</Text></View>
                  )}
                  {saving === item.id && (
                    <View style={ap.cellLoading}><Text style={{ color: C.amber, fontSize: 10 }}>...</Text></View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={[qm.closeBtn, { marginTop: 18 }]}>
            <Text style={qm.closeTxt}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const ap = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 6 },
  cell: { width: 64, height: 64, borderWidth: 2, borderColor: C.redDark, position: "relative" },
  cellSelected: { borderColor: C.amber },
  cellImg: { width: "100%", height: "100%", backgroundColor: "#000" },
  cellCheck: { position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.ok, alignItems: "center", justifyContent: "center" },
  cellCheckTxt: { color: "#000", fontSize: 10, fontWeight: "900" },
  cellLoading: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
});

// ── EDITOR DE NOMBRE ──────────────────────────────────────────────
function NameEditor({ value, address, onSaved }: { value: string | null; address: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) { setEditing(false); return; }
    setSaving(true);
    const { error } = await supabase.rpc("upsert_profile", {
      p_wallet_address: address,
      p_display_name: trimmed,
    });
    setSaving(false);
    setEditing(false);
    if (!error) onSaved();
  };

  if (editing) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Tu nombre..."
          placeholderTextColor={C.muted}
          maxLength={24}
          autoFocus
          style={ne.input}
          onSubmitEditing={handleSave}
        />
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={ne.saveTxt}>{saving ? "..." : "✓"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
      <Text style={ne.nameTxt}>{value || "TOCÁ PARA PONERTE UN NOMBRE"} <Text style={ne.pencil}>✎</Text></Text>
    </TouchableOpacity>
  );
}
const ne = StyleSheet.create({
  nameTxt: { color: C.parchment, fontFamily: MONO, fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  pencil: { color: C.amber, fontSize: 13 },
  input: { flex: 1, borderWidth: 1.5, borderColor: C.amber, color: C.parchment, fontFamily: MONO, fontSize: 14, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#000" },
  saveTxt: { color: C.ok, fontSize: 20, fontWeight: "900" },
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

// ── SCREEN ──────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { address, isConnecting, isVerifying, isAuthenticated, error, connectAndAuthenticate, disconnect, clearError } = useWallet();
  const { price: slpPrice } = useSlpPrice();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useWalletProfile(address);

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [annualKeys, setAnnualKeys] = useState<AnnualKeyRow[]>([]);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [selectedKey, setSelectedKey] = useState<AnnualKeyRow | null>(null);
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<TicketRow | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const isConnected = isAuthenticated && !!address;
  const isLoading = isConnecting || isVerifying;

  const loadProfileData = useCallback(async () => {
    if (!address) {
      setTickets([]);
      setAnnualKeys([]);
      return;
    }

    const { data: ticketsData } = await supabase
      .from("tickets")
      .select("id, qr_code, status, purchased_at, events(event_number, label)")
      .eq("wallet_address", address)
      .order("purchased_at", { ascending: false });

    if (ticketsData) {
      setTickets(
        ticketsData.map((t: any) => ({
          id: t.id,
          qr_code: t.qr_code,
          status: t.status,
          purchased_at: t.purchased_at,
          event_number: t.events?.event_number ?? 0,
          event_label: t.events?.label ?? "—",
        }))
      );
    }

    const { data: keysData } = await supabase
      .from("annual_keys")
      .select("id, year, status, minted_at")
      .eq("owner_wallet", address)
      .order("minted_at", { ascending: false });

    setAnnualKeys(keysData ?? []);

    const { data: eventData } = await supabase
      .from("events")
      .select("id, event_number, status, ticket_price_usd")
      .eq("status", "activo")
      .limit(1)
      .maybeSingle();

    setActiveEvent(eventData ?? null);
  }, [address]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Recarga cada vez que volvés a esta pantalla (tickets, llaves, perfil).
  useFocusEffect(useCallback(() => {
    loadProfileData();
    refetchProfile();
  }, [loadProfileData, refetchProfile]));

  const handleLogin = async () => { await connectAndAuthenticate(); };
  const handleLogout = () => { disconnect(); };

  const currentYear = new Date().getFullYear();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HudBar address={address} />

        {error && <ErrorBanner message={error} onDismiss={clearError} />}

        {/* Player card */}
        <View style={card.playerWrap}>
          <View style={card.idStrip}>
            <Text style={card.idStripTxt}>★ PLAYER 1 ★</Text>
            <Text style={card.idStripCode}>{isConnected ? "AUTENTICADO" : "ID :: GUEST-00"}</Text>
          </View>

          <View style={card.playerBody}>
            <ProfileAvatar
              avatarUrl={profile?.avatar_url ?? null}
              onPress={() => isConnected && setAvatarPickerOpen(true)}
            />
            <View style={{ flex: 1 }}>
              {isConnected ? (
                <NameEditor value={profile?.display_name ?? null} address={address!} onSaved={refetchProfile} />
              ) : (
                <Text style={card.playerName}>NO CONECTADO</Text>
              )}
              <Text style={card.playerSub}>{isConnected ? address : "Conectá tu Ronin para empezar"}</Text>
              <View style={card.statusRow}>
                <View style={[card.statusDot, { backgroundColor: isConnected ? C.ok : C.redDim }]} />
                <Text style={[card.statusTxt, { color: isConnected ? C.ok : C.parchmentDim }]}>
                  {isConnected ? "ONLINE · RONIN" : "OFFLINE"}
                </Text>
              </View>
            </View>
          </View>

          <View style={card.connectWrap}>
            {isConnected ? (
              <ArcadeButton label="DESCONECTAR" sub="Cerrar sesión" color="dark" icon={<Text style={btn.iconTxt}>◈</Text>} onPress={handleLogout} />
            ) : (
              <ArcadeButton label="INSERT WALLET" sub="Conectar y firmar con Ronin" color="red" icon={<Text style={btn.iconTxt}>◈</Text>} onPress={handleLogin} loading={isLoading} />
            )}
          </View>
        </View>

        {isVerifying && (
          <Text style={{ color: C.amber, fontFamily: MONO, fontSize: 10, textAlign: "center", marginTop: -8, marginBottom: 12, letterSpacing: 1 }}>
            ⚠ FIRMÁ EL MENSAJE EN TU WALLET PARA CONTINUAR
          </Text>
        )}

        {/* Comprar tickets */}
        {isConnected && (
          <>
            <View style={styles.sectionHead}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>EVENTO ACTIVO</Text>
              <View style={styles.sectionLine} />
            </View>

            {activeEvent ? (
              <View style={tk.panel}>
                <View style={tk.tape}>
                  <Text style={tk.tapeTxt}>▸ RITUAL #{activeEvent.event_number}</Text>
                  <Text style={tk.tapeMonth}>VENTA ABIERTA</Text>
                </View>
                <View style={{ padding: 14 }}>
                  <ArcadeButton
                    label="COMPRAR TICKET(S)"
                    sub={`${fmtSlp(usdToSlp(activeEvent.ticket_price_usd, slpPrice))} SLP c/u · elegí la cantidad`}
                    color="amber"
                    icon={<PixelTicket size={28} />}
                    onPress={() => setBuyModalOpen(true)}
                  />
                </View>
              </View>
            ) : (
              <View style={[tk.panel, { padding: 14 }]}>
                <Text style={{ color: C.parchmentDim, fontFamily: MONO, fontSize: 11, textAlign: "center" }}>
                  No hay ningún ritual activo ahora mismo.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Mis Tickets */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>MIS TICKETS</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionCount}>{String(tickets.length).padStart(2, "0")}</Text>
        </View>

        {!isConnected ? (
          <View style={bag.panel}>
            <View style={bag.emptyMsg}>
              <PixelBag size={48} />
              <Text style={bag.emptyTxt}>CONECTÁ TU WALLET</Text>
              <Text style={bag.emptySub}>Para ver tus tickets acá</Text>
            </View>
          </View>
        ) : tickets.length === 0 ? (
          <View style={bag.panel}>
            <View style={bag.emptyMsg}>
              <PixelBag size={48} />
              <Text style={bag.emptyTxt}>SIN TICKETS TODAVÍA</Text>
              <Text style={bag.emptySub}>Comprá uno arriba cuando haya un ritual activo</Text>
            </View>
          </View>
        ) : (
          <View>
            {tickets.map(t => <TicketCard key={t.id} ticket={t} onPressQr={() => setSelectedTicketForQr(t)} />)}
          </View>
        )}

        {/* Mis Llaves */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>MIS LLAVES ANUALES</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionCount}>{String(annualKeys.length).padStart(2, "0")}</Text>
        </View>

        {!isConnected ? (
          <View style={bag.panel}>
            <View style={bag.emptyMsg}>
              <PixelKey size={40} />
              <Text style={bag.emptyTxt}>CONECTÁ TU WALLET</Text>
            </View>
          </View>
        ) : annualKeys.length === 0 ? (
          <View style={mint.panel}>
            <View style={mint.row}>
              <PixelKey size={36} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={mint.title}>SIN LLAVES TODAVÍA</Text>
                <Text style={mint.sub}>
                  Juntá 12 tickets en estado "evento-finalizado", uno de cada mes del {currentYear}, para mintear tu llave desde acá.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            {annualKeys.map(k => (
              <AnnualKeyCard key={k.id} keyRow={k} onPressQr={() => setSelectedKey(k)} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <KeyQrModal visible={!!selectedKey} keyRow={selectedKey} onClose={() => setSelectedKey(null)} />
      <TicketQrModal visible={!!selectedTicketForQr} ticket={selectedTicketForQr} onClose={() => setSelectedTicketForQr(null)} />

      {address && (
        <AvatarPickerModal
          visible={avatarPickerOpen}
          onClose={() => setAvatarPickerOpen(false)}
          currentAvatarId={profile?.avatar_id ?? null}
          address={address}
          onSaved={refetchProfile}
        />
      )}

      {activeEvent && address && (
        <BuyTicketsModal
          visible={buyModalOpen}
          onClose={() => setBuyModalOpen(false)}
          activeEvent={activeEvent}
          address={address}
          slpPrice={slpPrice}
          onBought={loadProfileData}
        />
      )}
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16, paddingTop: 8, paddingBottom: 60 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 10, gap: 8 },
  sectionDot: { width: 8, height: 8, backgroundColor: C.red },
  sectionTitle: { color: C.parchment, fontFamily: MONO, fontSize: 12, letterSpacing: 2, fontWeight: "700" },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.redDark },
  sectionCount: { color: C.amber, fontFamily: MONO, fontSize: 11, letterSpacing: 1.5 },
});

const hud = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.redDark, marginBottom: 12 },
  hp: { color: C.parchment, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
  rec: { color: C.red, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5 },
  hi: { color: C.amber, fontFamily: MONO, fontSize: 10, letterSpacing: 1.2 },
});

const card = StyleSheet.create({
  playerWrap: { borderWidth: 2, borderColor: C.red, backgroundColor: C.ink },
  idStrip: { flexDirection: "row", justifyContent: "space-between", backgroundColor: C.red, paddingHorizontal: 12, paddingVertical: 6 },
  idStripTxt: { color: "#fff", fontFamily: MONO, fontSize: 11, letterSpacing: 3, fontWeight: "900" },
  idStripCode: { color: "#fff", fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, fontWeight: "700" },
  playerBody: { flexDirection: "row", padding: 16, alignItems: "center", gap: 14 },
  avatar: { borderWidth: 2, borderColor: C.redDark, padding: 6, backgroundColor: "#000" },
  playerName: { color: C.parchment, fontFamily: MONO, fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  playerSub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, marginTop: 4, flexShrink: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  statusDot: { width: 8, height: 8 },
  statusTxt: { fontFamily: MONO, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  connectWrap: { padding: 12, paddingTop: 0 },
});

const btn = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", borderWidth: 2, paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  icon: { width: 32, alignItems: "center" },
  iconTxt: { color: "#fff", fontFamily: MONO, fontSize: 20, fontWeight: "900" },
  label: { fontFamily: MONO, fontSize: 14, letterSpacing: 2, fontWeight: "900" },
  sub: { fontFamily: MONO, fontSize: 10, letterSpacing: 0.5, marginTop: 2, opacity: 0.85 },
  arrow: { fontFamily: MONO, fontSize: 18, fontWeight: "900" },
});

const tk = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.amber, backgroundColor: C.ink },
  tape: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#1a1100", paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.amberDim },
  tapeTxt: { color: C.amber, fontFamily: MONO, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  tapeMonth: { color: C.parchment, fontFamily: MONO, fontSize: 11, letterSpacing: 2 },
});

const bag = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.redDark, backgroundColor: C.ink, padding: 14 },
  emptyMsg: { alignItems: "center", paddingVertical: 10 },
  emptyTxt: { color: C.parchment, fontFamily: MONO, fontSize: 13, letterSpacing: 3, fontWeight: "900", marginTop: 10 },
  emptySub: { color: C.muted, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5, marginTop: 4, textAlign: "center" },
});

const mint = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: C.redDark, backgroundColor: C.ink, padding: 14 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  title: { color: C.parchment, fontFamily: MONO, fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
  sub: { color: C.parchmentDim, fontFamily: MONO, fontSize: 10, marginTop: 6, lineHeight: 15 },
});

const err = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1a0008", borderLeftWidth: 3, borderLeftColor: C.red, padding: 10, marginBottom: 12 },
  icon: { color: C.red, fontFamily: MONO, fontSize: 14, fontWeight: "900" },
  msg: { flex: 1, color: C.parchment, fontFamily: MONO, fontSize: 11, lineHeight: 16 },
  x: { color: C.redDim, fontFamily: MONO, fontSize: 12 },
});