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

import { ThemedText } from "@/components/themed-text";
import { useWallet } from "@/contexts/wallet-context";
import { fmtSlp } from "@/hooks/use-slp-price";
import { Axie, getAxiesForWallet } from "@/lib/axie-service";
import { supabase } from "@/lib/supabase";
import React, { useCallback, useEffect, useState } from "react";
import {
    Image,
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
  const createEvent = useRpcAction("test_create_event");
  const deactivateEvent = useRpcAction("test_deactivate_event");
  const setStatus = useRpcAction<{ p_status: string }>("test_set_event_status");

  return (
    <View style={{ gap: 10 }}>
      <ThemedText style={{ color: C.slate, fontSize: 10 }}>
        Evento de prueba: {eventId ? `✓ ${eventId.slice(0, 8)}...` : "ninguno — creá uno"}
      </ThemedText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <ActionButton label="CREAR EVENTO TEST" icon="🆕" color={C.greenBrt} loading={createEvent.loading}
            onPress={async () => { await createEvent.run(); onChanged(); }} />
        </View>
        <View style={{ flex: 1 }}>
          <ActionButton label="BORRAR EVENTO" icon="🗑️" color={C.crimson} loading={deactivateEvent.loading}
            onPress={async () => { await deactivateEvent.run(); onChanged(); }} />
        </View>
      </View>
      <ResultBox result={createEvent.result ?? deactivateEvent.result} error={createEvent.error ?? deactivateEvent.error} />

      {eventId && (
        <ActionButton label="ABRIR VENTA → ACTIVO" icon="▶" color={C.gold} loading={setStatus.loading}
          onPress={async () => { await setStatus.run({ p_status: "activo" }); onChanged(); }} />
      )}
      <ResultBox result={setStatus.result} error={setStatus.error} />
    </View>
  );
}

// ── ESTADO: ACTIVO ────────────────────────────────────────────
function ActiveStateActions({ eventId, onChanged }: { eventId: string | null; onChanged: () => void }) {
  const { address } = useWallet();
  const buyTicket = useRpcAction<{ p_event_id: string; p_wallet_address: string; p_paid_slp: number; p_tx_hash: string }>("buy_ticket");
  const setStatus = useRpcAction<{ p_status: string }>("test_set_event_status");
  const [paidSlp, setPaidSlp] = useState("16500");
  const [qty, setQty] = useState("1");

  const handleBuyMultiple = async () => {
    if (!eventId || !address) return;
    const n = Math.max(1, Math.min(20, parseInt(qty, 10) || 1));
    for (let i = 0; i < n; i++) {
      await buyTicket.run({
        p_event_id: eventId,
        p_wallet_address: address,
        p_paid_slp: Number(paidSlp),
        p_tx_hash: "TEST-TX-" + Date.now() + "-" + i,
      });
    }
    onChanged();
  };

  return (
    <View style={{ gap: 10 }}>
      <ThemedText style={{ color: C.parchment, fontSize: 11, fontWeight: "700" }}>🎟 Simular compra de tickets</ThemedText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 2 }}>
          <TestInput value={paidSlp} onChangeText={setPaidSlp} placeholder="SLP por ticket" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <TestInput value={qty} onChangeText={setQty} placeholder="Cantidad" keyboardType="numeric" />
        </View>
      </View>
      <ActionButton label="COMPRAR TICKETS" icon="🎟" description="Cada compra puede subir de nivel" loading={buyTicket.loading}
        disabled={!eventId || !address} onPress={handleBuyMultiple} />
      {!address && <ThemedText style={{ color: C.crimson, fontSize: 9 }}>⚠ Conectá tu wallet primero (arriba)</ThemedText>}
      <ResultBox result={buyTicket.result} error={buyTicket.error} />

      {eventId && (
        <ActionButton label="CERRAR VENTA → SWAP" icon="⏭" color={C.purple} loading={setStatus.loading}
          onPress={async () => { await setStatus.run({ p_status: "swap" }); onChanged(); }} />
      )}
      <ResultBox result={setStatus.result} error={setStatus.error} />
    </View>
  );
}

// ── ESTADO: SWAP (con Axies reales de la wallet) ───────────────
function SwapStateActions({ eventId, onChanged }: { eventId: string | null; onChanged: () => void }) {
  const { address } = useWallet();
  const setStatus = useRpcAction<{ p_status: string }>("test_set_event_status");
  const swapAxie = useRpcAction<{ p_event_id: string; p_wallet_address: string; p_axie_id: string; p_floor_price_slp: number; p_tx_hash: string }>("swap_axie");

  const [axies, setAxies] = useState<Axie[]>([]);
  const [axiesLoading, setAxiesLoading] = useState(false);
  const [selected, setSelected] = useState<Axie | null>(null);
  const [floorSlp, setFloorSlp] = useState("150");

  useEffect(() => {
    if (!address) return;
    setAxiesLoading(true);
    getAxiesForWallet(address).then((list) => {
      setAxies(list);
      setAxiesLoading(false);
    });
  }, [address]);

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
    onChanged();
  };

  return (
    <View style={{ gap: 10 }}>
      <ThemedText style={{ color: C.parchment, fontSize: 11, fontWeight: "700" }}>🔮 Tus Axies (wallet conectada)</ThemedText>

      {!address ? (
        <ThemedText style={{ color: C.crimson, fontSize: 10 }}>Conectá tu wallet para ver tus Axies.</ThemedText>
      ) : axiesLoading ? (
        <ThemedText style={{ color: C.slate, fontSize: 10 }}>Cargando Axies...</ThemedText>
      ) : axies.length === 0 ? (
        <ThemedText style={{ color: C.slate, fontSize: 10 }}>No quedan Axies disponibles (o ya los swapeaste todos en este test).</ThemedText>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </ScrollView>
      )}

      <TestInput value={floorSlp} onChangeText={setFloorSlp} placeholder="Floor price en SLP" keyboardType="numeric" />
      <ActionButton
        label="EJECUTAR SWAP (destruye el Axie de la lista)"
        icon="🔮"
        description={selected ? `Entregás #${selected.id} por ${floorSlp} SLP` : "Elegí un Axie arriba"}
        color={C.purple}
        loading={swapAxie.loading}
        disabled={!selected || !eventId}
        onPress={handleSwap}
      />
      <ResultBox result={swapAxie.result} error={swapAxie.error} />

      {eventId && (
        <ActionButton label="CERRAR SWAP → SORTEAR" icon="⏭" color={C.ember} loading={setStatus.loading}
          onPress={async () => { await setStatus.run({ p_status: "sorteando" }); onChanged(); }} />
      )}
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
  const simulateBurn = useRpcAction("test_simulate_burn");
  const releaseAxies = useRpcAction("test_release_swapped_axies");
  const finalizeEvent = useRpcAction("test_finalize_event");
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
    const drawAllRewards = async () => {
      while (true) {
        const { data } = await drawNext.run({ p_event_id: eventId! });
        if (!data?.success) break;
      }
    };
    await Promise.all([drawAllRewards(), simulateBurn.run(), releaseAxies.run()]);
    await checkPending();
    onChanged();
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

      <ActionButton
        label="FINALIZAR EVENTO → COMPLETADO"
        icon="🏁"
        description="Requiere 0 rewards pendientes"
        color={C.greenBrt}
        loading={finalizeEvent.loading}
        disabled={!eventId || (pendingCount ?? 1) > 0}
        onPress={async () => { await finalizeEvent.run(); onChanged(); onComplete(); }}
      />
      <ResultBox result={finalizeEvent.result} error={finalizeEvent.error} />
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
      .select("event_number, label, ritual_level, total_tickets, total_raised_slp, axies_released")
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
            {summary.axies_released} Axies liberados
          </ThemedText>
        </View>
      )}
      <ThemedText style={{ color: C.slate, fontSize: 10 }}>
        Para probar un ciclo nuevo, volvé a PREVIO y creá otro evento de test.
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

// ── MAIN SCREEN ──────────────────────────────────────────────
export default function TestScreen() {
  const resetAll = useRpcAction("test_reset_all");
  const [eventId, setEventId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<StateKey | null>(null);

  const loadTestEvent = useCallback(async () => {
    const { data } = await supabase.from("events").select("id, status").eq("event_number", 0).maybeSingle();
    setEventId(data?.id ?? null);
    setCurrentState((data?.status as StateKey) ?? null);
  }, []);

  useEffect(() => { loadTestEvent(); }, [loadTestEvent]);

  useEffect(() => {
    const channel = supabase
      .channel("test-panel-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: "event_number=eq.0" }, () => loadTestEvent())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadTestEvent]);

  const handleSelectState = async (state: StateKey) => {
    if (!eventId) return;
    const dbStatus = state === "sorteando" ? "swap" : state;
    await supabase.rpc("test_set_event_status", { p_status: dbStatus });
    setCurrentState(state);
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

        <WalletPanel />

        <View style={{ borderWidth: 1, borderColor: C.borderMid, padding: 16, backgroundColor: C.surface, marginBottom: 16 }}>
          <StateSlider current={currentState} onSelect={handleSelectState} />

          {currentState === "previo" || currentState === null ? (
            <PreviewStateActions eventId={eventId} onChanged={loadTestEvent} />
          ) : currentState === "activo" ? (
            <ActiveStateActions eventId={eventId} onChanged={loadTestEvent} />
          ) : currentState === "swap" ? (
            <SwapStateActions eventId={eventId} onChanged={loadTestEvent} />
          ) : currentState === "sorteando" ? (
            <DrawingStateActions eventId={eventId} onChanged={loadTestEvent} onComplete={() => setCurrentState("completado")} />
          ) : currentState === "completado" ? (
            <CompletedStateActions eventId={eventId} />
          ) : null}
        </View>

        <AnnualSection />

        <View style={{ borderWidth: 1, borderColor: C.crimson, marginTop: 20, padding: 14, backgroundColor: C.surface }}>
          <ThemedText style={{ color: C.crimson, fontSize: 12, fontWeight: "900", marginBottom: 8 }}>⚠ RESET TOTAL DE TEST</ThemedText>
          <ThemedText style={{ color: C.slate, fontSize: 10, marginBottom: 10 }}>
            Borra todos los eventos de prueba (event_number ≤ 0) y llaves de test. No afecta eventos reales.
          </ThemedText>
          <ActionButton label="BORRAR TODOS LOS DATOS DE TEST" color={C.crimson} loading={resetAll.loading}
            onPress={async () => { await resetAll.run(); await loadTestEvent(); }} />
          <ResultBox result={resetAll.result} error={resetAll.error} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}