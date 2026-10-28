import { canLegallyPlayWildDrawFour, canPlayCard } from "../engine/matching";
import type { Card } from "../engine/types";
import type { PublicAiView } from "./publicView";

export function scoreMove(card: Card, view: PublicAiView): number {
  const remaining = view.myHand.filter((item) => item.id !== card.id);
  const counts: Record<string, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  for (const item of remaining) {
    if (item.color) counts[item.color] += 1;
  }

  let score = 12;
  if (card.color) {
    score += (counts[card.color] ?? 0) * 4;
  }

  if (card.type === "skip" || card.type === "reverse") {
    score += 18;
    if (view.opponentHandSize <= 2) score += 16;
  }

  if (card.type === "draw2") {
    score += 14;
    if (view.opponentHandSize <= 2) score += 18;
  }

  if (card.type === "number") {
    score += 3;
    if (card.number === 0) score += 1;
  }

  if (card.type === "wild") {
    score -= view.difficulty === "easy" ? 0 : 10;
    if (view.opponentHandSize <= 2) score += 8;
  }

  if (card.type === "wildDraw4") {
    const legal = canLegallyPlayWildDrawFour(view.myHand, view.activeColor);
    if (legal) {
      score += 6;
    } else if (view.difficulty === "hard" && view.opponentHandSize <= 2) {
      score += 8;
    } else {
      score -= 40;
    }
    if (view.opponentHandSize <= 2) score += 16;
  }

  const hasOrdinary = view.myHand.some(
    (item) =>
      item.id !== card.id &&
      item.type !== "wild" &&
      item.type !== "wildDraw4" &&
      canPlayCard(item, view.topDiscard, view.activeColor),
  );
  if ((card.type === "wild" || card.type === "wildDraw4") && hasOrdinary) {
    score -= view.difficulty === "hard" ? 12 : 6;
  }

  if (view.opponentHandSize <= 2 && card.type === "number") {
    score -= 4;
  }

  return score;
}
