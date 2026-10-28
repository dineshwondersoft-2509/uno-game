import { COLORS } from "./constants";
import { nextRng } from "./rng";
import type { Card, CardColor, CardType } from "./types";

export function createDeck(): Card[] {
  const cards: Card[] = [];

  for (const color of COLORS) {
    cards.push(makeNumber(color, 0, "a"));
    for (let n = 1; n <= 9; n += 1) {
      cards.push(makeNumber(color, n, "a"));
      cards.push(makeNumber(color, n, "b"));
    }
    for (const type of ["skip", "reverse", "draw2"] as const) {
      cards.push(makeAction(color, type, "a"));
      cards.push(makeAction(color, type, "b"));
    }
  }

  for (let i = 0; i < 4; i += 1) {
    cards.push({ id: `wild-${i}`, color: null, type: "wild" });
    cards.push({ id: `wildDraw4-${i}`, color: null, type: "wildDraw4" });
  }

  return cards;
}

function makeNumber(color: CardColor, number: number, copy: string): Card {
  return {
    id: `${color}-${number}-${copy}`,
    color,
    type: "number",
    number,
  };
}

function makeAction(
  color: CardColor,
  type: Extract<CardType, "skip" | "reverse" | "draw2">,
  copy: string,
): Card {
  return {
    id: `${color}-${type}-${copy}`,
    color,
    type,
  };
}

export function shuffleDeck(
  deck: Card[],
  rngSeed: number,
): { deck: Card[]; rngSeed: number } {
  const cards = [...deck];
  let seed = rngSeed;
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const r = nextRng(seed);
    seed = r.nextSeed;
    const j = Math.min(i, Math.floor(r.value * (i + 1)));
    const current = cards[i]!;
    cards[i] = cards[j]!;
    cards[j] = current;
  }
  return { deck: cards, rngSeed: seed };
}

export function dealerValue(card: Card): number {
  if (card.type === "number" && typeof card.number === "number") {
    return card.number;
  }
  return 0;
}
