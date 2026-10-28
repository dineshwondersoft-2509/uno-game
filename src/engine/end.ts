import { appendLog, withSfx } from "./log";
import { opponent } from "./players";
import { checkMatchWinner, makeHandScoreSummary } from "./scoring";
import { playerName } from "./format";
import type { GameState, PlayerId } from "./types";

export function finishHand(state: GameState, winner: PlayerId): GameState {
  const loser = opponent(winner);
  const summary = makeHandScoreSummary(winner, state.hands[loser]);
  const scores = {
    ...state.scores,
    [winner]: state.scores[winner] + summary.points,
  };
  const matchWinner = checkMatchWinner(scores, state.rules.matchPointsToWin);

  let next: GameState = {
    ...state,
    scores,
    winner,
    matchWinner,
    lastHandScore: summary,
    pendingAction: null,
    drawnCardId: null,
    gamePhase: matchWinner ? "matchOver" : "handOver",
    statusMessage: matchWinner
      ? `${playerName(matchWinner)} wins the match!`
      : `${playerName(winner)} wins the hand`,
    sfx: "win",
  };

  next = appendLog(
    next,
    `${playerName(winner)} wins the hand and earns ${summary.points} points`,
  );
  if (matchWinner) {
    next = appendLog(next, `${playerName(matchWinner)} wins the match`);
  }
  return withSfx(next, "win");
}

export function checkHandWinner(state: GameState): PlayerId | null {
  if (
    state.gamePhase === "choosingWildColor" ||
    state.gamePhase === "awaitingWildDraw4Response"
  ) {
    return null;
  }
  if (state.hands.human.length === 0) return "human";
  if (state.hands.computer.length === 0) return "computer";
  return null;
}
