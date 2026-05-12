/**
 * GothicExpandButton
 *
 * Botón "+" estilo Diablo 2 / dark RPG.
 * Dibujado en SVG puro — sin dependencias de icon packs.
 * Requiere: npx expo install react-native-svg
 *
 * Uso:
 *   <GothicExpandButton
 *     expanded={showAll}
 *     onPress={() => setShowAll(!showAll)}
 *     label="VER TODOS LOS REGISTROS"
 *   />
 */

import { ThemedText } from "@/components/themed-text";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Polygon, Rect } from "react-native-svg";

// ─── Colores (copiados del tema arcano de la app) ───────────────
const C = {
  crimson: "#CC0000",
  crimsonBrt: "#FF2200",
  crimsonDim: "#CC000030",
  gold: "#B8860B",
  goldBrt: "#D4A017",
  border: "#2a0000",
  borderMid: "#550000",
  bg: "#000000",
  surface: "#0b0000",
  parchment: "#C8BEB0",
  slate: "#5a5a6a",
};

// ─── Icono "+" estilo Diablo 2 ───────────────────────────────────
//
// Anatomía del icono:
//   - Cruz principal con brazos gruesos
//   - Remates angulares en las 4 puntas (como el botón de expand del inventario de D2)
//   - Puntos de diamante en las intersecciones de los remates
//   - Contorno oscuro para dar profundidad (efecto 3D grabado)
//
function D2PlusIcon({
  size = 36,
  color = C.crimson,
  collapsed = true,
}: {
  size?: number;
  color?: string;
  collapsed?: boolean;
}) {
  const s = size;
  const c = s / 2; // centro
  const arm = s * 0.16; // grosor del brazo
  const end = s * 0.1; // tamaño del remate angular
  const tip = s * 0.08; // punta del remate

  // Coordenadas del brazo horizontal (sin remates)
  const hx1 = s * 0.15,
    hx2 = s * 0.85;
  const hy1 = c - arm,
    hy2 = c + arm;

  // Coordenadas del brazo vertical
  const vx1 = c - arm,
    vx2 = c + arm;
  const vy1 = s * 0.15,
    vy2 = s * 0.85;

  // Remates angulares en cada punta — polígono con forma de "ojo de hacha"
  // Remate izquierdo
  const rL = `${hx1},${c - end}  ${hx1 - tip * 1.5},${c}  ${hx1},${c + end}`;
  // Remate derecho
  const rR = `${hx2},${c - end}  ${hx2 + tip * 1.5},${c}  ${hx2},${c + end}`;
  // Remate arriba
  const rT = `${c - end},${vy1}  ${c},${vy1 - tip * 1.5}  ${c + end},${vy1}`;
  // Remate abajo
  const rB = `${c - end},${vy2}  ${c},${vy2 + tip * 1.5}  ${c + end},${vy2}`;

  // Sombra oscura offset para efecto 3D grabado
  const shadow = "#1a0000";
  const glow = collapsed ? color : C.goldBrt;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* ── Sombra 3D (offset +1,+1) ── */}
      <Rect
        x={hx1 + 1}
        y={hy1 + 1}
        width={hx2 - hx1}
        height={hy2 - hy1}
        fill={shadow}
      />
      <Rect
        x={vx1 + 1}
        y={vy1 + 1}
        width={vx2 - vx1}
        height={vy2 - vy1}
        fill={shadow}
      />
      <Polygon
        points={rL
          .split("  ")
          .map((p) => {
            const [px, py] = p.split(",");
            return `${+px + 1},${+py + 1}`;
          })
          .join(" ")}
        fill={shadow}
      />
      <Polygon
        points={rR
          .split("  ")
          .map((p) => {
            const [px, py] = p.split(",");
            return `${+px + 1},${+py + 1}`;
          })
          .join(" ")}
        fill={shadow}
      />
      <Polygon
        points={rT
          .split("  ")
          .map((p) => {
            const [px, py] = p.split(",");
            return `${+px + 1},${+py + 1}`;
          })
          .join(" ")}
        fill={shadow}
      />
      <Polygon
        points={rB
          .split("  ")
          .map((p) => {
            const [px, py] = p.split(",");
            return `${+px + 1},${+py + 1}`;
          })
          .join(" ")}
        fill={shadow}
      />

      {/* ── Cruz principal ── */}
      <Rect x={hx1} y={hy1} width={hx2 - hx1} height={hy2 - hy1} fill={glow} />
      <Rect x={vx1} y={vy1} width={vx2 - vx1} height={vy2 - vy1} fill={glow} />

      {/* ── Remates angulares ── */}
      <Polygon points={rL} fill={glow} />
      <Polygon points={rR} fill={glow} />
      <Polygon points={rT} fill={glow} />
      <Polygon points={rB} fill={glow} />

      {/* ── Highlight superior izquierdo (borde iluminado) ── */}
      <Rect
        x={hx1}
        y={hy1}
        width={hx2 - hx1}
        height={1}
        fill={glow + "aa"}
        opacity={0.6}
      />
      <Rect
        x={vx1}
        y={vy1}
        width={1}
        height={vy2 - vy1}
        fill={glow + "aa"}
        opacity={0.6}
      />

      {/* ── Punto central (diamante) ── */}
      <Polygon
        points={`${c},${c - arm * 0.7}  ${c + arm * 0.7},${c}  ${c},${c + arm * 0.7}  ${c - arm * 0.7},${c}`}
        fill={C.bg}
        opacity={0.5}
      />
    </Svg>
  );
}

// ─── Botón completo ──────────────────────────────────────────────
export function GothicExpandButton({
  expanded,
  onPress,
  label = "VER REGISTROS",
  labelCollapsed,
  labelExpanded,
}: {
  expanded: boolean;
  onPress: () => void;
  label?: string;
  labelCollapsed?: string;
  labelExpanded?: string;
}) {
  // Animación de rotación del ícono al expandir/colapsar
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"], // + rota 45° → se convierte en ✕
  });

  const displayLabel = expanded
    ? (labelExpanded ?? label)
    : (labelCollapsed ?? label);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={bs.wrapper}>
      {/* Línea izquierda decorativa */}
      <View style={bs.line} />

      {/* Ícono + */}
      <View style={bs.iconContainer}>
        {/* Glow de fondo */}
        <View
          style={[
            bs.glow,
            { backgroundColor: expanded ? C.goldBrt + "25" : C.crimsonDim },
          ]}
        />
        {/* Marco cuadrado estilo D2 */}
        <View
          style={[bs.frame, { borderColor: expanded ? C.goldBrt : C.crimson }]}
        >
          {/* Corner brackets del frame */}
          <View
            style={[
              bs.corner,
              bs.cornerTL,
              { borderColor: expanded ? C.goldBrt : C.crimson },
            ]}
          />
          <View
            style={[
              bs.corner,
              bs.cornerTR,
              { borderColor: expanded ? C.goldBrt : C.crimson },
            ]}
          />
          <View
            style={[
              bs.corner,
              bs.cornerBL,
              { borderColor: expanded ? C.goldBrt : C.crimson },
            ]}
          />
          <View
            style={[
              bs.corner,
              bs.cornerBR,
              { borderColor: expanded ? C.goldBrt : C.crimson },
            ]}
          />
          {/* Ícono rotando */}
          <Animated.View style={{ transform: [{ rotate }] }}>
            <D2PlusIcon
              size={28}
              color={expanded ? C.goldBrt : C.crimson}
              collapsed={!expanded}
            />
          </Animated.View>
        </View>
      </View>

      {/* Label */}
      <ThemedText
        style={[bs.label, { color: expanded ? C.goldBrt : C.crimson }]}
      >
        {displayLabel}
      </ThemedText>

      {/* Línea derecha decorativa */}
      <View style={bs.line} />
    </TouchableOpacity>
  );
}

const bs = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: C.borderMid,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  frame: {
    width: 46,
    height: 46,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
    position: "relative",
  },
  corner: { position: "absolute", width: 6, height: 6 },
  cornerTL: { top: -1, left: -1, borderTopWidth: 1, borderLeftWidth: 1 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 1, borderRightWidth: 1 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 1, borderLeftWidth: 1 },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.5,
  },
});
