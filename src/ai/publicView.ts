import type { GameState } from "../engine/types";
import { COMPUTER_ID } from "../engine/types";
import type {
  AiDifficulty,
  Card,
  CardColor,
  GameLogEntry,
  GamePhase,
  PendingAction,
  PlayerScores,
  VoluntaryDrawInfo,
} from "../engine/types";

export type PublicAiView = {
  myHand: Card[];
  opponentHandSize: number;
  topDiscard: Card;
  discardHistory: Card[];
  activeColor: CardColor | null;
  scores: PlayerScores;
  phase: GamePhase;
  drawnCardId: string | null;
  lastVoluntaryDraw: VoluntaryDrawInfo | null;
  log: GameLogEntry[];
  pendingAction: PendingAction | null;
  difficulty: AiDifficulty;
  unoDeclared: boolean;
};

export function toPublicAiView(state: GameState): PublicAiView {
  const top = state.discardPile[state.discardPile.length - 1];
  if (!top) {
    throw new Error("AI cannot act without a discard pile.");
  }
  return {
    myHand: state.hands[COMPUTER_ID],
    opponentHandSize: state.hands.human.length,
    topDiscard: top,
    discardHistory: state.discardPile,
    activeColor: state.activeColor,
    scores: state.scores,
    phase: state.gamePhase,
    drawnCardId: state.drawnCardId,
    lastVoluntaryDraw: state.lastVoluntaryDraw,
    log: state.log,
    pendingAction: state.pendingAction,
    difficulty: state.aiDifficulty,
    unoDeclared: state.unoDeclared.computer,
  };
}
