/**
 * contexts/test-mode-context.tsx
 *
 * "Modo test" global — a diferencia de la wallet (efímera, por wallet
 * y por pestaña), esto SÍ vive en la base (system_config), porque es
 * una preferencia de navegación, no de seguridad: cuando está prendido,
 * todas las pantallas muestran un botón "Volver a test"; cuando se
 * apaga, desaparece de todos lados menos de /test.
 *
 * Al estar en la base (no en memoria), si lo prendés en una pestaña,
 * las otras pestañas lo ven prendido también la próxima vez que carguen
 * esa pantalla (no hace falta que sea instantáneo entre pestañas).
 */
import { supabase } from "@/lib/supabase";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const CONFIG_KEY = "test_mode_enabled";

type TestModeContextValue = {
  enabled: boolean;
  loading: boolean;
  setEnabled: (value: boolean) => Promise<void>;
};

const TestModeContext = createContext<TestModeContextValue | null>(null);

export function TestModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("system_config").select("value").eq("key", CONFIG_KEY).maybeSingle();
    setEnabledState(data?.value === "true");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setEnabled = useCallback(async (value: boolean) => {
    setEnabledState(value); // optimista, se corrige solo si falla
    const { error } = await supabase.rpc("test_set_config", { p_key: CONFIG_KEY, p_value: value ? "true" : "false" });
    if (error) {
      console.error("[TestMode] No se pudo guardar:", error);
      await load(); // revertir al valor real de la base
    }
  }, [load]);

  return (
    <TestModeContext.Provider value={{ enabled, loading, setEnabled }}>
      {children}
    </TestModeContext.Provider>
  );
}

export function useTestMode() {
  const ctx = useContext(TestModeContext);
  if (!ctx) throw new Error("useTestMode debe usarse dentro de <TestModeProvider>");
  return ctx;
}