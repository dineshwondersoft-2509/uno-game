import { MAX_LOG_ENTRIES } from "./constants";
import type { GameState, SfxEvent } from "./types";

export function appendLog(state: GameState, text: string): GameState {
  const entry = { id: state.nextLogId, text };
  return {
    ...state,
    log: [...state.log, entry].slice(-MAX_LOG_ENTRIES),
    nextLogId: state.nextLogId + 1,
  };
}

export function fail(state: GameState, message: string): GameState {
  return { ...state, lastError: message, sfx: null };
}

export function withSfx(state: GameState, sfx: SfxEvent): GameState {
  return { ...state, sfx };
}

export function withStatus(state: GameState, statusMessage: string): GameState {
  return { ...state, statusMessage };
}
