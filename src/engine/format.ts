import type { Card, CardColor, PlayerId } from "./types";
import { COMPUTER_ID } from "./types";

export function capitalize(value: string): string {
  if (value.length === 0) return value;
  return value[0]!.toUpperCase() + value.slice(1);
}

export function playerName(id: PlayerId): string {
  return id === COMPUTER_ID ? "Computer" : "Human";
}

export function formatCard(card: Card): string {
  if (card.type === "wild") return "Wild";
  if (card.type === "wildDraw4") return "Wild Draw Four";
  const color = card.color ? capitalize(card.color) : "";
  if (card.type === "number") return `${color} ${card.number}`;
  if (card.type === "skip") return `${color} Skip`;
  if (card.type === "reverse") return `${color} Reverse`;
  return `${color} Draw Two`;
}

export function formatColor(color: CardColor): string {
  return capitalize(color);
}

export function cardAriaLabel(card: Card): string {
  return formatCard(card);
}
