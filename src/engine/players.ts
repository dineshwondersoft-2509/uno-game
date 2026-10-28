import {
  COMPUTER_ID,
  HUMAN_ID,
  type Direction,
  type GameState,
  type PlayerId,
} from "./types";

export function opponent(id: PlayerId): PlayerId {
  return id === HUMAN_ID ? COMPUTER_ID : HUMAN_ID;
}

export function nextSeat(
  state: GameState,
  from: PlayerId,
  direction: Direction = state.direction,
): PlayerId {
  const idx = state.players.findIndex((player) => player.id === from);
  const count = state.players.length;
  if (idx < 0 || count === 0) return opponent(from);
  const nextIndex = (idx + direction + count) % count;
  return state.players[nextIndex]!.id;
}

export function playerCount(state: GameState): number {
  return state.players.length;
}
