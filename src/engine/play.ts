import { drawCards } from "./draw";
import { finishHand } from "./end";
import { formatCard, playerName } from "./format";
import { appendLog, fail } from "./log";
import {
  canPlayCard,
  canSelectCardForPlay,
  isDrawnCardPlayable,
  topDiscard,
} from "./matching";
import { canLegallyPlayWildDrawFour } from "./matching";
import { beginTurn, drawTarget, isDrawPhase, isKeepDrawnPhase, isPlayersTurnPhase, nextPlayerAfterCard } from "./turn";
import type { Card, CardType, Direction, GameState, PlayerId } from "./types";
import { maybeApplyMissedUno } from "./uno";

export function applyCardEffect(
  state: GameState,
  actor: PlayerId,
  card: Card,
  unoMissed: boolean,
  goingOut: boolean,
): GameState {
  let next = state;
  let direction = next.direction;

  if (card.type === "reverse") {
    direction = (direction * -1) as Direction;
    next = { ...next, direction };
    next = appendLog(next, "Direction reversed");
    if (next.players.length === 2) {
      next = appendLog(next, `${playerName(actor)} plays again`);
    }
  }

  if (card.type === "skip") {
    const skipped = drawTarget(next, actor);
    next = appendLog(next, `${playerName(skipped)} skipped`);
    if (next.players.length === 2) {
      next = appendLog(next, `${playerName(actor)} plays again`);
    }
  }

  if (card.type === "draw2") {
    const target = drawTarget(next, actor);
    const drawn = drawCards(next, target, 2);
    next = drawn.state;
    next = appendLog(next, `${playerName(target)} drew 2 cards`);
    next = {
      ...next,
      statusMessage:
        target === "human"
          ? "You must draw 2"
          : `${playerName(actor)} played Draw Two`,
    };
    if (next.players.length === 2) {
      next = appendLog(next, `${playerName(actor)} plays again`);
    }
  }

  const nextPlayer = nextPlayerAfterCard(next, actor, card.type);

  if (goingOut) {
    return finishHand(next, actor);
  }

  next = maybeApplyMissedUno(next, actor, unoMissed);
  return beginTurn(next, nextPlayer);
}

export function playCard(
  state: GameState,
  playerId: PlayerId,
  cardId: string,
): GameState {
  if (!isPlayersTurnPhase(state, playerId)) {
    return fail(state, "It is not your turn to play.");
  }

  const hand = state.hands[playerId];
  const card = hand.find((item) => item.id === cardId);
  if (!card) {
    return fail(state, "That card is not in your hand.");
  }

  const top = topDiscard(state.discardPile);
  if (!top) {
    return fail(state, "There is no discard pile.");
  }

  if (!canSelectCardForPlay(card, top, state.activeColor, state.drawnCardId)) {
    if (state.drawnCardId && card.id !== state.drawnCardId) {
      return fail(state, "After drawing, you may only play the card you just drew.");
    }
    return fail(state, "Match the current color, number, or symbol.");
  }

  const previousColor = state.activeColor;
  const wasWdfLegal =
    card.type === "wildDraw4"
      ? canLegallyPlayWildDrawFour(hand, state.activeColor)
      : null;

  const goingOut = hand.length === 1;
  const unoMissed = hand.length === 2 && !state.unoDeclared[playerId];

  const newHand = hand.filter((item) => item.id !== cardId);
  let next: GameState = {
    ...state,
    hands: { ...state.hands, [playerId]: newHand },
    discardPile: [...state.discardPile, card],
    drawnCardId: null,
    lastError: null,
    lastPlayedCardId: card.id,
    lastVoluntaryDraw: null,
    sfx: isActionType(card.type) ? "action" : "play",
    unoDeclared: {
      ...state.unoDeclared,
      [playerId]: newHand.length === 1 && state.unoDeclared[playerId],
    },
  };

  if (card.color) {
    next = { ...next, activeColor: card.color };
  }

  next = appendLog(next, `${playerName(playerId)} played ${formatCard(card)}`);

  if (newHand.length === 1 && state.unoDeclared[playerId]) {
    if (playerId === "computer") {
      next = { ...next, computerSaidUno: true, statusMessage: "Computer says UNO!" };
    }
  }

  if (card.type === "wild" || card.type === "wildDraw4") {
    return {
      ...next,
      gamePhase: "choosingWildColor",
      statusMessage:
        playerId === "human" ? "Choose a color" : "Computer is thinking…",
      pendingAction: {
        type: "wildColor",
        playerId,
        cardType: card.type,
        wasWildDrawFourLegal: wasWdfLegal,
        previousColor,
        unoMissed,
        goingOut,
        isOpening: false,
      },
    };
  }

  return applyCardEffect(next, playerId, card, unoMissed, goingOut);
}

export function drawOneCard(state: GameState, playerId: PlayerId): GameState {
  if (!isDrawPhase(state, playerId)) {
    return fail(state, "You cannot draw right now.");
  }
  if (state.drawnCardId) {
    return fail(state, "You already drew a card.");
  }

  const top = topDiscard(state.discardPile);
  if (!top) {
    return fail(state, "There is no discard pile.");
  }

  const result = drawCards(state, playerId, 1);
  if (result.drawn.length === 0) {
    let next = appendLog(result.state, "No cards left to draw");
    return beginTurn(next, nextPlayerAfterCard(next, playerId, "number"));
  }

  const drawnCard = result.drawn[0]!;
  let next = result.state;
  next = {
    ...next,
    drawnCardId: drawnCard.id,
    lastError: null,
    lastVoluntaryDraw: { playerId, color: state.activeColor },
    sfx: "draw",
  };
  next = appendLog(next, `${playerName(playerId)} drew 1 card`);

  if (!isDrawnCardPlayable(drawnCard, top, next.activeColor)) {
    next = appendLog(next, `${playerName(playerId)} kept the drawn card`);
    return beginTurn(next, nextPlayerAfterCard(next, playerId, "number"));
  }

  const isHuman = playerId === "human";
  return {
    ...next,
    gamePhase: isHuman ? "humanDrewCard" : "computerDrewCard",
    statusMessage: isHuman
      ? "Play the drawn card or keep it"
      : "Computer is thinking…",
  };
}

export function keepDrawnCard(state: GameState, playerId: PlayerId): GameState {
  if (!isKeepDrawnPhase(state, playerId) || !state.drawnCardId) {
    return fail(state, "You have no drawn card to keep.");
  }
  let next = appendLog(state, `${playerName(playerId)} kept the drawn card`);
  next = { ...next, lastError: null };
  return beginTurn(next, nextPlayerAfterCard(next, playerId, "number"));
}

function isActionType(type: CardType): boolean {
  return (
    type === "skip" ||
    type === "reverse" ||
    type === "draw2" ||
    type === "wild" ||
    type === "wildDraw4"
  );
}

export function canHumanDraw(state: GameState): boolean {
  return isDrawPhase(state, "human");
}

export function isCardPlayableNow(state: GameState, card: Card): boolean {
  const top = topDiscard(state.discardPile);
  if (!top) return false;
  return canSelectCardForPlay(card, top, state.activeColor, state.drawnCardId);
}

export function isCardMatching(state: GameState, card: Card): boolean {
  const top = topDiscard(state.discardPile);
  if (!top) return false;
  return canPlayCard(card, top, state.activeColor) || card.type === "wildDraw4";
}
