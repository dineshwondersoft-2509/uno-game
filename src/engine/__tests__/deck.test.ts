import { describe, expect, it } from "vitest";
import { createDeck, shuffleDeck } from "../deck";
import { nextRng } from "../rng";

describe("createDeck", () => {
  const deck = createDeck();

  it("has exactly 108 cards", () => {
    expect(deck.length).toBe(108);
  });

  it("has unique IDs", () => {
    const ids = deck.map((card) => card.id);
    expect(new Set(ids).size).toBe(108);
  });

  it("has 4 wild and 4 wild draw four", () => {
    expect(deck.filter((card) => card.type === "wild")).toHaveLength(4);
    expect(deck.filter((card) => card.type === "wildDraw4")).toHaveLength(4);
    expect(deck.filter((card) => card.color === null)).toHaveLength(8);
  });

  it("has the official number distribution per color", () => {
    for (const color of ["red", "yellow", "green", "blue"] as const) {
      const ofColor = deck.filter((card) => card.color === color);
      expect(ofColor).toHaveLength(25);
      expect(
        ofColor.filter((card) => card.type === "number" && card.number === 0),
      ).toHaveLength(1);
      for (let n = 1; n <= 9; n += 1) {
        expect(
          ofColor.filter((card) => card.type === "number" && card.number === n),
        ).toHaveLength(2);
      }
    }
  });

  it("has two skip, reverse, and draw two per color", () => {
    for (const color of ["red", "yellow", "green", "blue"] as const) {
      const ofColor = deck.filter((card) => card.color === color);
      expect(ofColor.filter((card) => card.type === "skip")).toHaveLength(2);
      expect(ofColor.filter((card) => card.type === "reverse")).toHaveLength(2);
      expect(ofColor.filter((card) => card.type === "draw2")).toHaveLength(2);
    }
  });

  it("gives wild cards a null color", () => {
    for (const card of deck.filter(
      (item) => item.type === "wild" || item.type === "wildDraw4",
    )) {
      expect(card.color).toBeNull();
    }
  });
});

describe("shuffleDeck", () => {
  it("is deterministic for a seed and preserves membership", () => {
    const original = createDeck();
    const a = shuffleDeck(original, 42);
    const b = shuffleDeck(original, 42);
    expect(a.deck.map((card) => card.id)).toEqual(b.deck.map((card) => card.id));
    expect(a.deck.map((card) => card.id).sort()).toEqual(
      original.map((card) => card.id).sort(),
    );
  });

  it("can produce a different order than the input", () => {
    const original = createDeck();
    const shuffled = shuffleDeck(original, 7);
    expect(shuffled.deck.map((card) => card.id).join(",")).not.toEqual(
      original.map((card) => card.id).join(","),
    );
  });

  it("uses a advancing rng", () => {
    const first = nextRng(1);
    const second = nextRng(first.nextSeed);
    expect(first.value).not.toBe(second.value);
  });
});
