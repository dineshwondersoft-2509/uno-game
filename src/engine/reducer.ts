import type { GameAction } from "./actions";
import { fail } from "./log";
import { drawOneCard, keepDrawnCard, playCard } from "./play";
import { resetMatch, startMatch, startNextHand } from "./setup";
import type { GameState } from "./types";
import { declareUno } from "./uno";
import { chooseWildColor, resolveWildDrawFourChallenge } from "./wild";

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_MATCH":
      return startMatch({
        seed: action.seed,
        difficulty: action.difficulty ?? state.aiDifficulty,
        debug: action.debug ?? state.debug,
        rules: state.rules,
      });
    case "START_NEW_HAND":
      if (state.gamePhase !== "handOver") {
        return fail(state, "The hand is not over.");
      }
      return startNextHand(state);
    case "RESET_MATCH":
      return resetMatch(state);
    case "PLAY_CARD":
      return playCard(state, action.playerId, action.cardId);
    case "DRAW_CARD":
      return drawOneCard(state, action.playerId);
    case "KEEP_DRAWN_CARD":
      return keepDrawnCard(state, action.playerId);
    case "CHOOSE_COLOR":
      return chooseWildColor(state, action.playerId, action.color);
    case "RESPOND_WILD_DRAW4":
      return resolveWildDrawFourChallenge(state, action.playerId, action.challenge);
    case "DECLARE_UNO":
      return declareUno(state, action.playerId);
    case "SET_DIFFICULTY":
      return { ...state, aiDifficulty: action.difficulty };
    case "CLEAR_ERROR":
      return { ...state, lastError: null };
    case "CLEAR_SFX":
      return { ...state, sfx: null };
    case "DEBUG_FORCE_COLOR":
      if (!state.debug) return state;
      return { ...state, activeColor: action.color };
    case "DEBUG_SET_HANDS":
      if (!state.debug) return state;
      return {
        ...state,
        hands: { human: action.human, computer: action.computer },
      };
    case "DEBUG_FORCE_DISCARD":
      if (!state.debug) return state;
      return {
        ...state,
        discardPile: [...state.discardPile, action.card],
        activeColor: action.activeColor,
        lastPlayedCardId: action.card.id,
      };
    default: {
      const _never: never = action;
      return _never;
    }
  }
}
