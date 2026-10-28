import { nextRng } from "../engine/rng";
import type { CardColor } from "../engine/types";
import type { PublicAiView } from "./publicView";

export function shouldChallenge(
  view: PublicAiView,
  rngSeed: number,
): { challenge: boolean; rngSeed: number } {
  const pending = view.pendingAction;
  if (!pending || pending.type !== "wildDraw4Response") {
    return { challenge: false, rngSeed };
  }

  const rng = nextRng(rngSeed);
  const roll = rng.value;
  const opponentSize = view.opponentHandSize;
  const color = pending.previousColor;
  const humanJustDrewThisColor =
    view.lastVoluntaryDraw?.playerId === "human" &&
    view.lastVoluntaryDraw.color === color;

  if (view.difficulty === "easy") {
    return { challenge: roll < 0.12, rngSeed: rng.nextSeed };
  }

  if (view.difficulty === "medium") {
    let chance = 0.18;
    if (opponentSize >= 5) chance += 0.2;
    if (opponentSize <= 1) chance -= 0.12;
    if (humanJustDrewThisColor) chance -= 0.15;
    return { challenge: roll < chance, rngSeed: rng.nextSeed };
  }

  let chance = 0.22;
  if (opponentSize >= 6) chance += 0.28;
  else if (opponentSize >= 4) chance += 0.12;
  if (opponentSize <= 1) chance -= 0.16;
  if (humanJustDrewThisColor) chance -= 0.22;

  const recentColors = view.discardHistory
    .slice(-8)
    .map((card) => card.color)
    .filter((item): item is CardColor => item !== null);
  const playedActiveColor = recentColors.filter((item) => item === color).length;
  if (playedActiveColor === 0 && opponentSize >= 3) chance += 0.1;
  if (view.scores.computer + 50 >= view.scores.human && opponentSize <= 2) {
    chance -= 0.08;
  }

  return { challenge: roll < Math.min(0.72, Math.max(0.04, chance)), rngSeed: rng.nextSeed };
}
