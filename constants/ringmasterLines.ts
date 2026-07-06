/**
 * constants/ringmasterLines.ts
 *
 * Frases del Cirquero Oscuro (El Circo Oscuro / /swap). Todas en
 * primera persona, tono villano-teatral. Se elige una al azar en
 * cada momento en que el personaje "habla" en pantalla, para que
 * no repita siempre la misma línea.
 */

// ── Frase al invitarte a ofrecer un Axie (Pentagrama) ─────────────
export const RINGMASTER_INTRO_LINES: string[] = [
  "Dame uno... a cambio de unas monedas.",
  "Entregá tu criatura y no hagas preguntas.",
  "Todos venden algo tarde o temprano. Hoy te toca a vos.",
  "No sentís nada por ellos, ¿verdad? Mejor así.",
  "Un Axie menos en tu bolsillo, unas monedas más en el mío.",
  "Vine a comprar almas pequeñas. La tuya servirá.",
  "No pongas esa cara. Es solo un negocio... por ahora.",
  "Cuánto más rápido decidas, menos tiempo tengo para arrepentirme de pagarte de más.",
  "El circo siempre gana. Vos también, un poquito.",
  "Elegí bien. O no. A mí me da igual.",
];

// ── Frase al confirmar el trato (Modal de oferta), según la clase del Axie ──
export function getRingmasterOfferLine(axieClass: string): string {
  const cls = axieClass.toLowerCase();
  const templates = [
    `Mmh... un ${cls}... no vale gran cosa, pero te daré unas monedas. ¿Trato hecho?`,
    `Un ${cls} más para mi colección de cosas que nadie extrañará. Firmá aquí.`,
    `¿${cls}? Qué previsible. Aun así, lo tomo.`,
    `No preguntes qué hago con los ${cls}s que me traen. Solo firmá.`,
    `Este ${cls} tiene una mirada que no me gusta. Mejor, así no siento nada al llevármelo.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ── Frase cuando estás en cooldown y vuelve a aparecer ─────────────
export const RINGMASTER_COOLDOWN_LINES: string[] = [
  "Ya me dejaste algo hoy... volvé cuando el reloj se detenga, o convencéme para dejarte entrar de nuevo.",
  "¿Otra vez vos? El circo tiene reglas, incluso para los desesperados.",
  "Todavía no. A menos que traigas algo que me haga cambiar de opinión.",
  "El reloj no perdona. Pero el SLP sí, si tenés suficiente.",
  "Volviste rápido. Codicioso. Me agrada.",
  "No hay entradas gratis dos veces el mismo día... salvo que pagues por saltarte la fila.",
];

// ── Frase cuando la wallet no tiene ticket ──────────────────────────
export const RINGMASTER_NO_TICKET_LINES: string[] = [
  "Sin ticket no hay trato. Volvé cuando hayas participado del ritual.",
  "No dejo entrar a cualquiera. Conseguí tu ticket primero.",
  "El circo no es gratis, forastero. Volvé con tu entrada.",
];

// ── Frase cuando ya no le quedan Axies para ofrecer ─────────────────
export const RINGMASTER_NO_AXIES_LINES: string[] = [
  "No tenés nada que ofrecerme...",
  "Vaciaste los bolsillos. Volvé cuando tengas algo más.",
  "Nada. Qué decepción. Volvé con algo, lo que sea.",
];

export function pickRandom(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)];
}