import { describe, expect, it } from "vitest";
import { calculateHandScore, cardPoints, checkMatchWinner } from "../scoring";
import { reduce } from "../reducer";
import { replenishDrawPile, drawCards } from "../draw";
import {
  createTestGame,
  draw2Card,
  numberCard,
  skipCard,
  wildCard,
  wildDraw4Card,
} from "../testUtils";
import { startMatch } from "../setup";
import { processOpeningCard, createFreshState, revealStartCard } from "../setup";
import { createDeck } from "../deck";

describe("scoring", () => {
  it("uses official card values", () => {
    expect(cardPoints(numberCard("red", 8))).toBe(8);
    expect(cardPoints(skipCard("red"))).toBe(20);
    expect(cardPoints(draw2Card("blue"))).toBe(20);
    expect(cardPoints(wildCard())).toBe(50);
    expect(cardPoints(wildDraw4Card())).toBe(50);
  });

  it("totals an opponent hand with a breakdown", () => {
    const { total, breakdown } = calculateHandScore([
      numberCard("blue", 8, "b8"),
      skipCard("red", "rSkip"),
      wildCard("w"),
    ]);
    expect(total).toBe(78);
    expect(breakdown).toHaveLength(3);
  });

  it("awards remaining cards to the player who went out", () => {
    const state = createTestGame({
      humanHand: [numberCard("red", 1, "last")],
      computerHand: [
        numberCard("blue", 8, "b8"),
        skipCard("red", "rSkip"),
        wildCard("w"),
      ],
      discardTop: numberCard("red", 3, "top"),
      activeColor: "red",
    });
    const after = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "last",
    });
    expect(after.gamePhase).toBe("handOver");
    expect(after.winner).toBe("human");
    expect(after.lastHandScore?.points).toBe(78);
    expect(after.scores.human).toBe(78);
  });

  it("counts final Draw Two cards toward scoring", () => {
    const state = createTestGame({
      humanHand: [draw2Card("red", "d2")],
      computerHand: [numberCard("blue", 8, "b8")],
      discardTop: numberCard("red", 3, "top"),
      activeColor: "red",
    });
    const after = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "d2",
    });
    expect(after.gamePhase).toBe("handOver");
    expect(after.hands.computer.length).toBe(3);
    expect(after.lastHandScore?.points).toBeGreaterThan(8);
  });

  it("ends the match at 500 or more points", () => {
    expect(checkMatchWinner({ human: 500, computer: 20 }, 500)).toBe("human");
    expect(checkMatchWinner({ human: 499, computer: 20 }, 500)).toBeNull();
    const state = createTestGame({
      humanHand: [numberCard("red", 1, "last")],
      computerHand: [wildDraw4Card("wdf"), wildCard("w")],
      discardTop: numberCard("red", 3, "top"),
      activeColor: "red",
      scores: { human: 450, computer: 10 },
    });
    const after = reduce(state, {
      type: "PLAY_CARD",
      playerId: "human",
      cardId: "last",
    });
    expect(after.gamePhase).toBe("matchOver");
    expect(after.matchWinner).toBe("human");
    expect(after.scores.human).toBeGreaterThanOrEqual(500);
  });
});

describe("draw pile exhaustion", () => {
  it("recycles the discard pile but keeps the top card", () => {
    const top = numberCard("red", 5, "top");
    const older = [
      numberCard("blue", 1, "old1"),
      numberCard("green", 2, "old2"),
      skipCard("yellow", "old3"),
    ];
    const state = createTestGame({
      humanHand: [numberCard("red", 1, "h1")],
      computerHand: [numberCard("red", 2, "c1")],
      drawPile: [],
      discardTop: top,
      activeColor: "red",
    });
    state.discardPile = [...older, top];
    const recycled = replenishDrawPile(state);
    expect(recycled.discardPile).toEqual([top]);
    expect(recycled.drawPile.map((card) => card.id).sort()).toEqual(
      older.map((card) => card.id).sort(),
    );
    expect(recycled.drawPile.some((card) => card.id === "top")).toBe(false);
  });

  it("drawCards replenishes mid-draw", () => {
    const top = numberCard("red", 5, "top");
    const state = createTestGame({
      humanHand: [],
      computerHand: [numberCard("blue", 1, "c1")],
      drawPile: [numberCard("green", 9, "only")],
      discardTop: top,
      activeColor: "red",
    });
    state.discardPile = [
      numberCard("blue", 2, "old1"),
      numberCard("yellow", 3, "old2"),
      numberCard("green", 4, "old3"),
      top,
    ];
    const { state: after, drawn } = drawCards(state, "human", 3);
    expect(drawn.length).toBe(3);
    expect(after.discardPile.at(-1)?.id).toBe("top");
    expect(after.hands.human).toHaveLength(3);
  });
});

describe("opening discard", () => {
  it("reshuffles an opening Wild Draw Four", () => {
    const wdf = wildDraw4Card("open-wdf");
    const number = numberCard("red", 4, "open-4");
    const revealed = revealStartCard([number, wdf], 5);
    expect(revealed.startCard.type).not.toBe("wildDraw4");
  });

  it("opening Draw Two makes the first player draw 2 and skip", () => {
    const base = createFreshState({ seed: 1 });
    base.hands = {
      human: [numberCard("red", 1, "h1")],
      computer: [numberCard("blue", 1, "c1")],
    };
    base.drawPile = [
      numberCard("green", 2, "d1"),
      numberCard("green", 3, "d2"),
      numberCard("green", 4, "d3"),
    ];
    const after = processOpeningCard(
      base,
      draw2Card("red", "open-d2"),
      "human",
      "computer",
    );
    expect(after.hands.human.length).toBe(3);
    expect(after.currentPlayer).toBe("computer");
  });

  it("opening Skip skips the first player", () => {
    const base = createFreshState({ seed: 1 });
    const after = processOpeningCard(
      base,
      skipCard("red", "open-skip"),
      "human",
      "computer",
    );
    expect(after.currentPlayer).toBe("computer");
  });

  it("opening Reverse lets the dealer play first", () => {
    const base = createFreshState({ seed: 1 });
    const after = processOpeningCard(
      base,
      { id: "open-rev", color: "red", type: "reverse" },
      "human",
      "computer",
    );
    expect(after.currentPlayer).toBe("computer");
    expect(after.direction).toBe(-1);
  });

  it("opening Wild makes the starting player choose a color", () => {
    const base = createFreshState({ seed: 1 });
    const after = processOpeningCard(
      base,
      wildCard("open-wild"),
      "human",
      "computer",
    );
    expect(after.gamePhase).toBe("choosingWildColor");
    expect(after.pendingAction?.type).toBe("wildColor");
    if (after.pendingAction?.type === "wildColor") {
      expect(after.pendingAction.isOpening).toBe(true);
    }
  });
});

describe("match lifecycle", () => {
  it("starts a legal match without stacking house rules", () => {
    const state = startMatch({ seed: 12 });
    expect(state.rules.stackingDrawTwo).toBe(false);
    expect(state.rules.jumpIn).toBe(false);
    expect(state.rules.sevenZero).toBe(false);
    expect(state.hands.human).toHaveLength(7);
    expect(createDeck()).toHaveLength(108);
  });
});
