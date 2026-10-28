import type { CardColor, RuleConfig } from "./types";

export const COLORS: readonly CardColor[] = ["red", "yellow", "green", "blue"];

export const CLASSIC_RULES: RuleConfig = {
  stackingDrawTwo: false,
  stackingWildDrawFour: false,
  jumpIn: false,
  sevenZero: false,
  playMultipleIdentical: false,
  drawUntilPlayable: false,
  matchPointsToWin: 500,
};

export const MAX_LOG_ENTRIES = 20;
export const CARDS_PER_PLAYER = 7;
export const DEFAULT_MATCH_POINTS = 500;
