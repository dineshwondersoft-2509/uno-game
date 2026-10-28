import { describe, expect, it } from "vitest";
import {
  canLegallyPlayWildDrawFour,
  canPlayCard,
  canSelectCardForPlay,
  getPlayableCards,
} from "../matching";
import {
  draw2Card,
  numberCard,
  skipCard,
  wildCard,
  wildDraw4Card,
} from "../testUtils";

const red7 = numberCard("red", 7, "red7");
const blue7 = numberCard("blue", 7, "blue7");
const red2 = numberCard("red", 2, "red2");
const blueSkip = skipCard("blue", "blueSkip");
const redSkip = skipCard("red", "redSkip");
const yellowReverse = numberCard("yellow", 4, "y4");
const yellowSkip = skipCard("yellow", "ySkip");
const greenDraw2 = draw2Card("green", "gDraw2");
const blueDraw2 = draw2Card("blue", "bDraw2");
const wild = wildCard("wild");
const wdf = wildDraw4Card("wdf");

describe("canPlayCard", () => {
  it("matches color", () => {
    expect(canPlayCard(red2, red7, "red")).toBe(true);
  });

  it("matches number across colors", () => {
    expect(canPlayCard(blue7, red7, "red")).toBe(true);
  });

  it("matches skip symbol across colors", () => {
    expect(canPlayCard(blueSkip, redSkip, "red")).toBe(true);
  });

  it("matches draw two symbol across colors", () => {
    expect(canPlayCard(blueDraw2, greenDraw2, "green")).toBe(true);
  });

  it("rejects unrelated cards", () => {
    expect(canPlayCard(yellowReverse, redSkip, "red")).toBe(false);
    expect(canPlayCard(yellowSkip, red7, "red")).toBe(false);
  });

  it("allows wild always", () => {
    expect(canPlayCard(wild, red7, "red")).toBe(true);
    expect(canPlayCard(wild, blueSkip, "blue")).toBe(true);
  });

  it("does not treat wild draw four as a normal match", () => {
    expect(canPlayCard(wdf, red7, "red")).toBe(false);
  });

  it("uses activeColor rather than the wild card face", () => {
    const wildOnPile = wildCard("pile-wild");
    expect(canPlayCard(red7, wildOnPile, "red")).toBe(true);
    expect(canPlayCard(blue7, wildOnPile, "red")).toBe(false);
    expect(canPlayCard(blue7, wildOnPile, "red")).toBe(false);
    expect(canPlayCard(blue7, wildOnPile, "blue")).toBe(true);
  });
});

describe("canSelectCardForPlay", () => {
  it("allows wild draw four even when illegal", () => {
    expect(canSelectCardForPlay(wdf, red7, "red", null)).toBe(true);
  });

  it("after drawing, only the drawn card may be selected", () => {
    expect(canSelectCardForPlay(red2, red7, "red", "drawn-id")).toBe(false);
    expect(
      canSelectCardForPlay(
        numberCard("red", 3, "drawn-id"),
        red7,
        "red",
        "drawn-id",
      ),
    ).toBe(true);
  });
});

describe("canLegallyPlayWildDrawFour", () => {
  it("is legal when the player has no card of the active color", () => {
    const hand = [blue7, numberCard("green", 7, "g7"), yellowSkip, wdf];
    expect(canLegallyPlayWildDrawFour(hand, "red")).toBe(true);
  });

  it("is illegal when the player has any card of the active color", () => {
    const hand = [red2, numberCard("blue", 5, "b5"), wdf];
    expect(canLegallyPlayWildDrawFour(hand, "red")).toBe(false);
  });

  it("same number in another color does not make it illegal", () => {
    const hand = [blue7, numberCard("green", 7, "g7"), wdf];
    expect(canLegallyPlayWildDrawFour(hand, "red")).toBe(true);
  });

  it("same action symbol in another color does not make it illegal", () => {
    const hand = [blueSkip, yellowSkip, wdf];
    expect(canLegallyPlayWildDrawFour(hand, "red")).toBe(true);
  });
});

describe("getPlayableCards", () => {
  it("includes wilds and matching cards", () => {
    const hand = [blue7, yellowReverse, wild, wdf, redSkip];
    const playable = getPlayableCards(hand, red7, "red");
    expect(playable.map((card) => card.id).sort()).toEqual(
      ["blue7", "redSkip", "wdf", "wild"].sort(),
    );
  });
});
