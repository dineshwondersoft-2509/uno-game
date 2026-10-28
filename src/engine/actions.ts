import type { AiDifficulty, Card, CardColor, PlayerId } from "./types";

export type GameAction =
  | { type: "START_MATCH"; seed?: number; difficulty?: AiDifficulty; debug?: boolean }
  | { type: "START_NEW_HAND" }
  | { type: "RESET_MATCH" }
  | { type: "PLAY_CARD"; playerId: PlayerId; cardId: string }
  | { type: "DRAW_CARD"; playerId: PlayerId }
  | { type: "KEEP_DRAWN_CARD"; playerId: PlayerId }
  | { type: "CHOOSE_COLOR"; playerId: PlayerId; color: CardColor }
  | { type: "RESPOND_WILD_DRAW4"; playerId: PlayerId; challenge: boolean }
  | { type: "DECLARE_UNO"; playerId: PlayerId }
  | { type: "SET_DIFFICULTY"; difficulty: AiDifficulty }
  | { type: "CLEAR_ERROR" }
  | { type: "CLEAR_SFX" }
  | { type: "DEBUG_FORCE_COLOR"; color: CardColor }
  | { type: "DEBUG_SET_HANDS"; human: Card[]; computer: Card[] }
  | { type: "DEBUG_FORCE_DISCARD"; card: Card; activeColor: CardColor };
