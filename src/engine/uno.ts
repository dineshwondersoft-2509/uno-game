import { drawCards } from "./draw";
import { appendLog, withSfx } from "./log";
import { playerName } from "./format";
import { opponent } from "./players";
import type { GameState, PlayerId } from "./types";

export function checkUnoPenalty(
  declared: boolean,
  handSizeBeforePlay: number,
): boolean {
  return handSizeBeforePlay === 2 && !declared;
}

export function applyUnoPenalty(state: GameState, playerId: PlayerId): GameState {
  let next = appendLog(
    state,
    `${playerName(opponent(playerId))} caught ${playerName(playerId)} for not saying UNO`,
  );
  const drawn = drawCards(next, playerId, 2);
  next = drawn.state;
  next = appendLog(next, `${playerName(playerId)} drew 2 penalty cards`);
  next = withSfx(next, "draw");
  next = {
    ...next,
    statusMessage:
      playerId === "human"
        ? "Caught! Draw 2 for missing UNO."
        : "Computer drew 2 for missing UNO.",
    unoDeclared: { ...next.unoDeclared, [playerId]: false },
  };
  return next;
}

export function declareUno(state: GameState, playerId: PlayerId): GameState {
  const isHuman = playerId === "human";
  const allowed =
    (isHuman &&
      (state.gamePhase === "humanTurn" || state.gamePhase === "humanDrewCard")) ||
    (!isHuman &&
      (state.gamePhase === "computerThinking" ||
        state.gamePhase === "computerDrewCard"));

  if (!allowed || state.currentPlayer !== playerId) {
    return { ...state, lastError: "You can only declare UNO on your turn." };
  }

  const handSize = state.hands[playerId].length;
  let next: GameState = {
    ...state,
    unoDeclared: { ...state.unoDeclared, [playerId]: true },
    lastError: null,
  };

  if (handSize === 2) {
    next = appendLog(next, `${playerName(playerId)} says UNO!`);
    next = withSfx(next, "uno");
    if (playerId === "computer") {
      next = {
        ...next,
        computerSaidUno: true,
        statusMessage: "Computer says UNO!",
      };
    } else {
      next = {
        ...next,
        statusMessage: "You say UNO!",
      };
    }
  }

  return next;
}

export function maybeApplyMissedUno(
  state: GameState,
  playerId: PlayerId,
  unoMissed: boolean,
): GameState {
  if (!unoMissed) return state;
  return applyUnoPenalty(state, playerId);
}
