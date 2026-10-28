import { COMPUTER_ID, HUMAN_ID, type GameState, type PlayerId } from "./types";
import { topDiscard } from "./matching";
import {
  canSelectCardForPlay,
  explainWhyUnplayable,
  getPlayableCards,
} from "./matching";

export function isComputerDecisionPhase(state: GameState): boolean {
  if (
    state.gamePhase === "computerThinking" ||
    state.gamePhase === "computerDrewCard"
  ) {
    return true;
  }
  if (
    state.gamePhase === "choosingWildColor" &&
    state.pendingAction?.type === "wildColor" &&
    state.pendingAction.playerId === COMPUTER_ID
  ) {
    return true;
  }
  if (
    state.gamePhase === "awaitingWildDraw4Response" &&
    state.pendingAction?.type === "wildDraw4Response" &&
    state.pendingAction.targetId === COMPUTER_ID
  ) {
    return true;
  }
  return false;
}

export function isHumanInputPhase(state: GameState): boolean {
  return (
    state.gamePhase === "humanTurn" ||
    state.gamePhase === "humanDrewCard" ||
    (state.gamePhase === "choosingWildColor" &&
      state.pendingAction?.type === "wildColor" &&
      state.pendingAction.playerId === HUMAN_ID) ||
    (state.gamePhase === "awaitingWildDraw4Response" &&
      state.pendingAction?.type === "wildDraw4Response" &&
      state.pendingAction.targetId === HUMAN_ID)
  );
}

export function humanPlayableCards(state: GameState) {
  const top = topDiscard(state.discardPile);
  if (!top) return [];
  return getPlayableCards(
    state.hands.human,
    top,
    state.activeColor,
    state.drawnCardId,
  );
}

export function canHumanPlayCard(state: GameState, cardId: string): boolean {
  if (
    state.gamePhase !== "humanTurn" &&
    state.gamePhase !== "humanDrewCard"
  ) {
    return false;
  }
  const card = state.hands.human.find((item) => item.id === cardId);
  const top = topDiscard(state.discardPile);
  if (!card || !top) return false;
  return canSelectCardForPlay(card, top, state.activeColor, state.drawnCardId);
}

export function humanCardFeedback(state: GameState, cardId: string): string | null {
  const card = state.hands.human.find((item) => item.id === cardId);
  const top = topDiscard(state.discardPile);
  if (!card || !top) return "That card is not in your hand.";
  return explainWhyUnplayable(card, top, state.activeColor, state.drawnCardId);
}

export function canDeclareUno(state: GameState, playerId: PlayerId): boolean {
  if (state.currentPlayer !== playerId) return false;
  if (state.hands[playerId].length !== 2) return false;
  if (playerId === HUMAN_ID) {
    return state.gamePhase === "humanTurn" || state.gamePhase === "humanDrewCard";
  }
  return (
    state.gamePhase === "computerThinking" ||
    state.gamePhase === "computerDrewCard"
  );
}

export { topDiscard, getPlayableCards };
