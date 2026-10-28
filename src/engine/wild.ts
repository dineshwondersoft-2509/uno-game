import { drawCards } from "./draw";
import { finishHand } from "./end";
import { formatColor, playerName } from "./format";
import { appendLog, fail } from "./log";
import { nextSeat } from "./players";
import { beginTurn, nextPlayerAfterCard } from "./turn";
import type { CardColor, GameState, PlayerId } from "./types";
import { maybeApplyMissedUno } from "./uno";

export function chooseWildColor(
  state: GameState,
  playerId: PlayerId,
  color: CardColor,
): GameState {
  if (state.gamePhase !== "choosingWildColor") {
    return fail(state, "No color to choose.");
  }
  const pending = state.pendingAction;
  if (!pending || pending.type !== "wildColor" || pending.playerId !== playerId) {
    return fail(state, "It is not your turn to choose a color.");
  }

  let next: GameState = {
    ...state,
    activeColor: color,
    lastError: null,
  };
  next = appendLog(next, `${playerName(playerId)} chose ${formatColor(color)}`);

  if (pending.isOpening) {
    next = { ...next, pendingAction: null };
    return beginTurn(next, playerId);
  }

  if (pending.cardType === "wildDraw4") {
    const previousColor = pending.previousColor;
    if (!previousColor) {
      return fail(state, "Missing previous color for Wild Draw Four.");
    }
    const target = nextSeat(next, playerId, next.direction);
    return {
      ...next,
      pendingAction: {
        type: "wildDraw4Response",
        playedBy: playerId,
        targetId: target,
        wasLegal: pending.wasWildDrawFourLegal === true,
        previousColor,
        chosenColor: color,
        unoMissed: pending.unoMissed,
        goingOut: pending.goingOut,
      },
      gamePhase: "awaitingWildDraw4Response",
      statusMessage:
        target === "human"
          ? "Accept +4 or Challenge?"
          : "Computer is thinking…",
    };
  }

  next = { ...next, pendingAction: null };
  if (pending.goingOut) {
    return finishHand(next, playerId);
  }
  next = maybeApplyMissedUno(next, playerId, pending.unoMissed);
  return beginTurn(next, nextSeat(next, playerId, next.direction));
}

export function resolveWildDrawFourChallenge(
  state: GameState,
  playerId: PlayerId,
  challenge: boolean,
): GameState {
  if (state.gamePhase !== "awaitingWildDraw4Response") {
    return fail(state, "There is no Wild Draw Four to answer.");
  }
  const pending = state.pendingAction;
  if (
    !pending ||
    pending.type !== "wildDraw4Response" ||
    pending.targetId !== playerId
  ) {
    return fail(state, "It is not your turn to answer the Wild Draw Four.");
  }

  let next: GameState = { ...state, pendingAction: null, lastError: null };

  if (!challenge) {
    next = appendLog(next, `${playerName(playerId)} accepted`);
    const drawn = drawCards(next, playerId, 4);
    next = drawn.state;
    next = appendLog(next, `${playerName(playerId)} drew 4 cards`);
    if (pending.goingOut) {
      return finishHand(next, pending.playedBy);
    }
    next = maybeApplyMissedUno(next, pending.playedBy, pending.unoMissed);
    return beginTurn(next, nextPlayerAfterCard(next, pending.playedBy, "wildDraw4"));
  }

  next = appendLog(next, `${playerName(playerId)} challenged`);
  next = { ...next, gamePhase: "resolvingChallenge" };

  if (pending.wasLegal) {
    next = appendLog(
      next,
      `Challenge failed — ${playerName(pending.playedBy)} had no ${formatColor(pending.previousColor)} cards.`,
    );
    next = {
      ...next,
      statusMessage: "Challenge failed",
      sfx: "challenge",
    };
    const drawn = drawCards(next, playerId, 6);
    next = drawn.state;
    next = appendLog(next, `${playerName(playerId)} drew 6 cards`);
    if (pending.goingOut) {
      return finishHand(next, pending.playedBy);
    }
    next = maybeApplyMissedUno(next, pending.playedBy, pending.unoMissed);
    next = beginTurn(next, nextPlayerAfterCard(next, pending.playedBy, "wildDraw4"));
    return { ...next, statusMessage: "Challenge failed", sfx: "challenge" };
  }

  next = appendLog(
    next,
    `Challenge successful — ${playerName(pending.playedBy)} had a matching ${formatColor(pending.previousColor)} card.`,
  );
  const drawn = drawCards(next, pending.playedBy, 4);
  next = drawn.state;
  next = appendLog(next, `${playerName(pending.playedBy)} drew 4 cards`);
  next = maybeApplyMissedUno(next, pending.playedBy, pending.unoMissed);
  next = beginTurn(next, playerId);
  return { ...next, statusMessage: "Challenge successful", sfx: "challenge" };
}
