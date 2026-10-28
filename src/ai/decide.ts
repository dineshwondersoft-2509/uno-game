import type { GameAction } from "../engine/actions";
import {
  canLegallyPlayWildDrawFour,
  canSelectCardForPlay,
  getPlayableCards,
} from "../engine/matching";
import { nextRng } from "../engine/rng";
import { COMPUTER_ID } from "../engine/types";
import { pickColorFromHand } from "./color";
import { shouldChallenge } from "./challenge";
import type { PublicAiView } from "./publicView";
import { scoreMove } from "./scoreMove";
import type { Card } from "../engine/types";

export function decideComputerAction(
  view: PublicAiView,
  rngSeed: number,
): { action: GameAction; rngSeed: number } {
  if (
    view.phase === "choosingWildColor" &&
    view.pendingAction?.type === "wildColor" &&
    view.pendingAction.playerId === COMPUTER_ID
  ) {
    const picked = pickColorFromHand(view.myHand, rngSeed);
    return {
      action: {
        type: "CHOOSE_COLOR",
        playerId: COMPUTER_ID,
        color: picked.color,
      },
      rngSeed: picked.rngSeed,
    };
  }

  if (
    view.phase === "awaitingWildDraw4Response" &&
    view.pendingAction?.type === "wildDraw4Response" &&
    view.pendingAction.targetId === COMPUTER_ID
  ) {
    const decision = shouldChallenge(view, rngSeed);
    return {
      action: {
        type: "RESPOND_WILD_DRAW4",
        playerId: COMPUTER_ID,
        challenge: decision.challenge,
      },
      rngSeed: decision.rngSeed,
    };
  }

  if (view.phase === "computerDrewCard" && view.drawnCardId) {
    const drawn = view.myHand.find((card) => card.id === view.drawnCardId);
    if (
      drawn &&
      canSelectCardForPlay(drawn, view.topDiscard, view.activeColor, view.drawnCardId)
    ) {
      return playOrDeclare(view, drawn, rngSeed);
    }
    return {
      action: { type: "KEEP_DRAWN_CARD", playerId: COMPUTER_ID },
      rngSeed,
    };
  }

  const playable = legalPlayableCards(view);
  if (playable.length === 0) {
    return { action: { type: "DRAW_CARD", playerId: COMPUTER_ID }, rngSeed };
  }

  const chosen = chooseCard(view, playable, rngSeed);
  return playOrDeclare(view, chosen.card, chosen.rngSeed);
}

function legalPlayableCards(view: PublicAiView): Card[] {
  const selectable = getPlayableCards(
    view.myHand,
    view.topDiscard,
    view.activeColor,
    view.drawnCardId,
  );
  return selectable.filter((card) => {
    if (card.type !== "wildDraw4") return true;
    const legal = canLegallyPlayWildDrawFour(view.myHand, view.activeColor);
    if (legal) return true;
    return allowBluff(view);
  });
}

function allowBluff(view: PublicAiView): boolean {
  if (view.difficulty !== "hard") return false;
  return view.opponentHandSize <= 2 && view.myHand.length >= 4;
}

function chooseCard(
  view: PublicAiView,
  playable: Card[],
  rngSeed: number,
): { card: Card; rngSeed: number } {
  if (view.difficulty === "easy") {
    const rng = nextRng(rngSeed);
    const index = Math.min(
      playable.length - 1,
      Math.floor(rng.value * playable.length),
    );
    return { card: playable[index]!, rngSeed: rng.nextSeed };
  }

  const ranked = [...playable].sort(
    (a, b) => scoreMove(b, view) - scoreMove(a, view),
  );
  if (view.difficulty === "medium") {
    const rng = nextRng(rngSeed);
    const topN = ranked.slice(0, Math.min(2, ranked.length));
    const index = Math.min(topN.length - 1, Math.floor(rng.value * topN.length));
    return { card: topN[index]!, rngSeed: rng.nextSeed };
  }

  return { card: ranked[0]!, rngSeed };
}

function playOrDeclare(
  view: PublicAiView,
  card: Card,
  rngSeed: number,
): { action: GameAction; rngSeed: number } {
  if (view.myHand.length === 2 && !view.unoDeclared) {
    return { action: { type: "DECLARE_UNO", playerId: COMPUTER_ID }, rngSeed };
  }
  return {
    action: { type: "PLAY_CARD", playerId: COMPUTER_ID, cardId: card.id },
    rngSeed,
  };
}
