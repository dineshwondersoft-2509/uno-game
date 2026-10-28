import { CARDS_PER_PLAYER, CLASSIC_RULES } from "./constants";
import { createDeck, dealerValue, shuffleDeck } from "./deck";
import { drawCards } from "./draw";
import { formatCard, playerName } from "./format";
import { appendLog } from "./log";
import { nextSeat, opponent } from "./players";
import { beginTurn } from "./turn";
import type {
  Card,
  GameState,
  Player,
  PlayerId,
  RuleConfig,
  StartMatchOptions,
} from "./types";
import { COMPUTER_ID, HUMAN_ID } from "./types";

const DEFAULT_PLAYERS: Player[] = [
  { id: HUMAN_ID, name: "You", kind: "human", seat: 0 },
  { id: COMPUTER_ID, name: "Computer", kind: "ai", seat: 1 },
];

export function mergeRules(overrides?: Partial<RuleConfig>): RuleConfig {
  return { ...CLASSIC_RULES, ...overrides };
}

export function createFreshState(options: StartMatchOptions = {}): GameState {
  return {
    players: DEFAULT_PLAYERS,
    drawPile: [],
    discardPile: [],
    hands: { human: [], computer: [] },
    activeColor: null,
    currentPlayer: HUMAN_ID,
    dealer: HUMAN_ID,
    direction: 1,
    gamePhase: "setup",
    scores: { human: 0, computer: 0 },
    pendingAction: null,
    winner: null,
    matchWinner: null,
    drawnCardId: null,
    unoDeclared: { human: false, computer: false },
    lastHandScore: null,
    log: [],
    nextLogId: 1,
    rngSeed: options.seed ?? 1,
    rules: mergeRules(options.rules),
    aiDifficulty: options.difficulty ?? "medium",
    debug: options.debug ?? false,
    lastError: null,
    statusMessage: "Setting up",
    sfx: null,
    lastPlayedCardId: null,
    handNumber: 0,
    computerSaidUno: false,
    lastVoluntaryDraw: null,
  };
}

export function selectDealer(state: GameState): GameState {
  let seed = state.rngSeed;
  let deck = createDeck();
  const shuffled = shuffleDeck(deck, seed);
  deck = shuffled.deck;
  seed = shuffled.rngSeed;

  const drawn: { playerId: PlayerId; card: Card }[] = [];
  let humanValue = -1;
  let computerValue = -1;

  while (humanValue === computerValue) {
    if (deck.length < 2) {
      const reshuffle = shuffleDeck(createDeck(), seed);
      deck = reshuffle.deck;
      seed = reshuffle.rngSeed;
    }
    const computerCard = deck.pop()!;
    const humanCard = deck.pop()!;
    computerValue = dealerValue(computerCard);
    humanValue = dealerValue(humanCard);
    drawn.push(
      { playerId: COMPUTER_ID, card: computerCard },
      { playerId: HUMAN_ID, card: humanCard },
    );
  }

  const dealer = humanValue > computerValue ? HUMAN_ID : COMPUTER_ID;
  let next: GameState = {
    ...state,
    dealer,
    rngSeed: seed,
  };
  const lastHuman = drawn.filter((d) => d.playerId === HUMAN_ID).at(-1);
  const lastComputer = drawn.filter((d) => d.playerId === COMPUTER_ID).at(-1);
  if (lastHuman && lastComputer) {
    next = appendLog(
      next,
      `Dealer draw: Human ${formatCard(lastHuman.card)} (${humanValue}) vs Computer ${formatCard(lastComputer.card)} (${computerValue})`,
    );
  }
  next = appendLog(next, `${playerName(dealer)} is the dealer`);
  return next;
}

export function revealStartCard(
  drawPile: Card[],
  rngSeed: number,
): { startCard: Card; drawPile: Card[]; rngSeed: number } {
  let pile = [...drawPile];
  let seed = rngSeed;
  let start = pile.pop();
  if (!start) {
    throw new Error("Cannot reveal a start card from an empty pile.");
  }

  while (start.type === "wildDraw4") {
    pile.push(start);
    const shuffled = shuffleDeck(pile, seed);
    pile = shuffled.deck;
    seed = shuffled.rngSeed;
    start = pile.pop();
    if (!start) {
      throw new Error("Cannot reveal a start card from an empty pile.");
    }
  }

  return { startCard: start, drawPile: pile, rngSeed: seed };
}

export function dealHands(
  deck: Card[],
  dealer: PlayerId,
  players: Player[],
): { hands: GameState["hands"]; remaining: Card[] } {
  const hands: GameState["hands"] = { human: [], computer: [] };
  let remaining = [...deck];
  const ids = players.map((player) => player.id);
  const dealerIndex = ids.indexOf(dealer);
  const startIndex = (dealerIndex + 1) % ids.length;

  for (let round = 0; round < CARDS_PER_PLAYER; round += 1) {
    for (let offset = 0; offset < ids.length; offset += 1) {
      const playerId = ids[(startIndex + offset) % ids.length]!;
      const card = remaining.pop();
      if (!card) {
        throw new Error("Deck ran out while dealing.");
      }
      hands[playerId] = [...hands[playerId], card];
    }
  }

  return { hands, remaining };
}

export function processOpeningCard(
  state: GameState,
  startCard: Card,
  firstPlayer: PlayerId,
  dealer: PlayerId,
): GameState {
  let next: GameState = {
    ...state,
    discardPile: [startCard],
    activeColor: startCard.color,
    lastPlayedCardId: startCard.id,
  };
  next = appendLog(next, `Opening card: ${formatCard(startCard)}`);

  if (startCard.type === "draw2") {
    const drawn = drawCards(next, firstPlayer, 2);
    next = drawn.state;
    next = appendLog(
      next,
      `${playerName(firstPlayer)} drew 2 cards from opening Draw Two`,
    );
    next = {
      ...next,
      statusMessage:
        firstPlayer === HUMAN_ID
          ? "You must draw 2"
          : "Computer drew 2 from the opening card",
    };
    return beginTurn(next, dealer);
  }

  if (startCard.type === "skip") {
    next = appendLog(next, `${playerName(firstPlayer)} skipped by opening Skip`);
    return beginTurn(next, dealer);
  }

  if (startCard.type === "reverse") {
    next = { ...next, direction: -1 };
    next = appendLog(next, "Opening Reverse — dealer plays first");
    return beginTurn(next, dealer);
  }

  if (startCard.type === "wild") {
    return {
      ...next,
      activeColor: null,
      currentPlayer: firstPlayer,
      gamePhase: "choosingWildColor",
      statusMessage:
        firstPlayer === HUMAN_ID ? "Choose a color" : "Computer is thinking…",
      pendingAction: {
        type: "wildColor",
        playerId: firstPlayer,
        cardType: "wild",
        wasWildDrawFourLegal: null,
        previousColor: null,
        unoMissed: false,
        goingOut: false,
        isOpening: true,
      },
    };
  }

  return beginTurn(next, firstPlayer);
}

export function startNewHand(state: GameState): GameState {
  const preserved = {
    scores: state.scores,
    dealer: state.dealer,
    aiDifficulty: state.aiDifficulty,
    debug: state.debug,
    rules: state.rules,
    rngSeed: state.rngSeed,
    nextLogId: state.nextLogId,
    log: state.log,
    players: state.players,
    handNumber: state.handNumber + 1,
  };

  let next: GameState = {
    ...createFreshState({
      seed: preserved.rngSeed,
      difficulty: preserved.aiDifficulty,
      debug: preserved.debug,
      rules: preserved.rules,
    }),
    ...preserved,
    gamePhase: "setup",
    winner: null,
    matchWinner: null,
    lastHandScore: null,
    computerSaidUno: false,
  };

  const shuffled = shuffleDeck(createDeck(), next.rngSeed);
  const dealt = dealHands(shuffled.deck, next.dealer, next.players);
  const revealed = revealStartCard(dealt.remaining, shuffled.rngSeed);
  const firstPlayer = nextSeat(
    { ...next, currentPlayer: next.dealer, direction: 1 },
    next.dealer,
    1,
  );

  next = {
    ...next,
    hands: dealt.hands,
    drawPile: revealed.drawPile,
    rngSeed: revealed.rngSeed,
    direction: 1,
  };
  next = appendLog(next, `Hand ${next.handNumber} — dealing 7 cards each`);
  return processOpeningCard(next, revealed.startCard, firstPlayer, next.dealer);
}

export function startMatch(options: StartMatchOptions = {}): GameState {
  let state = createFreshState(options);
  state = selectDealer(state);
  return startNewHand(state);
}

export function resetMatch(state: GameState): GameState {
  return startMatch({
    seed: state.rngSeed + 7919,
    difficulty: state.aiDifficulty,
    debug: state.debug,
    rules: state.rules,
  });
}

export function rotateDealer(state: GameState): GameState {
  return {
    ...state,
    dealer: opponent(state.dealer),
  };
}

export function startNextHand(state: GameState): GameState {
  if (state.gamePhase !== "handOver") {
    return state;
  }
  return startNewHand(rotateDealer(state));
}
