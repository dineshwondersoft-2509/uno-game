import { describe, expect, it } from "vitest";
import { decideComputerAction, toPublicAiView } from "../index";
import { canPlayCard } from "../../engine/matching";
import {
  createTestGame,
  numberCard,
  skipCard,
  wildDraw4Card,
} from "../../engine/testUtils";

describe("computer AI", () => {
  it("does not include the human hand or draw pile in its view", () => {
    const state = createTestGame({
      humanHand: [numberCard("red", 1, "secret")],
      computerHand: [numberCard("red", 2, "mine")],
      drawPile: [numberCard("yellow", 9, "future")],
      discardTop: numberCard("blue", 4, "top"),
      activeColor: "blue",
    });
    const view = toPublicAiView(state);
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("future");
    expect(view.myHand.some((card) => card.id === "mine")).toBe(true);
    expect(view.opponentHandSize).toBe(1);
  });

  it("only selects a card the rule engine considers playable", () => {
    const state = createTestGame({
      humanHand: [numberCard("green", 1, "h1")],
      computerHand: [
        numberCard("red", 5, "r5"),
        numberCard("blue", 9, "b9"),
        skipCard("yellow", "ySkip"),
      ],
      discardTop: numberCard("red", 2, "top"),
      activeColor: "red",
      currentPlayer: "computer",
      phase: "computerThinking",
    });
    const view = toPublicAiView(state);
    const { action } = decideComputerAction(view, 11);
    expect(action.type).toBe("PLAY_CARD");
    if (action.type !== "PLAY_CARD") return;
    const card = state.hands.computer.find((item) => item.id === action.cardId);
    expect(card).toBeTruthy();
    if (!card) return;
    expect(
      canPlayCard(card, view.topDiscard, view.activeColor) ||
        card.type === "wildDraw4",
    ).toBe(true);
  });

  it("draws when it has no legal card", () => {
    const state = createTestGame({
      humanHand: [numberCard("green", 1, "h1")],
      computerHand: [numberCard("blue", 9, "b9"), skipCard("yellow", "ySkip")],
      discardTop: numberCard("red", 2, "top"),
      activeColor: "red",
      currentPlayer: "computer",
      phase: "computerThinking",
    });
    const { action } = decideComputerAction(toPublicAiView(state), 3);
    expect(action).toEqual({ type: "DRAW_CARD", playerId: "computer" });
  });

  it("declares UNO before playing its second-to-last card", () => {
    const state = createTestGame({
      humanHand: [numberCard("green", 1, "h1")],
      computerHand: [numberCard("red", 5, "r5"), numberCard("blue", 1, "b1")],
      discardTop: numberCard("red", 2, "top"),
      activeColor: "red",
      currentPlayer: "computer",
      phase: "computerThinking",
    });
    const { action } = decideComputerAction(toPublicAiView(state), 4);
    expect(action).toEqual({ type: "DECLARE_UNO", playerId: "computer" });
  });

  it("does not inspect human cards when deciding to challenge", () => {
    const state = createTestGame({
      humanHand: [numberCard("red", 7, "hidden-red"), wildDraw4Card("already-played")],
      computerHand: [numberCard("blue", 3, "c1")],
      discardTop: wildDraw4Card("wdf-top"),
      activeColor: "yellow",
      currentPlayer: "human",
      phase: "awaitingWildDraw4Response",
    });
    state.pendingAction = {
      type: "wildDraw4Response",
      playedBy: "human",
      targetId: "computer",
      wasLegal: false,
      previousColor: "red",
      chosenColor: "yellow",
      unoMissed: false,
      goingOut: false,
    };
    const view = toPublicAiView(state);
    expect(JSON.stringify(view)).not.toContain("hidden-red");
    const { action } = decideComputerAction(view, 99);
    expect(action.type).toBe("RESPOND_WILD_DRAW4");
  });
});
