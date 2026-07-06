/**
 * components/PixelArt.tsx
 * Íconos de pixel art compartidos (candado, cirquero oscuro).
 */
import { View } from "react-native";

export function PixelPadlock({ size = 96 }: { size?: number }) {
  const p = size / 10;
  const r = "#ff0033", d = "#3a0510", a = "#ffb300", k = "transparent";
  const map = [
    [k,k,k,r,r,r,r,k,k,k],[k,k,r,d,d,d,d,r,k,k],[k,r,d,k,k,k,k,d,r,k],[k,r,d,k,k,k,k,d,r,k],
    [r,r,r,r,r,r,r,r,r,r],[r,d,d,d,d,d,d,d,d,r],[r,d,d,a,a,a,a,d,d,r],[r,d,d,a,k,k,a,d,d,r],
    [r,d,d,d,a,a,d,d,d,r],[r,r,r,r,r,r,r,r,r,r],
  ];
  return <View style={{ width: size, height: size }}>{map.map((row, y) => <View key={y} style={{ flexDirection: "row" }}>{row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}</View>)}</View>;
}

export function PixelRingmaster({ size = 100 }: { size?: number }) {
  const p = size / 12;
  const purple = "#6b1f8f", purpleD = "#4a1563", gold = "#ffb300", skin = "#c89a7a", k = "transparent", black = "#0a0a0a", white = "#e8e0d0";
  const map = [
    [k,k,k,k,gold,gold,gold,gold,k,k,k,k],
    [k,k,k,gold,purple,purple,purple,gold,k,k,k,k],
    [k,k,k,purple,purpleD,purpleD,purple,purple,k,k,k,k],
    [k,k,skin,skin,skin,skin,skin,k,k,k,k,k],
    [k,k,skin,black,skin,skin,black,k,k,k,k,k],
    [k,k,k,skin,skin,skin,skin,k,k,k,k,k],
    [k,gold,purple,purple,purple,purple,purple,gold,k,k,k,k],
    [gold,purple,purpleD,purple,purple,purpleD,purple,purple,gold,k,k,k],
    [k,purple,purpleD,purple,purple,purpleD,purple,k,k,k,k,k],
    [k,k,white,k,k,k,white,k,k,k,k,k],
    [k,k,black,k,k,k,black,k,k,k,k,k],
    [k,k,black,k,k,k,black,k,k,k,k,k],
  ];
  return <View style={{ width: size, height: size }}>{map.map((row, y) => <View key={y} style={{ flexDirection: "row" }}>{row.map((c, x) => <View key={x} style={{ width: p, height: p, backgroundColor: c }} />)}</View>)}</View>;
}