/**
 * hooks/use-countdown.ts
 *
 * Cuenta regresiva genérica hasta un timestamp (deadline).
 * Se usa en /milestone (ventana de venta) y en /swap (ventana de swap).
 */

import { useEffect, useState } from "react";

export function useCountdown(deadline: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (!deadline) return null;
  const msLeft = Math.max(deadline - now, 0);
  const totalSeconds = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { msLeft, days, hours, minutes, seconds, expired: msLeft <= 0 };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");