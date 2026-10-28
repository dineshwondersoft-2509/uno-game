import { shuffleDeck } from "./deck";
import { formatCard } from "./format";
import type { Card, GameState, PlayerId } from "./types";

export function replenishDrawPile(state: GameState): GameState {
  if (state.drawPile.length > 0) return state;
  if (state.discardPile.length <= 1) return state;

  const top = state.discardPile[state.discardPile.length - 1]!;
  const rest = state.discardPile.slice(0, -1);
  const shuffled = shuffleDeck(rest, state.rngSeed);

  return {
    ...state,
    drawPile: shuffled.deck,
    discardPile: [top],
    rngSeed: shuffled.rngSeed,
  };
}

export function drawCards(
  state: GameState,
  playerId: PlayerId,
  count: number,
): { state: GameState; drawn: Card[] } {
  let next = state;
  const drawn: Card[] = [];

  for (let i = 0; i < count; i += 1) {
    if (next.drawPile.length === 0) {
      next = replenishDrawPile(next);
    }
    if (next.drawPile.length === 0) {
      break;
    }
    const card = next.drawPile[next.drawPile.length - 1]!;
    next = {
      ...next,
      drawPile: next.drawPile.slice(0, -1),
      hands: {
        ...next.hands,
        [playerId]: [...next.hands[playerId], card],
      },
    };
    drawn.push(card);
  }

  return { state: next, drawn };
}

export function describeDrawn(drawn: Card[]): string {
  if (drawn.length === 1) {
    return formatCard(drawn[0]!);
  }
  return `${drawn.length} cards`;
}
