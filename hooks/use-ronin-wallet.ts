/**
 * hooks/use-ronin-wallet.ts
 *
 * Conecta directamente con la extensión Ronin Wallet (window.ronin)
 * Sin Waypoint, sin email — solo wallet EOA real.
 * Sesión efímera: vive solo en memoria (useState), se pierde al
 * cerrar/recargar el browser — tal como se pidió.
 *
 * Funciona en WEB solamente (Android se resuelve después con
 * @sky-mavis/waypoint-native o WalletConnect).
 */

import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

// ── TIPOS ────────────────────────────────────────────────────
export type WalletState = {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
};

type RoninProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    ronin?: { provider: RoninProvider };
  }
}

// ── CONSTANTES ───────────────────────────────────────────────
const RONIN_MAINNET_CHAIN_ID = "0x7e4"; // 2020 en hex
const RONIN_INSTALL_URL = "https://wallet.roninchain.com/";

// ── HELPER: detectar si la extensión está instalada ───────────
function getRoninProvider(): RoninProvider | null {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
  return window.ronin?.provider ?? null;
}

// ── HOOK PRINCIPAL ───────────────────────────────────────────
export function useRoninWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  // Detectar cambios de cuenta o desconexión desde la extensión
  useEffect(() => {
    const provider = getRoninProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setState({ address: null, isConnecting: false, isConnected: false, error: null });
      } else {
        setState((prev) => ({ ...prev, address: accounts[0], isConnected: true }));
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);
    return () => provider.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  // ── CONECTAR ─────────────────────────────────────────────
  const connect = useCallback(async (): Promise<string | null> => {
    const provider = getRoninProvider();

    if (!provider) {
      const msg = "Ronin Wallet no está instalada en este navegador.";
      setState((prev) => ({ ...prev, error: msg }));
      if (typeof window !== "undefined") {
        window.open(RONIN_INSTALL_URL, "_blank");
      }
      return null;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts: string[] = await provider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No se obtuvo ninguna cuenta de la wallet.");
      }

      const address = accounts[0];

      setState({
        address,
        isConnecting: false,
        isConnected: true,
        error: null,
      });

      return address;
    } catch (err: any) {
      // Código 4001 = usuario rechazó la conexión
      const msg =
        err?.code === 4001
          ? "Conexión rechazada por el usuario."
          : err?.message ?? "Error al conectar la wallet.";

      setState({
        address: null,
        isConnecting: false,
        isConnected: false,
        error: msg,
      });
      return null;
    }
  }, []);

  // ── FIRMAR MENSAJE (Sign-In with Wallet) ──────────────────
  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      const provider = getRoninProvider();
      if (!provider || !state.address) {
        setState((prev) => ({ ...prev, error: "Wallet no conectada." }));
        return null;
      }

      try {
        const signature: string = await provider.request({
          method: "personal_sign",
          params: [message, state.address],
        });
        return signature;
      } catch (err: any) {
        const msg =
          err?.code === 4001
            ? "Firma rechazada por el usuario."
            : err?.message ?? "Error al firmar el mensaje.";
        setState((prev) => ({ ...prev, error: msg }));
        return null;
      }
    },
    [state.address]
  );

  // ── DESCONECTAR (solo limpia el estado local) ─────────────
  const disconnect = useCallback(() => {
    setState({ address: null, isConnecting: false, isConnected: false, error: null });
  }, []);

  // ── VERIFICAR RED (debe estar en Ronin Mainnet) ───────────
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    const provider = getRoninProvider();
    if (!provider) return false;

    try {
      const chainId: string = await provider.request({ method: "eth_chainId" });
      return chainId === RONIN_MAINNET_CHAIN_ID;
    } catch {
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    checkNetwork,
    clearError,
    isAvailable: getRoninProvider() !== null,
  };
}