/**
 * contexts/wallet-context.tsx
 *
 * Estado global de la sesión de wallet — compartido por toda la app
 * (Profile, Swap, Special, etc.) sin necesidad de reconectar en cada
 * pantalla.
 *
 * Sesión EFÍMERA: vive en memoria, se pierde al cerrar/recargar el
 * browser. No hay persistencia intencional.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Platform } from "react-native";

// ── TIPOS ────────────────────────────────────────────────────
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

type WalletContextValue = {
  address: string | null;
  isConnecting: boolean;
  isVerifying: boolean;
  isConnected: boolean;
  isAuthenticated: boolean; // conectada Y firmó el mensaje
  error: string | null;
  isAvailable: boolean;
  connectAndAuthenticate: () => Promise<boolean>;
  disconnect: () => void;
  clearError: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

// ── CONSTANTES ───────────────────────────────────────────────
const RONIN_INSTALL_URL = "https://wallet.roninchain.com/";
const APP_NAME = "Fynolt's Cult";

function getRoninProvider(): RoninProvider | null {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
  return window.ronin?.provider ?? null;
}

function buildAuthMessage(): string {
  const nonce = Math.random().toString(36).slice(2, 10);
  return `Autenticarse en ${APP_NAME}\nNonce: ${nonce}\nFecha: ${new Date().toISOString()}`;
}

// ── PROVIDER ─────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectAndAuthenticate = useCallback(async (): Promise<boolean> => {
    const provider = getRoninProvider();

    if (!provider) {
      setError("Ronin Wallet no está instalada en este navegador.");
      if (typeof window !== "undefined") {
        window.open(RONIN_INSTALL_URL, "_blank");
      }
      return false;
    }

    setError(null);
    setIsConnecting(true);

    try {
      // 1 — Conectar
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No se obtuvo ninguna cuenta de la wallet.");
      }
      const walletAddress = accounts[0];
      setIsConnecting(false);

      // 2 — Firmar mensaje para verificar identidad
      setIsVerifying(true);
      const message = buildAuthMessage();
      const signature: string = await provider.request({
        method: "personal_sign",
        params: [message, walletAddress],
      });

      if (!signature) {
        throw new Error("No se recibió la firma.");
      }

      // Conexión + firma exitosas
      setAddress(walletAddress);
      setIsAuthenticated(true);
      setIsVerifying(false);
      return true;
    } catch (err: any) {
      const msg =
        err?.code === 4001
          ? "Operación rechazada por el usuario."
          : err?.message ?? "Error al conectar la wallet.";
      setError(msg);
      setIsConnecting(false);
      setIsVerifying(false);
      setAddress(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value: WalletContextValue = {
    address,
    isConnecting,
    isVerifying,
    isConnected: !!address,
    isAuthenticated,
    error,
    isAvailable: getRoninProvider() !== null,
    connectAndAuthenticate,
    disconnect,
    clearError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// ── HOOK ─────────────────────────────────────────────────────
export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet debe usarse dentro de un <WalletProvider>");
  }
  return ctx;
}
