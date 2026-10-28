import { describe, expect, it } from "vitest";
import { checkUnoPenalty } from "../uno";
import { reduce } from "../reducer";
import { createTestGame, numberCard, skipCard } from "../testUtils";

describe("UNO declaration", () => {
  it("requires a declaration when going from 2 cards to 1", () => {
    expect(checkUnoPenalty(false, 2)).toBe(true);
    expect(checkUnoPenalty(true, 2)).toBe(false);
    expect(checkUnoPenalty(false, 1)).toBe(false);
  });

  it("applies a 2-card penalty when human forgets UNO", () => {
    const state = createTestGame({
      humanHand: [numberCard("red", 4, "r4"), numberCard("blue", 9, "keep")],
      computerHand: [numberCard("green", 3, "c1")],
      discardTop: numberCard("red", 7, "top"),
      activeColor: "red",
    });
    const after = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "r4",
    });
    expect(after.hands.human.length).toBe(1 + 2);
    expect(after.currentPlayer).toBe("computer");
    expect(
      after.log.some((entry) => /not saying UNO/i.test(entry.text)),
    ).toBe(true);
  });

  it("does not penalize a correct UNO declaration", () => {
    const state = createTestGame({
      humanHand: [numberCard("red", 4, "r4"), numberCard("blue", 9, "keep")],
      computerHand: [numberCard("green", 3, "c1")],
      discardTop: numberCard("red", 7, "top"),
      activeColor: "red",
    });
    const declared = reduce(state, { type: "DECLARE_UNO", playerId: "human" });
    expect(declared.log.some((entry) => /says UNO/i.test(entry.text))).toBe(true);
    expect(declared.statusMessage).toBe("You say UNO!");
    expect(declared.unoDeclared.human).toBe(true);
    const after = reduce(declared, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "r4",
    });
    expect(after.hands.human.length).toBe(1);
    expect(after.currentPlayer).toBe("computer");
  });

  it("does not require UNO when going from 1 card to 0", () => {
    const state = createTestGame({
      humanHand: [numberCard("red", 4, "r4")],
      computerHand: [numberCard("green", 3, "c1"), skipCard("blue", "c2")],
      discardTop: numberCard("red", 7, "top"),
      activeColor: "red",
    });
    const after = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "r4",
    });
    expect(after.gamePhase).toBe("handOver");
    expect(after.winner).toBe("human");
    expect(after.hands.human.length).toBe(0);
  });
});
