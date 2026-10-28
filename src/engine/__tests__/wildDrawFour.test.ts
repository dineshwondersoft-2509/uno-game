import { describe, expect, it } from "vitest";
import { canLegallyPlayWildDrawFour } from "../matching";
import { reduce } from "../reducer";
import {
  createTestGame,
  numberCard,
  skipCard,
  wildDraw4Card,
} from "../testUtils";

function playWdfAndChoose(
  humanHand = [
    wildDraw4Card("wdf"),
    numberCard("blue", 7, "b7"),
    numberCard("green", 7, "g7"),
    skipCard("yellow", "ySkip"),
  ],
  color: "red" | "yellow" | "green" | "blue" = "blue",
) {
  const state = createTestGame({
    humanHand,
    computerHand: [numberCard("red", 1, "c1"), numberCard("red", 2, "c2")],
    discardTop: numberCard("red", 9, "top"),
    activeColor: "red",
  });
  const played = reduce(state, {
    type: "PLAY_CARD",
    playerId: "human",
    cardId: "wdf",
  });
  const chosen = reduce(played, {
    type: "CHOOSE_COLOR",
    playerId: "human",
    color,
  });
  return { state, played, chosen };
}

describe("wild draw four legality", () => {
  it("is legal when the player has no matching color", () => {
    const hand = [
      numberCard("blue", 7),
      numberCard("green", 7),
      skipCard("yellow"),
      wildDraw4Card(),
    ];
    expect(canLegallyPlayWildDrawFour(hand, "red")).toBe(true);
  });

  it("is illegal when a matching color card exists", () => {
    const hand = [numberCard("red", 2), numberCard("blue", 5), wildDraw4Card()];
    expect(canLegallyPlayWildDrawFour(hand, "red")).toBe(false);
  });
});

describe("wild draw four challenge", () => {
  it("allows a bluff to be played and then challenged successfully", () => {
    const { chosen } = playWdfAndChoose(
      [wildDraw4Card("wdf"), numberCard("red", 2, "r2"), numberCard("blue", 5, "b5")],
      "yellow",
    );
    expect(chosen.gamePhase).toBe("awaitingWildDraw4Response");
    expect(chosen.pendingAction?.type).toBe("wildDraw4Response");
    if (chosen.pendingAction?.type !== "wildDraw4Response") return;
    expect(chosen.pendingAction.wasLegal).toBe(false);
    expect(chosen.pendingAction.previousColor).toBe("red");
    expect(chosen.activeColor).toBe("yellow");

    const resolved = reduce(chosen, {
      type: "RESPOND_WILD_DRAW4",
      playerId: "computer",
      challenge: true,
    });
    expect(resolved.statusMessage).toBe("Challenge successful");
    expect(resolved.hands.human.length).toBe(2 + 4);
    expect(resolved.currentPlayer).toBe("computer");
    expect(resolved.log.some((entry) => /matching Red card/i.test(entry.text))).toBe(
      true,
    );
  });

  it("failed challenge makes the challenger draw 6", () => {
    const { chosen } = playWdfAndChoose(
      [
        wildDraw4Card("wdf"),
        numberCard("blue", 7, "b7"),
        numberCard("green", 7, "g7"),
      ],
      "yellow",
    );
    if (chosen.pendingAction?.type !== "wildDraw4Response") {
      throw new Error("expected WDF response");
    }
    expect(chosen.pendingAction.wasLegal).toBe(true);

    const resolved = reduce(chosen, {
      type: "RESPOND_WILD_DRAW4",
      playerId: "computer",
      challenge: true,
    });
    expect(resolved.statusMessage).toBe("Challenge failed");
    expect(resolved.hands.computer.length).toBe(2 + 6);
    expect(resolved.currentPlayer).toBe("human");
    expect(resolved.log.some((entry) => /had no Yellow|had no Red/i.test(entry.text))).toBe(
      true,
    );
  });

  it("accepting draws 4 and the WDF player plays again", () => {
    const { chosen } = playWdfAndChoose();
    const resolved = reduce(chosen, {
      type: "RESPOND_WILD_DRAW4",
      playerId: "computer",
      challenge: false,
    });
    expect(resolved.hands.computer.length).toBe(2 + 4);
    expect(resolved.currentPlayer).toBe("human");
    expect(resolved.gamePhase).toBe("humanTurn");
  });

  it("uses the previous color for legality, not the newly chosen color", () => {
    const { chosen } = playWdfAndChoose(
      [wildDraw4Card("wdf"), numberCard("blue", 3, "b3")],
      "blue",
    );
    if (chosen.pendingAction?.type !== "wildDraw4Response") {
      throw new Error("expected WDF response");
    }
    expect(chosen.pendingAction.previousColor).toBe("red");
    expect(chosen.pendingAction.wasLegal).toBe(true);
    expect(chosen.activeColor).toBe("blue");
  });

  it("does not draw four until the target responds", () => {
    const { chosen } = playWdfAndChoose();
    expect(chosen.hands.computer.length).toBe(2);
    expect(chosen.gamePhase).toBe("awaitingWildDraw4Response");
  });
});

describe("final wild draw four", () => {
  it("does not end the hand before the challenge is resolved", () => {
    const state = createTestGame({
      humanHand: [wildDraw4Card("wdf")],
      computerHand: [numberCard("blue", 8, "b8")],
      discardTop: numberCard("green", 3, "top"),
      activeColor: "green",
    });
    const played = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "wdf",
    });
    expect(played.gamePhase).toBe("choosingWildColor");
    expect(played.winner).toBeNull();
    const chosen = reduce(played, {
      type: "CHOOSE_COLOR",
      playerId: "human",
      color: "red",
    });
    expect(chosen.gamePhase).toBe("awaitingWildDraw4Response");
    expect(chosen.winner).toBeNull();
  });

  it("successful challenge of a final illegal WDF continues the hand", () => {
    const state = createTestGame({
      humanHand: [wildDraw4Card("wdf"), numberCard("green", 1, "keep-color")],
      computerHand: [numberCard("blue", 8, "b8")],
      discardTop: numberCard("green", 3, "top"),
      activeColor: "green",
    });
    const declared = reduce(state, { type: "DECLARE_UNO", playerId: "human" });
    const played = reduce(declared, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "wdf",
    });
    const chosen = reduce(played, {
      type: "CHOOSE_COLOR",
      playerId: "human",
      color: "red",
    });
    const resolved = reduce(chosen, {
      type: "RESPOND_WILD_DRAW4",
      playerId: "computer",
      challenge: true,
    });
    expect(resolved.gamePhase).not.toBe("handOver");
    expect(resolved.hands.human.length).toBeGreaterThan(0);
    expect(resolved.currentPlayer).toBe("computer");
  });

  it("accepted final WDF scores after the opponent draws 4", () => {
    const state = createTestGame({
      humanHand: [wildDraw4Card("wdf")],
      computerHand: [numberCard("blue", 8, "b8")],
      discardTop: numberCard("green", 3, "top"),
      activeColor: "green",
    });
    const played = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "wdf",
    });
    const chosen = reduce(played, {
      type: "CHOOSE_COLOR",
      playerId: "human",
      color: "red",
    });
    const resolved = reduce(chosen, {
      type: "RESPOND_WILD_DRAW4",
      playerId: "computer",
      challenge: false,
    });
    expect(resolved.gamePhase).toBe("handOver");
    expect(resolved.winner).toBe("human");
    expect(resolved.lastHandScore?.points).toBeGreaterThanOrEqual(8);
    expect(resolved.hands.computer.length).toBe(5);
  });
});
