import { describe, expect, it } from "vitest";
import { decideComputerAction, toPublicAiView } from "../../ai";
import type { GameAction } from "../actions";
import { pickColorFromHand } from "../../ai/color";
import { getPlayableCards, topDiscard } from "../matching";
import { reduce } from "../reducer";
import { startMatch } from "../setup";
import { isComputerDecisionPhase } from "../selectors";
import type { GameState } from "../types";

function autoAction(
  state: GameState,
  rngSeed: number,
): { action: GameAction; rngSeed: number } {
  if (isComputerDecisionPhase(state)) {
    return decideComputerAction(toPublicAiView(state), rngSeed);
  }

  const pending = state.pendingAction;
  if (
    state.gamePhase === "choosingWildColor" &&
    pending?.type === "wildColor" &&
    pending.playerId === "human"
  ) {
    const picked = pickColorFromHand(state.hands.human, rngSeed);
    return {
      action: { type: "CHOOSE_COLOR", playerId: "human", color: picked.color },
      rngSeed: picked.rngSeed,
    };
  }

  if (
    state.gamePhase === "awaitingWildDraw4Response" &&
    pending?.type === "wildDraw4Response" &&
    pending.targetId === "human"
  ) {
    return {
      action: { type: "RESPOND_WILD_DRAW4", playerId: "human", challenge: false },
      rngSeed,
    };
  }

  if (state.gamePhase === "humanDrewCard" && state.drawnCardId) {
    return {
      action: { type: "PLAY_CARD", playerId: "human", cardId: state.drawnCardId },
      rngSeed,
    };
  }

  if (state.gamePhase === "humanTurn") {
    const top = topDiscard(state.discardPile);
    if (!top) {
      throw new Error("Missing discard");
    }
    const playable = getPlayableCards(
      state.hands.human,
      top,
      state.activeColor,
      null,
    ).filter((card) => card.type !== "wildDraw4" || state.hands.human.every((item) => item.color !== state.activeColor));
    if (playable.length > 0) {
      if (state.hands.human.length === 2 && !state.unoDeclared.human) {
        return { action: { type: "DECLARE_UNO", playerId: "human" }, rngSeed };
      }
      return {
        action: { type: "PLAY_CARD", playerId: "human", cardId: playable[0]!.id },
        rngSeed,
      };
    }
    return { action: { type: "DRAW_CARD", playerId: "human" }, rngSeed };
  }

  throw new Error(`No auto action for phase ${state.gamePhase}`);
}

function playUntilHandEnds(seed: number): GameState {
  let state = startMatch({ seed, difficulty: "medium", debug: false });
  let rng = seed + 17;
  for (let i = 0; i < 800; i += 1) {
    if (state.gamePhase === "handOver" || state.gamePhase === "matchOver") {
      return state;
    }
    const next = autoAction(state, rng);
    rng = next.rngSeed;
    state = reduce(state, next.action);
    if (state.lastError) {
      throw new Error(`${state.lastError} in phase ${state.gamePhase}`);
    }
  }
  throw new Error(`Hand did not finish. phase=${state.gamePhase}`);
}

describe("autoplay smoke", () => {
  it("can finish a full hand without getting stuck", () => {
    const state = playUntilHandEnds(2026);
    expect(["handOver", "matchOver"]).toContain(state.gamePhase);
    expect(state.winner).toBeTruthy();
    expect(state.lastHandScore).toBeTruthy();
  });

  it("can finish several hands and accumulate scores", () => {
    let state = playUntilHandEnds(77);
    expect(state.winner).toBeTruthy();
    const firstScore = state.scores.human + state.scores.computer;
    expect(firstScore).toBeGreaterThan(0);
    state = reduce(state, { type: "START_NEW_HAND" });
    let rng = 90;
    for (let i = 0; i < 800; i += 1) {
      if (state.gamePhase === "handOver" || state.gamePhase === "matchOver") break;
      const next = autoAction(state, rng);
      rng = next.rngSeed;
      state = reduce(state, next.action);
    }
    expect(["handOver", "matchOver"]).toContain(state.gamePhase);
  });
});
