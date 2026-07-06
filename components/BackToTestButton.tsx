/**
 * components/BackToTestButton.tsx
 *
 * Botón flotante "Volver a test" — aparece en TODAS las pantallas
 * menos /test mismo, pero SOLO si el modo test está prendido
 * (toggle en /test). Usa router.push (no <a href>) para que la
 * navegación sea del lado del cliente y no tire la sesión de wallet.
 */
import { useTestMode } from "@/contexts/test-mode-context";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export function BackToTestButton() {
  const { enabled } = useTestMode();
  const pathname = usePathname();
  const router = useRouter();

  if (!enabled) return null;
  if (pathname === "/test") return null;

  return (
    <TouchableOpacity style={s.btn} onPress={() => router.push("/test")} activeOpacity={0.8}>
      <Text style={s.txt}>⚠ VOLVER A TEST</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#CC0000",
    borderWidth: 1.5,
    borderColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 9999,
    elevation: 10,
  },
  txt: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
});