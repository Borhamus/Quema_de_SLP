/**
 * app/test.tsx
 *
 * PANEL DE TEST — QA manual, separado del sistema automático real.
 *
 * Slider de 5 estados: PREVIO → ACTIVO → SWAP → SORTEANDO → COMPLETADO
 * Cada estado muestra los botones de las acciones que un usuario
 * (o el sistema) podría hacer en esa etapa exacta — reutilizando
 * las MISMAS funciones SQL que usa el cron automático real
 * (11_sistema_automatico.sql), así lo que se prueba acá es 100%
 * fiel a lo que pasa en producción.
 *
 * Este panel NUNCA reemplaza al sistema automático — es solo para
 * que vos puedas pararte en cualquier punto del ciclo y probar
 * todo lo que la app le permite hacer a un usuario ahí.
 */

import { BuyTicketsModal } from "@/components/BuyTicketsModal";
import { CooldownAxiePickerModal, CooldownOfferModal } from "@/components/CooldownModal";
import { HScroller } from "@/components/HScroller";
import { ThemedText } from "@/components/themed-text";
import { useTestMode } from "@/contexts/test-mode-context";
import { useWallet } from "@/contexts/wallet-context";
import { fmtSlp, usdToSlp, useSlpPrice } from "@/hooks/use-slp-price";
import { Axie, getAxiesForWallet } from "@/lib/axie-service";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#000", surface: "#0b0000", border: "#2a0000", borderMid: "#550000",
  crimson: "#CC0000", ember: "#FF6600", gold: "#D4A017", green: "#4a7c3f",
  greenBrt: "#6abf5e", slate: "#5a5a6a", parchment: "#C8BEB0", purple: "#6b1f8f",
};

// ── ESTADOS DEL SLIDER ────────────────────────────────────────────
const STATES = [
  { key: "previo",     label: "PREVIO",     color: C.slate,    desc: "Configurado, venta sin abrir" },
  { key: "activo",     label: "ACTIVO",     color: C.gold,     desc: "Venta de tickets abierta (72hs)" },
  { key: "swap",       label: "SWAP",       color: C.purple,   desc: "Ventana de intercambio (24hs)" },
  { key: "sorteando",  label: "SORTEANDO",  color: C.ember,    desc: "Cierre: sorteos + quema + liberación" },
  { key: "completado", label: "COMPLETADO", color: C.greenBrt, desc: "Cerrado — va al histórico" },
] as const;
type StateKey = typeof STATES[number]["key"];

// ── RPC HELPER ─────────────────────────────────────────────────
function useRpcAction<TArgs extends Record<string, any>>(fnName: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (args?: TArgs) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const { data, error: rpcError } = await supabase.rpc(fnName, args ?? {});
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      console.error(`[Test/${fnName}]`, rpcError);
    } else {
      setResult(data);
    }
    return { data, error: rpcError };
  }, [fnName]);

  return { run, loading, result, error };
}

// ── UI BASE ───────────────────────────────────────────────────
function ActionButton({ label, description, icon, onPress, loading, color = C.crimson, disabled }: { label: string; description?: string; icon?: string; onPress: () => void; loading?: boolean; color?: string; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[btn.btn, { borderColor: color }, (loading || disabled) && { opacity: 0.4 }]}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
        <View style={{ flex: 1 }}>
          <Text style={[btn.txt, { color }]}>{loading ? "EJECUTANDO..." : label}</Text>
          {description && !loading && <Text style={btn.desc}>{description}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}
const btn = StyleSheet.create({
  btn: { borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 14 },
  txt: { fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  desc: { color: C.slate, fontSize: 9, marginTop: 2, lineHeight: 12 },
});

function TestInput({ value, onChangeText, placeholder, keyboardType }: { value: string; onChangeText: (t: string) => void; placeholder: string; keyboardType?: "default" | "numeric" }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.slate} keyboardType={keyboardType} style={inp.input} />;
}
const inp = StyleSheet.create({ input: { borderWidth: 1, borderColor: C.borderMid, color: C.parchment, padding: 10, fontSize: 12, backgroundColor: "#000" } });

function ResultBox({ result, error }: { result: any; error: string | null }) {
  if (!result && !error) return null;
  return (
    <View style={[res.box, { borderColor: error ? C.crimson : C.greenBrt }]}>
      <ThemedText style={[res.txt, { color: error ? C.crimson : C.greenBrt }]} numberOfLines={10}>
        {error ?? JSON.stringify(result, null, 2)}
      </ThemedText>
    </View>
  );
}
const res = StyleSheet.create({ box: { borderWidth: 1, padding: 10, marginTop: 4 }, txt: { fontSize: 10, fontFamily: "monospace" } });

// ── SLIDER DE ESTADOS ─────────────────────────────────────────
function StateSlider({ current, onSelect }: { current: StateKey | null; onSelect: (s: StateKey) => void }) {
  const currentIndex = STATES.findIndex((s) => s.key === current);
  return (
    <View style={sl.wrap}>
      <View style={sl.track}>
        {STATES.map((s, i) => {
          const isActive = s.key === current;
          const isPast = currentIndex >= 0 && i < currentIndex;
          return (
            <React.Fragment key={s.key}>
              <TouchableOpacity onPress={() => onSelect(s.key)} style={sl.stopWrap}>
                <View style={[
                  sl.stop,
                  { borderColor: s.color },
                  isActive && { backgroundColor: s.color },
                  isPast && { backgroundColor: s.color + "40" },
                ]}>
                  {isActive && <View style={sl.stopInner} />}
                </View>
                <Text style={[sl.stopLabel, { color: isActive ? s.color : C.slate }]}>{s.label}</Text>
              </TouchableOpacity>
              {i < STATES.length - 1 && (
                <View style={[sl.connector, isPast && { backgroundColor: s.color }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
      {current && (
        <Text style={sl.desc}>{STATES.find((s) => s.key === current)?.desc}</Text>
      )}
    </View>
  );
}
const sl = StyleSheet.create({
  wrap: { marginBottom: 20 },
  track: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stopWrap: { alignItems: "center", gap: 6 },
  stop: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  stopInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#000" },
  stopLabel: { fontFamily: "monospace", fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },
  connector: { flex: 1, height: 2, backgroundColor: C.borderMid, marginHorizontal: -2, marginBottom: 16 },
  desc: { color: C.slate, fontFamily: "monospace", fontSize: 10, textAlign: "center", marginTop: 12 },
});

// ── PANEL: WALLET ─────────────────────────────────────────────
function WalletPanel() {
  const { address, isAuthenticated, connectAndAuthenticate } = useWallet();
  return (
    <View style={{ marginBottom: 16, padding: 12, borderWidth: 1, borderColor: C.borderMid, backgroundColor: C.surface }}>
      <ThemedText style={{ color: C.parchment, fontSize: 11 }}>
        Wallet: {isAuthenticated && address ? address : "no conectada"}
      </ThemedText>
      {!isAuthenticated && (
        <View style={{ marginTop: 8 }}>
          <ActionButton label="CONECTAR WALLET" onPress={connectAndAuthenticate} />
        </View>
      )}
    </View>
  );
}

// ── ESTADO: PREVIO ────────────────────────────────────────────
function PreviewStateActions({ eventId, onChanged }: { eventId: string | null; onChanged: () => void }) {
  const setStatus = useRpcAction<{ p_event_id: string; p_status: string }>("test_set_event_status");

  if (!eventId) {
    return <ThemedText style={{ color: C.slate, fontSize: 10 }}>Elegí o creá un evento arriba para empezar.</ThemedText>;
  }

  return (
    <View style={{ gap: 10 }}>
      <ActionButton label="ABRIR VENTA → ACTIVO" icon="▶" color={C.gold} loading={setStatus.loading}
        onPress={async () => { await setStatus.run({ p_event_id: eventId, p_status: "activo" }); onChanged(); }} />
      <ResultBox result={setStatus.result} error={setStatus.error} />
    </View>
  );
}

// ── PANEL: TRANSFERIR TICKET ───────────────────────────────────
// Elegís uno de tus propios tickets "vivo" en este evento y lo
// mandás a otra wallet (de prueba, escrita a mano — no hace falta
// que esté conectada). Usa transfer_ticket(), la misma función
// que se usaría con una transferencia real on-chain más adelante.
function TransferTicketPanel({ eventId, onChanged }: { eventId: string | null; onChanged: () => void }) {
  const { address } = useWallet();
  const transferTicket = useRpcAction<{ p_ticket_id: string; p_from_wallet: string; p_to_wallet: string; p_tx_hash: string }>("transfer_ticket");

  const [myTickets, setMyTickets] = useState<{ id: string; qr_code: string }[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [toWallet, setToWallet] = useState("");

  const loadMyTickets = useCallback(async () => {
    if (!eventId || !address) { setMyTickets([]); return; }
    const { data } = await supabase
      .from("tickets")
      .select("id, qr_code")
      .eq("event_id", eventId)
      .eq("wallet_address", address)
      .eq("status", "vivo");
    setMyTickets(data ?? []);
    setSelectedTicketId(null);
  }, [eventId, address]);

  useEffect(() => { loadMyTickets(); }, [loadMyTickets]);

  const handleTransfer = async () => {
    if (!selectedTicketId || !address || !toWallet.trim()) return;
    const { data } = await transferTicket.run({
      p_ticket_id: selectedTicketId,
      p_from_wallet: address,
      p_to_wallet: toWallet.trim(),
      p_tx_hash: "TEST-TRANSFER-" + Date.now(),
    });
    if (data?.success) {
      setToWallet("");
      await loadMyTickets();
      onChanged();
    }
  };

  return (
    <View style={{ gap: 10, marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.borderMid }}>
      <ThemedText style={{ color: C.parchment, fontSize: 11, fontWeight: "700" }}>↔ Transferir ticket a otra wallet</ThemedText>

      {!address ? (
        <ThemedText style={{ color: C.crimson, fontSize: 9 }}>⚠ Conectá tu wallet primero (arriba)</ThemedText>
      ) : myTickets.length === 0 ? (
        <ThemedText style={{ color: C.slate, fontSize: 10 }}>No tenés tickets "vivo" en este evento para transferir.</ThemedText>
      ) : (
        <HScroller>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {myTickets.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelectedTicketId(t.id)}
                style={[swapAx.card, selectedTicketId === t.id && { borderColor: C.gold, backgroundColor: C.gold + "20" }]}
              >
                <Text style={swapAx.id}>🎟 {t.qr_code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </HScroller>
      )}

      <TestInput value={toWallet} onChangeText={setToWallet} placeholder="Wallet destino (0x... de prueba)" />
      <ActionButton
        label="TRANSFERIR TICKET"
        icon="↔"
        description={selectedTicketId ? `De tu wallet a ${toWallet || "..."}` : "Elegí un ticket arriba"}
        color={C.gold}
        loading={transferTicket.loading}
        disabled={!selectedTicketId || !toWallet.trim()}
        onPress={handleTransfer}
      />
      <ResultBox result={transferTicket.result} error={transferTicket.error} />
    </View>
  );
}

// ── ESTADO: ACTIVO ────────────────────────────────────────────
function ActiveStateActions({ eventId, onChanged }: { eventId: string | null; onChanged: () => void }) {
  const { address } = useWallet();
  const { price: slpPrice } = useSlpPrice();
  const setStatus = useRpcAction<{ p_event_id: string; p_status: string }>("test_set_event_status");
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [ticketPriceUsd, setTicketPriceUsd] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId) { setTicketPriceUsd(null); return; }
    supabase.from("events").select("ticket_price_usd").eq("id", eventId).maybeSingle()
      .then(({ data }) => setTicketPriceUsd(data?.ticket_price_usd ?? 3));
  }, [eventId]);

  return (
    <View style={{ gap: 10 }}>
      <ThemedText style={{ color: C.parchment, fontSize: 11, fontWeight: "700" }}>
        🎟 Comprar tickets — mismo modal que usa el usuario en /profile y /milestone
      </ThemedText>

      <ActionButton
        label="COMPRAR TICKETS"
        icon="🎟"
        description={!address ? "Conectá tu wallet primero (arriba)" : undefined}
        disabled={!eventId || !address || ticketPriceUsd === null}
        onPress={() => setBuyModalOpen(true)}
      />

      {eventId && address && ticketPriceUsd !== null && (
        <BuyTicketsModal
          visible={buyModalOpen}
          onClose={() => setBuyModalOpen(false)}
          activeEvent={{ id: eventId, ticket_price_usd: ticketPriceUsd }}
          address={address}
          slpPrice={slpPrice}
          onBought={() => { setBuyModalOpen(false); onChanged(); }}
        />
      )}

      <TransferTicketPanel eventId={eventId} onChanged={onChanged} />

      {eventId && (
        <ActionButton label="CERRAR VENTA → SWAP" icon="⏭" color={C.purple} loading={setStatus.loading}
          onPress={async () => { await setStatus.run({ p_event_id: eventId, p_status: "swap" }); onChanged(); }} />
      )}
      <ResultBox result={setStatus.result} error={setStatus.error} />
    </View>
  );
}

// ── ESTADO: SWAP (con Axies reales de la wallet + cooldown) ────
function SwapStateActions({ eventId, onChanged, onAdvanceToDrawing }: { eventId: string | null; onChanged: () => void; onAdvanceToDrawing: () => void }) {
  const { address } = useWallet();
  const swapAxie = useRpcAction<{ p_event_id: string; p_wallet_address: string; p_axie_id: string; p_floor_price_slp: number; p_tx_hash: string }>("swap_axie");
  const releaseCooldownSlp = useRpcAction<{ p_event_id: string; p_wallet_address: string; p_paid_slp: number; p_tx_hash: string }>("release_swap_cooldown_with_slp");
  const releaseCooldownAxie = useRpcAction<{ p_event_id: string; p_wallet_address: string; p_axie_id: string; p_tx_hash: string }>("release_swap_cooldown_with_axie");
  const { price: slpPrice } = useSlpPrice();

  const [axies, setAxies] = useState<Axie[]>([]);
  const [axiesLoading, setAxiesLoading] = useState(false);
  const [selected, setSelected] = useState<Axie | null>(null);
  const [floorSlp, setFloorSlp] = useState("150");
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!address) return;
    setAxiesLoading(true);
    getAxiesForWallet(address).then((list) => {
      setAxies(list);
      setAxiesLoading(false);
    });
  }, [address]);

  const checkCooldown = useCallback(async () => {
    if (!eventId || !address) { setCooldownUntil(null); return; }
    const { data } = await supabase
      .from("participants")
      .select("swap_cooldown_until")
      .eq("event_id", eventId)
      .eq("wallet_address", address)
      .maybeSingle();
    const until = data?.swap_cooldown_until as string | undefined;
    setCooldownUntil(until && new Date(until) > new Date() ? until : null);
  }, [eventId, address]);

  useEffect(() => { checkCooldown(); }, [checkCooldown]);

  // re-chequea cada 15s por si el cooldown vence solo mientras el panel está abierto
  useEffect(() => {
    if (!cooldownUntil) return;
    const t = setInterval(checkCooldown, 15000);
    return () => clearInterval(t);
  }, [cooldownUntil, checkCooldown]);

  const handleSwap = async () => {
    if (!eventId || !address || !selected) return;
    const { data } = await swapAxie.run({
      p_event_id: eventId,
      p_wallet_address: address,
      p_axie_id: selected.id,
      p_floor_price_slp: Number(floorSlp),
      p_tx_hash: "TEST-SWAP-" + Date.now(),
    });
    if (data?.success) {
      setAxies((prev) => prev.filter((a) => a.id !== selected.id));
      setSelected(null);
    }
    await checkCooldown();
    onChanged();
  };

  const handlePaySlp = async () => {
    if (!eventId || !address) return;
    const requiredSlp = usdToSlp(2, slpPrice);
    const { data } = await releaseCooldownSlp.run({
      p_event_id: eventId,
      p_wallet_address: address,
      p_paid_slp: requiredSlp,
      p_tx_hash: "TEST-COOLDOWN-PAGO-" + Date.now(),
    });
    if (data?.success) await checkCooldown();
  };

  const handleGiveAxieForCooldown = async (axie: Axie) => {
    if (!eventId || !address) return;
    const { data } = await releaseCooldownAxie.run({
      p_event_id: eventId,
      p_wallet_address: address,
      p_axie_id: axie.id,
      p_tx_hash: "TEST-COOLDOWN-AXIE-" + Date.now(),
    });
    if (data?.success) {
      setAxies((prev) => prev.filter((a) => a.id !== axie.id));
      setPickerOpen(false);
      await checkCooldown();
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <ThemedText style={{ color: C.parchment, fontSize: 11, fontWeight: "700" }}>🔮 Tus Axies (wallet conectada)</ThemedText>

      {!address ? (
        <ThemedText style={{ color: C.crimson, fontSize: 10 }}>Conectá tu wallet para ver tus Axies.</ThemedText>
      ) : axiesLoading ? (
        <ThemedText style={{ color: C.slate, fontSize: 10 }}>Cargando Axies...</ThemedText>
      ) : axies.length === 0 ? (
        <ThemedText style={{ color: C.slate, fontSize: 10 }}>No quedan Axies disponibles (o ya los entregaste todos en este test).</ThemedText>
      ) : (
        <HScroller>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {axies.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => setSelected(a)}
                style={[swapAx.card, selected?.id === a.id && swapAx.cardSelected]}
              >
                <Image source={{ uri: a.imageUrl }} style={swapAx.img} resizeMode="contain" />
                <Text style={swapAx.id}>#{a.id}</Text>
                <Text style={swapAx.cls}>{a.class}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </HScroller>
      )}

      <ThemedText style={{ color: C.slate, fontSize: 9, marginTop: 4 }}>
        💰 Floor price — cuánto SLP le pedís al cirquero por el Axie que elijas (sale del swap_pool_slp del evento)
      </ThemedText>
      <TestInput value={floorSlp} onChangeText={setFloorSlp} placeholder="Floor price en SLP" keyboardType="numeric" />
      <ActionButton
        label="ENTREGAR AXIE AL SWAP"
        icon="🔮"
        description={selected ? `Entregás #${selected.id} por ${floorSlp} SLP` : "Elegí un Axie arriba"}
        color={C.purple}
        loading={swapAxie.loading}
        disabled={!selected || !eventId || !!cooldownUntil}
        onPress={handleSwap}
      />
      <ResultBox result={swapAxie.result} error={swapAxie.error} />

      {eventId && (
        <ActionButton label="CERRAR SWAP → SORTEAR" icon="⏭" color={C.ember}
          description="Solo avanza la vista de test — el status real sigue siendo 'swap' hasta que se sortee y cierre"
          onPress={onAdvanceToDrawing} />
      )}

      {cooldownUntil && (
        <View style={{ borderWidth: 1, borderColor: C.purple, padding: 10, marginTop: 6 }}>
          <ThemedText style={{ color: C.purple, fontSize: 10, fontWeight: "900", marginBottom: 6 }}>
            🔒 EN COOLDOWN — hasta {new Date(cooldownUntil).toLocaleTimeString()}
          </ThemedText>
          <ActionButton label="VER OPCIONES PARA ENTRAR AHORA" icon="🔓" color={C.gold} onPress={() => setOfferOpen(true)} />
        </View>
      )}

      <CooldownOfferModal
        visible={offerOpen}
        cooldownUntil={cooldownUntil}
        requiredSlp={usdToSlp(2, slpPrice)}
        requiredUsd={2}
        payLoading={releaseCooldownSlp.loading}
        axieLoading={releaseCooldownAxie.loading}
        onPaySlp={async () => { await handlePaySlp(); setOfferOpen(false); }}
        onOpenAxiePicker={() => { setOfferOpen(false); setPickerOpen(true); }}
        onClose={() => setOfferOpen(false)}
      />
      <ResultBox result={releaseCooldownSlp.result} error={releaseCooldownSlp.error} />

      <CooldownAxiePickerModal
        visible={pickerOpen}
        axies={axies}
        loading={releaseCooldownAxie.loading}
        onConfirm={handleGiveAxieForCooldown}
        onClose={() => setPickerOpen(false)}
      />
      <ResultBox result={releaseCooldownAxie.result} error={releaseCooldownAxie.error} />
    </View>
  );
}
const swapAx = StyleSheet.create({
  card: { width: 80, borderWidth: 1.5, borderColor: C.borderMid, backgroundColor: "#000", padding: 6, alignItems: "center" },
  cardSelected: { borderColor: C.purple, backgroundColor: C.purple + "20" },
  img: { width: 50, height: 50 },
  id: { color: C.parchment, fontFamily: "monospace", fontSize: 8, marginTop: 4 },
  cls: { color: C.slate, fontFamily: "monospace", fontSize: 7 },
});

// ── ESTADO: SORTEANDO ─────────────────────────────────────────
function DrawingStateActions({ eventId, onChanged, onComplete }: { eventId: string | null; onChanged: () => void; onComplete: () => void }) {
  const drawNext = useRpcAction<{ p_event_id: string }>("draw_next_reward");
  const simulateBurn = useRpcAction<{ p_event_id: string }>("test_simulate_burn");
  const releaseAxies = useRpcAction<{ p_event_id: string }>("test_release_swapped_axies");
  const finalizeEvent = useRpcAction<{ p_event_id: string; p_reason: string }>("test_finalize_event");
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const checkPending = useCallback(async () => {
    if (!eventId) return;
    const { count } = await supabase
      .from("level_rewards_unlocked")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "pending-reward");
    setPendingCount(count ?? 0);
  }, [eventId]);

  useEffect(() => { checkPending(); }, [checkPending]);

  const runParallelClose = async () => {
    if (!eventId) return;
    const drawAllRewards = async () => {
      while (true) {
        const { data } = await drawNext.run({ p_event_id: eventId });
        if (!data?.success) break;
      }
    };
    await Promise.all([
      drawAllRewards(),
      simulateBurn.run({ p_event_id: eventId }),
      releaseAxies.run({ p_event_id: eventId }),
    ]);
    await checkPending();
    onChanged();
  };

  const handleFinalize = async (reason: string) => {
    if (!eventId) return;
    await finalizeEvent.run({ p_event_id: eventId, p_reason: reason });
    onChanged();
    onComplete();
  };

  return (
    <View style={{ gap: 10 }}>
      <ThemedText style={{ color: C.parchment, fontSize: 11 }}>
        Rewards pendientes de sorteo: <ThemedText style={{ color: C.ember, fontWeight: "900" }}>{pendingCount ?? "—"}</ThemedText>
      </ThemedText>

      <ActionButton
        label="SORTEAR + QUEMAR + LIBERAR (en paralelo)"
        icon="⚡"
        description="Las 3 operaciones se disparan a la vez, como en producción"
        color={C.ember}
        loading={drawNext.loading || simulateBurn.loading || releaseAxies.loading}
        disabled={!eventId}
        onPress={runParallelClose}
      />
      <ResultBox result={{ quema: simulateBurn.result, liberacion: releaseAxies.result }} error={simulateBurn.error ?? releaseAxies.error} />

      <ThemedText style={{ color: C.slate, fontSize: 10, marginTop: 6 }}>
        Elegí con qué motivo se cierra (queda grabado en el evento, se ve en el checklist):
      </ThemedText>
      <View style={{ gap: 8 }}>
        <ActionButton label="FINALIZAR — motivo: manual (todo salió bien)" icon="🏁" color={C.greenBrt}
          loading={finalizeEvent.loading} disabled={!eventId || (pendingCount ?? 1) > 0}
          onPress={() => handleFinalize("manual")} />
        <ActionButton label="FINALIZAR — motivo: tiempo agotado" icon="⏰" color={C.gold}
          loading={finalizeEvent.loading} disabled={!eventId || (pendingCount ?? 1) > 0}
          onPress={() => handleFinalize("tiempo_agotado")} />
        <ActionButton label="FINALIZAR — motivo: fondos agotados" icon="💸" color={C.crimson}
          loading={finalizeEvent.loading} disabled={!eventId || (pendingCount ?? 1) > 0}
          onPress={() => handleFinalize("fondos_agotados")} />
      </View>
      <ResultBox result={finalizeEvent.result} error={finalizeEvent.error} />
    </View>
  );
}

// ── CHECKLIST — pinta en pantalla los checks reales de test_run_checklist ──
type ChecklistRow = { orden: number; etapa: string; check_nombre: string; pasa: boolean; detalle: string };

function ChecklistPanel({ eventId }: { eventId: string | null }) {
  const [rows, setRows] = useState<ChecklistRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runChecklist = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("test_run_checklist", { p_event_id: eventId });
    setLoading(false);
    if (!error) setRows(data ?? []);
  }, [eventId]);

  useEffect(() => { runChecklist(); }, [runChecklist]);

  const okCount = rows?.filter((r) => r.pasa).length ?? 0;
  const total = rows?.length ?? 0;

  return (
    <View style={{ borderWidth: 1, borderColor: C.borderMid, backgroundColor: C.surface, padding: 12, marginTop: 12, gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <ThemedText style={{ color: C.parchment, fontSize: 12, fontWeight: "900" }}>✅ CHECKLIST DEL EVENTO</ThemedText>
        <TouchableOpacity onPress={runChecklist} disabled={loading}>
          <Text style={{ color: C.slate, fontSize: 10 }}>{loading ? "..." : "↻ recargar"}</Text>
        </TouchableOpacity>
      </View>
      {rows && (
        <Text style={{ color: okCount === total ? C.greenBrt : C.ember, fontSize: 11, fontWeight: "900" }}>
          {okCount} / {total} OK
        </Text>
      )}
      {rows?.map((r) => (
        <View key={r.orden} style={{ flexDirection: "row", gap: 8, paddingVertical: 4, borderTopWidth: 1, borderTopColor: C.border }}>
          <Text style={{ color: r.pasa ? C.greenBrt : C.crimson, fontSize: 13, fontWeight: "900" }}>{r.pasa ? "✓" : "✗"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.parchment, fontSize: 10 }}>[{r.etapa}] {r.check_nombre}</Text>
            <Text style={{ color: C.slate, fontSize: 9, marginTop: 1 }}>{r.detalle}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── ESTADO: COMPLETADO ─────────────────────────────────────────
function CompletedStateActions({ eventId }: { eventId: string | null }) {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from("events")
      .select("event_number, label, ritual_level, total_tickets, total_raised_slp, axies_released, closure_reason")
      .eq("id", eventId)
      .maybeSingle()
      .then(({ data }) => setSummary(data));
  }, [eventId]);

  return (
    <View style={{ gap: 10 }}>
      <ThemedText style={{ color: C.greenBrt, fontSize: 12, fontWeight: "900" }}>
        ✓ EVENTO FINALIZADO — visible en el histórico de Home y /ritual
      </ThemedText>
      {summary && (
        <View style={{ borderWidth: 1, borderColor: C.borderMid, padding: 10, backgroundColor: C.surface }}>
          <ThemedText style={{ color: C.parchment, fontSize: 10, fontFamily: "monospace" }}>
            Ritual #{summary.event_number} — Nivel {summary.ritual_level}{"\n"}
            {summary.total_tickets} tickets · {fmtSlp(summary.total_raised_slp)} SLP recaudados{"\n"}
            {summary.axies_released} Axies liberados{"\n"}
            Motivo de cierre: {summary.closure_reason ?? "—"}
          </ThemedText>
        </View>
      )}
      <ChecklistPanel eventId={eventId} />
      <ThemedText style={{ color: C.slate, fontSize: 10 }}>
        Para probar un ciclo nuevo, creá otro evento arriba.
      </ThemedText>
    </View>
  );
}

// ── ANUAL (sección aparte, no forma parte del slider mensual) ──
function AnnualSection() {
  const { address } = useWallet();
  const seedTickets = useRpcAction<{ p_wallet_address: string; p_year: number }>("test_seed_tickets_for_annual");
  const mintKey = useRpcAction<{ p_wallet_address: string; p_year: number; p_paid_slp: number; p_ticket_ids: string[] }>("mint_annual_key");
  const activateAnnual = useRpcAction<{ p_year: number }>("activate_annual_event");
  const drawAnnualReward = useRpcAction<{ p_annual_event_id: string }>("draw_next_annual_reward");
  const closeAnnual = useRpcAction<{ p_annual_event_id: string }>("close_annual_event");

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [seededTicketIds, setSeededTicketIds] = useState<string[]>([]);
  const [annualEventId, setAnnualEventId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleSeed = async () => {
    if (!address) return;
    const { data } = await seedTickets.run({ p_wallet_address: address, p_year: Number(year) });
    if (data?.ticket_ids) setSeededTicketIds(data.ticket_ids);
  };

  const handleActivate = async () => {
    const { data } = await activateAnnual.run({ p_year: Number(year) });
    if (data?.annual_event_id) setAnnualEventId(data.annual_event_id);
  };

  return (
    <View style={{ borderWidth: 1, borderColor: C.gold + "60", marginTop: 20, backgroundColor: C.surface }}>
      <TouchableOpacity style={{ flexDirection: "row", justifyContent: "space-between", padding: 14 }} onPress={() => setOpen(!open)}>
        <ThemedText style={{ color: C.gold, fontSize: 13, fontWeight: "900", letterSpacing: 1.5 }}>🗝️ EVENTO ANUAL Y LLAVES</ThemedText>
        <ThemedText style={{ color: C.gold, fontSize: 12 }}>{open ? "▲" : "▼"}</ThemedText>
      </TouchableOpacity>
      {open && (
        <View style={{ padding: 14, paddingTop: 0, gap: 10 }}>
          <TestInput value={year} onChangeText={setYear} placeholder="Año" keyboardType="numeric" />

          <ActionButton label="1 — SEED 12 TICKETS DEL AÑO" color={C.gold} loading={seedTickets.loading} disabled={!address} onPress={handleSeed} />
          {seededTicketIds.length > 0 && <ThemedText style={{ color: C.greenBrt, fontSize: 9 }}>✓ {seededTicketIds.length} tickets listos.</ThemedText>}

          <ActionButton label="2 — MINTEAR LLAVE" color={C.greenBrt} loading={mintKey.loading} disabled={!address || seededTicketIds.length !== 12}
            onPress={() => address && mintKey.run({ p_wallet_address: address, p_year: Number(year), p_paid_slp: 1650, p_ticket_ids: seededTicketIds })} />
          <ResultBox result={mintKey.result} error={mintKey.error} />

          <ActionButton label="3 — ACTIVAR EVENTO ANUAL" color={C.ember} loading={activateAnnual.loading} onPress={handleActivate} />
          <ResultBox result={activateAnnual.result} error={activateAnnual.error} />

          <ActionButton label="4 — SORTEAR SIGUIENTE (1/10)" color={C.gold} loading={drawAnnualReward.loading} disabled={!annualEventId}
            onPress={() => annualEventId && drawAnnualReward.run({ p_annual_event_id: annualEventId })} />
          <ResultBox result={drawAnnualReward.result} error={drawAnnualReward.error} />

          <ActionButton label="5 — CERRAR EVENTO ANUAL" color={C.crimson} loading={closeAnnual.loading} disabled={!annualEventId}
            onPress={() => annualEventId && closeAnnual.run({ p_annual_event_id: annualEventId })} />
          <ResultBox result={closeAnnual.result} error={closeAnnual.error} />
        </View>
      )}
    </View>
  );
}

// ── SELECTOR DE EVENTOS DE TEST (arriba de todo) ────────────────
type TestEventListItem = {
  event_id: string; event_number: number; label: string; status: string;
  total_tickets: number; ritual_level: number; created_at: string;
};

const MONTHS = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

function CreateEventModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (eventId: string) => void }) {
  const createEvent = useRpcAction<{ p_year: number; p_month: number }>("test_create_event_for");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const handleCreate = async () => {
    const { data } = await createEvent.run({ p_year: Number(year), p_month: month });
    if (data?.event_id) {
      onCreated(data.event_id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={cem.overlay}>
        <View style={cem.box}>
          <Text style={cem.title}>CREAR EVENTO DE TEST</Text>
          <Text style={cem.sub}>Siempre día 1. Elegí mes y año.</Text>

          <TestInput value={year} onChangeText={setYear} placeholder="Año (ej. 2026)" keyboardType="numeric" />

          <View style={cem.monthGrid}>
            {MONTHS.map((m, i) => {
              const num = i + 1;
              const active = month === num;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMonth(num)}
                  style={[cem.monthBtn, active && { backgroundColor: C.gold, borderColor: C.gold }]}
                >
                  <Text style={[cem.monthTxt, active && { color: "#000" }]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ResultBox result={createEvent.result} error={createEvent.error} />

          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <ActionButton label="CANCELAR" color={C.slate} onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <ActionButton label="CREAR" color={C.greenBrt} loading={createEvent.loading} onPress={handleCreate} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const cem = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#000000e6", alignItems: "center", justifyContent: "center", padding: 20 },
  box: { width: "100%", maxWidth: 420, borderWidth: 1.5, borderColor: C.gold, backgroundColor: C.surface, padding: 18, gap: 10 },
  title: { color: C.gold, fontSize: 15, fontWeight: "900", letterSpacing: 1 },
  sub: { color: C.slate, fontSize: 10, marginBottom: 4 },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  monthBtn: { width: "22%", borderWidth: 1, borderColor: C.borderMid, paddingVertical: 8, alignItems: "center" },
  monthTxt: { color: C.parchment, fontSize: 10, fontWeight: "900" },
});

function EventPicker({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  const [events, setEvents] = useState<TestEventListItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const deleteEvent = useRpcAction<{ p_event_id: string }>("test_delete_event");

  const loadEvents = useCallback(async () => {
    const { data } = await supabase.rpc("test_list_events");
    setEvents(data ?? []);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  // Recarga cada vez que volvés a esta pantalla (cambiás de tab, volvés atrás, etc).
  useFocusEffect(useCallback(() => { loadEvents(); }, [loadEvents]));

  const handleDelete = async (id: string) => {
    await deleteEvent.run({ p_event_id: id });
    if (id === selectedId) onSelect(null);
    await loadEvents();
  };

  return (
    <View style={{ marginBottom: 16, padding: 12, borderWidth: 1, borderColor: C.borderMid, backgroundColor: C.surface, gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <ThemedText style={{ color: C.parchment, fontSize: 12, fontWeight: "900" }}>EVENTOS DE TEST</ThemedText>
        <TouchableOpacity onPress={() => setModalOpen(true)} style={{ borderWidth: 1, borderColor: C.greenBrt, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: C.greenBrt, fontSize: 10, fontWeight: "900" }}>+ CREAR</Text>
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <ThemedText style={{ color: C.slate, fontSize: 10 }}>No hay eventos de test todavía. Creá uno.</ThemedText>
      ) : (
        events.map((e) => (
          <TouchableOpacity
            key={e.event_id}
            onPress={() => onSelect(e.event_id)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 8, padding: 8,
              borderWidth: 1, borderColor: e.event_id === selectedId ? C.gold : C.border,
              backgroundColor: e.event_id === selectedId ? C.gold + "15" : "transparent",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.parchment, fontSize: 11, fontWeight: "700" }}>{e.label} (#{e.event_number})</Text>
              <Text style={{ color: C.slate, fontSize: 9 }}>
                {e.status} · {e.total_tickets} tickets · nivel {e.ritual_level}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(e.event_id)} style={{ padding: 6 }}>
              <Text style={{ color: C.crimson, fontSize: 14 }}>🗑</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}

      <CreateEventModal visible={modalOpen} onClose={() => setModalOpen(false)} onCreated={onSelect} />
    </View>
  );
}

// ── TOGGLE: mostrar eventos de test en Home/ritual ──────────────
function ShowTestToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("system_config").select("value").eq("key", "show_test_events_in_history").maybeSingle();
    setEnabled(data?.value === "true");
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async () => {
    setLoading(true);
    const newVal = !enabled;
    await supabase.rpc("test_set_config", { p_key: "show_test_events_in_history", p_value: newVal ? "true" : "false" });
    setEnabled(newVal);
    setLoading(false);
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      disabled={loading}
      style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        borderWidth: 1, borderColor: enabled ? C.greenBrt : C.borderMid,
        backgroundColor: C.surface, padding: 12, marginBottom: 16,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.parchment, fontSize: 11, fontWeight: "900" }}>
          Mostrar eventos de test en Home / ritual
        </Text>
        <Text style={{ color: C.slate, fontSize: 9, marginTop: 2 }}>
          Apagalo antes de mostrarle la app a alguien más — no es data real.
        </Text>
      </View>
      <View style={{
        width: 44, height: 24, borderRadius: 12, borderWidth: 1,
        borderColor: enabled ? C.greenBrt : C.slate,
        backgroundColor: enabled ? C.greenBrt + "40" : "transparent",
        justifyContent: "center", paddingHorizontal: 3,
      }}>
        <View style={{
          width: 18, height: 18, borderRadius: 9,
          backgroundColor: enabled ? C.greenBrt : C.slate,
          alignSelf: enabled ? "flex-end" : "flex-start",
        }} />
      </View>
    </TouchableOpacity>
  );
}

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function TestScreen() {
  const router = useRouter();
  const { enabled, setEnabled: setTestModeEnabled } = useTestMode();
  const resetAll = useRpcAction("test_reset_all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [isDrawingPhase, setIsDrawingPhase] = useState(false);

  const loadEventStatus = useCallback(async () => {
    if (!selectedEventId) { setEventStatus(null); return; }
    const { data } = await supabase.from("events").select("status").eq("id", selectedEventId).maybeSingle();
    setEventStatus(data?.status ?? null);
  }, [selectedEventId]);

  useEffect(() => { loadEventStatus(); }, [loadEventStatus]);
  useEffect(() => { setIsDrawingPhase(false); }, [selectedEventId]);
  // Recarga cada vez que volvés a esta pantalla.
  useFocusEffect(useCallback(() => { loadEventStatus(); }, [loadEventStatus]));

  const currentState: StateKey | null = !eventStatus
    ? null
    : (isDrawingPhase && eventStatus === "swap" ? "sorteando" : (eventStatus as StateKey));

  const handleSelectState = async (state: StateKey) => {
    if (!selectedEventId) return;
    if (state === "sorteando") { setIsDrawingPhase(true); return; }
    setIsDrawingPhase(false);
    await supabase.rpc("test_set_event_status", { p_event_id: selectedEventId, p_status: state });
    await loadEventStatus();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <View style={{ marginBottom: 16, borderBottomWidth: 2, borderBottomColor: C.crimson, paddingBottom: 12 }}>
          <ThemedText style={{ color: C.crimson, fontSize: 18, fontWeight: "900", letterSpacing: 2 }}>⚠ PANEL DE TEST</ThemedText>
          <ThemedText style={{ color: C.slate, fontSize: 10, marginTop: 4 }}>
            QA manual — el sistema real corre solo, vía cron. Esto es solo para probar.
          </ThemedText>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: enabled ? C.greenBrt : C.borderMid, backgroundColor: C.surface, padding: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.parchment, fontSize: 11, fontWeight: "900" }}>Activar modo test</Text>
            <Text style={{ color: C.slate, fontSize: 9, marginTop: 2 }}>
              Con esto prendido, todas las demás pantallas muestran un botón flotante "VOLVER A TEST".
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setTestModeEnabled(!enabled)}
            style={{
              width: 44, height: 24, borderRadius: 12, borderWidth: 1,
              borderColor: enabled ? C.greenBrt : C.slate,
              backgroundColor: enabled ? C.greenBrt + "40" : "transparent",
              justifyContent: "center", paddingHorizontal: 3,
            }}
          >
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: enabled ? C.greenBrt : C.slate, alignSelf: enabled ? "flex-end" : "flex-start" }} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Home", href: "/" },
            { label: "Milestone", href: "/milestone" },
            { label: "Profile", href: "/profile" },
            { label: "Swap", href: "/swap" },
            { label: "Evento Anual", href: "/special" },
            { label: "Ritual (historial)", href: "/ritual" },
          ].map((r) => (
            <TouchableOpacity
              key={r.href}
              onPress={() => router.push(r.href as any)}
              style={{ borderWidth: 1, borderColor: C.borderMid, paddingVertical: 6, paddingHorizontal: 10 }}
            >
              <Text style={{ color: C.parchment, fontSize: 10 }}>→ {r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ThemedText style={{ color: C.slate, fontSize: 9, marginTop: -12, marginBottom: 16 }}>
          Navegación con botones (no reescribas la URL a mano) para que la wallet conectada acá se mantenga logeada al llegar.
        </ThemedText>

        <WalletPanel />
        <ShowTestToggle />
        <EventPicker selectedId={selectedEventId} onSelect={setSelectedEventId} />

        {!selectedEventId ? (
          <View style={{ borderWidth: 1, borderColor: C.borderMid, padding: 16, backgroundColor: C.surface, marginBottom: 16 }}>
            <ThemedText style={{ color: C.slate, fontSize: 11 }}>Elegí o creá un evento arriba para empezar a testear.</ThemedText>
          </View>
        ) : (
          <View style={{ borderWidth: 1, borderColor: C.borderMid, padding: 16, backgroundColor: C.surface, marginBottom: 16 }}>
            <StateSlider current={currentState} onSelect={handleSelectState} />

            {currentState === "previo" || currentState === null ? (
              <PreviewStateActions eventId={selectedEventId} onChanged={loadEventStatus} />
            ) : currentState === "activo" ? (
              <ActiveStateActions eventId={selectedEventId} onChanged={loadEventStatus} />
            ) : currentState === "swap" ? (
              <SwapStateActions eventId={selectedEventId} onChanged={loadEventStatus} onAdvanceToDrawing={() => setIsDrawingPhase(true)} />
            ) : currentState === "sorteando" ? (
              <DrawingStateActions eventId={selectedEventId} onChanged={loadEventStatus} onComplete={() => setIsDrawingPhase(false)} />
            ) : currentState === "completado" ? (
              <CompletedStateActions eventId={selectedEventId} />
            ) : null}
          </View>
        )}

        <AnnualSection />

        <View style={{ borderWidth: 1, borderColor: C.crimson, marginTop: 20, padding: 14, backgroundColor: C.surface }}>
          <ThemedText style={{ color: C.crimson, fontSize: 12, fontWeight: "900", marginBottom: 8 }}>⚠ RESET TOTAL DE TEST</ThemedText>
          <ThemedText style={{ color: C.slate, fontSize: 10, marginBottom: 10 }}>
            Borra TODOS los eventos de prueba (event_number ≤ 0) y llaves de test. No afecta eventos reales.
          </ThemedText>
          <ActionButton label="BORRAR TODOS LOS DATOS DE TEST" color={C.crimson} loading={resetAll.loading}
            onPress={async () => { await resetAll.run(); setSelectedEventId(null); }} />
          <ResultBox result={resetAll.result} error={resetAll.error} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}