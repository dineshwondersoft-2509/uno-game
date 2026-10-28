import { formatCard } from "./format";
import type { Card, HandScoreSummary, PlayerId, ScoreLine } from "./types";

export function cardPoints(card: Card): number {
  switch (card.type) {
    case "number":
      return card.number ?? 0;
    case "skip":
    case "reverse":
    case "draw2":
      return 20;
    case "wild":
    case "wildDraw4":
      return 50;
  }
}

export function calculateHandScore(hand: Card[]): {
  total: number;
  breakdown: ScoreLine[];
} {
  const breakdown = hand.map((card) => ({
    cardId: card.id,
    label: formatCard(card),
    points: cardPoints(card),
  }));
  const total = breakdown.reduce((sum, line) => sum + line.points, 0);
  return { total, breakdown };
}

export function checkMatchWinner(
  scores: { human: number; computer: number },
  pointsToWin: number,
): PlayerId | null {
  if (scores.human >= pointsToWin && scores.human >= scores.computer) {
    return "human";
  }
  if (scores.computer >= pointsToWin && scores.computer > scores.human) {
    return "computer";
  }
  if (scores.human >= pointsToWin) return "human";
  if (scores.computer >= pointsToWin) return "computer";
  return null;
}

export function makeHandScoreSummary(
  winner: PlayerId,
  loserHand: Card[],
): HandScoreSummary {
  const { total, breakdown } = calculateHandScore(loserHand);
  return { winner, points: total, breakdown };
}
