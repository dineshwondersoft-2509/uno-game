import { describe, expect, it } from "vitest";
import { reduce } from "../reducer";
import { startMatch } from "../setup";
import {
  createTestGame,
  draw2Card,
  numberCard,
  reverseCard,
  skipCard,
  wildCard,
} from "../testUtils";

describe("dealing", () => {
  it("deals exactly 7 cards to each player", () => {
    const state = startMatch({ seed: 99 });
    expect(state.hands.human).toHaveLength(7);
    expect(state.hands.computer).toHaveLength(7);
    expect(state.discardPile).toHaveLength(1);
    expect(state.drawPile.length).toBe(108 - 15);
  });
});

describe("drawing", () => {
  it("draws exactly one card on a normal draw", () => {
    const playable = numberCard("red", 5, "playable");
    const drawn = numberCard("blue", 1, "drawn-blue");
    const state = createTestGame({
      humanHand: [playable, numberCard("green", 1, "g1")],
      computerHand: [numberCard("blue", 3, "c1")],
      drawPile: [drawn],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const after = reduce(state, { type: "DRAW_CARD", playerId: "human" });
    expect(after.hands.human.length).toBe(3);
  });

  it("lets the player play the newly drawn card if it is playable", () => {
    const drawn = numberCard("red", 1, "drawn-red");
    const old = numberCard("red", 4, "old-red");
    const state = createTestGame({
      humanHand: [old],
      computerHand: [numberCard("blue", 3, "c1")],
      drawPile: [numberCard("green", 9, "under"), drawn],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const afterDraw = reduce(state, { type: "DRAW_CARD", playerId: "human" });
    expect(afterDraw.gamePhase).toBe("humanDrewCard");
    expect(afterDraw.drawnCardId).toBe("drawn-red");
    const afterPlay = reduce(afterDraw, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "drawn-red",
    });
    expect(afterPlay.discardPile.at(-1)?.id).toBe("drawn-red");
    expect(afterPlay.currentPlayer).toBe("computer");
  });

  it("ends the turn automatically if the drawn card is unplayable", () => {
    const drawn = numberCard("green", 1, "drawn-green");
    const state = createTestGame({
      humanHand: [numberCard("blue", 4, "b4")],
      computerHand: [numberCard("blue", 3, "c1")],
      drawPile: [drawn],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const after = reduce(state, { type: "DRAW_CARD", playerId: "human" });
    expect(after.gamePhase).toBe("computerThinking");
    expect(after.currentPlayer).toBe("computer");
    expect(after.hands.human.some((card) => card.id === "drawn-green")).toBe(
      true,
    );
  });

  it("forbids playing an old card after a voluntary draw", () => {
    const drawn = numberCard("red", 1, "drawn-red");
    const old = numberCard("red", 4, "old-red");
    const state = createTestGame({
      humanHand: [old],
      computerHand: [numberCard("blue", 3, "c1")],
      drawPile: [drawn],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const afterDraw = reduce(state, { type: "DRAW_CARD", playerId: "human" });
    const attempted = reduce(afterDraw, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "old-red",
    });
    expect(attempted.discardPile.at(-1)?.id).toBe("top");
    expect(attempted.lastError).toMatch(/only play the card you just drew/i);
    expect(attempted.gamePhase).toBe("humanDrewCard");
  });

  it("allows keeping a playable drawn card", () => {
    const drawn = numberCard("red", 1, "drawn-red");
    const state = createTestGame({
      humanHand: [numberCard("green", 3, "g3")],
      computerHand: [numberCard("blue", 3, "c1")],
      drawPile: [drawn],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const afterDraw = reduce(state, { type: "DRAW_CARD", playerId: "human" });
    const kept = reduce(afterDraw, {
      type: "KEEP_DRAWN_CARD",
      playerId: "human",
    });
    expect(kept.currentPlayer).toBe("computer");
    expect(kept.hands.human.some((card) => card.id === "drawn-red")).toBe(true);
    expect(kept.discardPile.at(-1)?.id).toBe("top");
  });
});

describe("two-player action cards", () => {
  it("gives Skip back to the same player", () => {
    const skip = skipCard("red", "skip1");
    const extra = numberCard("blue", 1, "extra");
    const state = createTestGame({
      humanHand: [skip, extra],
      computerHand: [numberCard("green", 3, "c1")],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const after = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "skip1",
    });
    expect(after.currentPlayer).toBe("human");
    expect(after.gamePhase).toBe("humanTurn");
  });

  it("lets consecutive Skips keep returning the turn", () => {
    const first = skipCard("red", "skip1");
    const second = skipCard("blue", "skip2");
    const extra = numberCard("green", 1, "extra");
    const state = createTestGame({
      humanHand: [first, second, extra],
      computerHand: [numberCard("yellow", 3, "c1")],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const once = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "skip1",
    });
    expect(once.currentPlayer).toBe("human");
    const twice = reduce(once, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "skip2",
    });
    expect(twice.currentPlayer).toBe("human");
    expect(twice.gamePhase).toBe("humanTurn");
  });

  it("gives Reverse back to the same player and flips direction", () => {
    const reverse = reverseCard("red", "rev1");
    const state = createTestGame({
      humanHand: [reverse, numberCard("blue", 1, "extra")],
      computerHand: [numberCard("green", 3, "c1")],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
      direction: 1,
    });
    const after = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "rev1",
    });
    expect(after.currentPlayer).toBe("human");
    expect(after.direction).toBe(-1);
    expect(after.gamePhase).toBe("humanTurn");
  });

  it("makes Draw Two draw 2 for the target and return the turn", () => {
    const plus2 = draw2Card("red", "d2");
    const state = createTestGame({
      humanHand: [plus2, numberCard("blue", 1, "extra")],
      computerHand: [numberCard("green", 3, "c1")],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const computerCount = state.hands.computer.length;
    const after = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "d2",
    });
    expect(after.hands.computer.length).toBe(computerCount + 2);
    expect(after.currentPlayer).toBe("human");
    expect(after.gamePhase).toBe("humanTurn");
    const stacked = reduce(after, {
      type: "PLAY_CARD",
      playerId: "computer",
      cardId: after.hands.computer.find((card) => card.type === "draw2")?.id ?? "nope",
    });
    expect(stacked.currentPlayer).toBe("human");
    expect(stacked.lastError).toBeTruthy();
  });
});

describe("wild color", () => {
  it("sets activeColor independently of the wild card face", () => {
    const wild = wildCard("wild1");
    const state = createTestGame({
      humanHand: [wild, numberCard("green", 1, "g1")],
      computerHand: [numberCard("blue", 3, "c1")],
      discardTop: numberCard("red", 9, "top"),
      activeColor: "red",
    });
    const played = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "wild1",
    });
    expect(played.gamePhase).toBe("choosingWildColor");
    const chosen = reduce(played, {
      type: "CHOOSE_COLOR",
      playerId: "human",
      color: "blue",
    });
    expect(chosen.activeColor).toBe("blue");
    expect(chosen.currentPlayer).toBe("computer");
    expect(chosen.discardPile.at(-1)?.color).toBeNull();
  });
});
