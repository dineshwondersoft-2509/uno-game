import type { Card, CardColor } from "./types";

export function topDiscard(discardPile: Card[]): Card | null {
  if (discardPile.length === 0) return null;
  return discardPile[discardPile.length - 1]!;
}

export function canPlayCard(
  card: Card,
  topDiscardCard: Card,
  activeColor: CardColor | null,
): boolean {
  if (card.type === "wild") return true;
  if (card.type === "wildDraw4") return false;

  if (activeColor !== null && card.color === activeColor) return true;

  if (
    card.type === "number" &&
    topDiscardCard.type === "number" &&
    card.number === topDiscardCard.number
  ) {
    return true;
  }

  if (
    card.type !== "number" &&
    card.type === topDiscardCard.type &&
    (card.type === "skip" || card.type === "reverse" || card.type === "draw2")
  ) {
    return true;
  }

  return false;
}

export function canLegallyPlayWildDrawFour(
  hand: Card[],
  activeColor: CardColor | null,
): boolean {
  if (activeColor === null) return true;
  return !hand.some((card) => card.color === activeColor);
}

export function canSelectCardForPlay(
  card: Card,
  topDiscardCard: Card,
  activeColor: CardColor | null,
  drawnCardId: string | null,
): boolean {
  if (drawnCardId !== null && card.id !== drawnCardId) return false;
  if (card.type === "wildDraw4") return true;
  return canPlayCard(card, topDiscardCard, activeColor);
}

export function getPlayableCards(
  hand: Card[],
  topDiscardCard: Card,
  activeColor: CardColor | null,
  drawnCardId: string | null = null,
): Card[] {
  return hand.filter((card) =>
    canSelectCardForPlay(card, topDiscardCard, activeColor, drawnCardId),
  );
}

export function isDrawnCardPlayable(
  card: Card,
  topDiscardCard: Card,
  activeColor: CardColor | null,
): boolean {
  if (card.type === "wildDraw4") return true;
  return canPlayCard(card, topDiscardCard, activeColor);
}

export function explainWhyUnplayable(
  card: Card,
  topDiscardCard: Card,
  activeColor: CardColor | null,
  drawnCardId: string | null,
): string | null {
  if (canSelectCardForPlay(card, topDiscardCard, activeColor, drawnCardId)) {
    return null;
  }
  if (drawnCardId !== null && card.id !== drawnCardId) {
    return "After drawing, you may only play the card you just drew.";
  }
  return "Match the current color, number, or symbol.";
}

export function wasWildDrawFourLegal(
  handAtPlayTime: Card[],
  previousActiveColor: CardColor | null,
): boolean {
  return canLegallyPlayWildDrawFour(handAtPlayTime, previousActiveColor);
}
