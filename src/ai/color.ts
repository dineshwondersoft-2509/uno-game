import { COLORS } from "../engine/constants";
import type { Card, CardColor } from "../engine/types";
import { nextRng } from "../engine/rng";

export function colorCounts(hand: Card[]): Record<CardColor, number> {
  const counts: Record<CardColor, number> = {
    red: 0,
    yellow: 0,
    green: 0,
    blue: 0,
  };
  for (const card of hand) {
    if (card.color) {
      counts[card.color] += 1;
    }
  }
  return counts;
}

export function strongestColors(hand: Card[]): CardColor[] {
  const counts = colorCounts(hand);
  let best = 0;
  for (const color of COLORS) {
    if (counts[color] > best) best = counts[color];
  }
  const leaders = COLORS.filter((color) => counts[color] === best);
  return leaders.length > 0 ? [...leaders] : [...COLORS];
}

export function pickColorFromHand(
  hand: Card[],
  rngSeed: number,
): { color: CardColor; rngSeed: number } {
  const remaining = hand.filter(
    (card) => card.type !== "wild" && card.type !== "wildDraw4",
  );
  const pool = remaining.length > 0 ? remaining : hand;
  const leaders = strongestColors(pool);
  const pick = nextRng(rngSeed);
  const index = Math.min(leaders.length - 1, Math.floor(pick.value * leaders.length));
  return { color: leaders[index] ?? "red", rngSeed: pick.nextSeed };
}

export function observedHumanColors(discardHistory: Card[]): CardColor[] {
  const colors: CardColor[] = [];
  for (const card of discardHistory) {
    if (card.color) colors.push(card.color);
  }
  return colors;
}
