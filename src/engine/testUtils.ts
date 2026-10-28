import { CLASSIC_RULES } from "./constants";
import { createFreshState } from "./setup";
import type {
  Card,
  CardColor,
  CardType,
  GamePhase,
  GameState,
  PlayerId,
} from "./types";

let testId = 0;

export function testCard(partial: {
  color: CardColor | null;
  type: CardType;
  number?: number;
  id?: string;
}): Card {
  testId += 1;
  return {
    id: partial.id ?? `test-${partial.type}-${testId}`,
    color: partial.color,
    type: partial.type,
    number: partial.number,
  };
}

export function numberCard(color: CardColor, n: number, id?: string): Card {
  return testCard({ color, type: "number", number: n, id });
}

export function skipCard(color: CardColor, id?: string): Card {
  return testCard({ color, type: "skip", id });
}

export function reverseCard(color: CardColor, id?: string): Card {
  return testCard({ color, type: "reverse", id });
}

export function draw2Card(color: CardColor, id?: string): Card {
  return testCard({ color, type: "draw2", id });
}

export function wildCard(id?: string): Card {
  return testCard({ color: null, type: "wild", id });
}

export function wildDraw4Card(id?: string): Card {
  return testCard({ color: null, type: "wildDraw4", id });
}

export type TestGameConfig = {
  seed?: number;
  humanHand: Card[];
  computerHand: Card[];
  drawPile?: Card[];
  discardTop: Card;
  activeColor: CardColor;
  currentPlayer?: PlayerId;
  dealer?: PlayerId;
  scores?: { human: number; computer: number };
  phase?: GamePhase;
  direction?: 1 | -1;
  drawnCardId?: string | null;
  unoDeclared?: { human: boolean; computer: boolean };
  debug?: boolean;
};

export function createTestGame(config: TestGameConfig): GameState {
  const base = createFreshState({
    seed: config.seed ?? 1,
    debug: config.debug ?? true,
  });
  const currentPlayer = config.currentPlayer ?? "human";
  const phase =
    config.phase ??
    (currentPlayer === "human" ? "humanTurn" : "computerThinking");

  return {
    ...base,
    hands: {
      human: config.humanHand,
      computer: config.computerHand,
    },
    drawPile: config.drawPile ?? fillerDrawPile(20),
    discardPile: [config.discardTop],
    activeColor: config.activeColor,
    currentPlayer,
    dealer: config.dealer ?? "computer",
    direction: config.direction ?? 1,
    gamePhase: phase,
    scores: config.scores ?? { human: 0, computer: 0 },
    drawnCardId: config.drawnCardId ?? null,
    unoDeclared: config.unoDeclared ?? { human: false, computer: false },
    rules: CLASSIC_RULES,
    lastPlayedCardId: config.discardTop.id,
    statusMessage: currentPlayer === "human" ? "Your turn" : "Computer is thinking…",
  };
}

function fillerDrawPile(count: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i += 1) {
    cards.push(numberCard("blue", (i % 9) + 1, `draw-filler-${i}`));
  }
  return cards;
}
