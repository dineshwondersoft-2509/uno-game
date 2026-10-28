import { HUMAN_ID, type CardType, type GameState, type PlayerId } from "./types";
import { nextSeat, playerCount } from "./players";

export function beginTurn(state: GameState, playerId: PlayerId): GameState {
  const isHuman = playerId === HUMAN_ID;
  return {
    ...state,
    currentPlayer: playerId,
    gamePhase: isHuman ? "humanTurn" : "computerThinking",
    drawnCardId: null,
    lastError: null,
    unoDeclared: { human: false, computer: false },
    computerSaidUno: false,
    statusMessage: isHuman ? "Your turn" : "Computer is thinking…",
  };
}

export function nextPlayerAfterCard(
  state: GameState,
  actor: PlayerId,
  cardType: CardType,
): PlayerId {
  const n = playerCount(state);
  const dir = state.direction;

  if (cardType === "skip" || cardType === "draw2" || cardType === "wildDraw4") {
    if (n === 2) return actor;
    return nextSeat(state, nextSeat(state, actor, dir), dir);
  }

  if (cardType === "reverse") {
    if (n === 2) return actor;
    return nextSeat(state, actor, dir);
  }

  return nextSeat(state, actor, dir);
}

export function drawTarget(state: GameState, actor: PlayerId): PlayerId {
  return nextSeat(state, actor, state.direction);
}

export function isPlayersTurnPhase(state: GameState, playerId: PlayerId): boolean {
  if (state.currentPlayer !== playerId) return false;
  if (playerId === HUMAN_ID) {
    return state.gamePhase === "humanTurn" || state.gamePhase === "humanDrewCard";
  }
  return (
    state.gamePhase === "computerThinking" ||
    state.gamePhase === "computerDrewCard"
  );
}

export function isDrawPhase(state: GameState, playerId: PlayerId): boolean {
  if (state.currentPlayer !== playerId) return false;
  if (playerId === HUMAN_ID) return state.gamePhase === "humanTurn";
  return state.gamePhase === "computerThinking";
}

export function isKeepDrawnPhase(state: GameState, playerId: PlayerId): boolean {
  if (state.currentPlayer !== playerId) return false;
  if (playerId === HUMAN_ID) return state.gamePhase === "humanDrewCard";
  return state.gamePhase === "computerDrewCard";
}
