export type CardColor = "red" | "yellow" | "green" | "blue";

export type CardType =
  | "number"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wildDraw4";

export type Card = {
  id: string;
  color: CardColor | null;
  type: CardType;
  number?: number;
};

export const HUMAN_ID = "human" as const;
export const COMPUTER_ID = "computer" as const;
export type PlayerId = typeof HUMAN_ID | typeof COMPUTER_ID;

export type PlayerKind = "human" | "ai";

export type Player = {
  id: PlayerId;
  name: string;
  kind: PlayerKind;
  seat: number;
};

export type Direction = 1 | -1;

export type GamePhase =
  | "setup"
  | "humanTurn"
  | "humanDrewCard"
  | "computerThinking"
  | "computerDrewCard"
  | "choosingWildColor"
  | "awaitingWildDraw4Response"
  | "resolvingChallenge"
  | "resolvingPenalty"
  | "handOver"
  | "matchOver";

export type AiDifficulty = "easy" | "medium" | "hard";

export type SfxEvent = "play" | "draw" | "action" | "uno" | "win" | "challenge";

export type RuleConfig = {
  stackingDrawTwo: boolean;
  stackingWildDrawFour: boolean;
  jumpIn: boolean;
  sevenZero: boolean;
  playMultipleIdentical: boolean;
  drawUntilPlayable: boolean;
  matchPointsToWin: number;
};

export type GameLogEntry = {
  id: number;
  text: string;
};

export type ScoreLine = {
  cardId: string;
  label: string;
  points: number;
};

export type HandScoreSummary = {
  winner: PlayerId;
  points: number;
  breakdown: ScoreLine[];
};

export type PendingWildColor = {
  type: "wildColor";
  playerId: PlayerId;
  cardType: "wild" | "wildDraw4";
  wasWildDrawFourLegal: boolean | null;
  previousColor: CardColor | null;
  unoMissed: boolean;
  goingOut: boolean;
  isOpening: boolean;
};

export type PendingWildDraw4Response = {
  type: "wildDraw4Response";
  playedBy: PlayerId;
  targetId: PlayerId;
  wasLegal: boolean;
  previousColor: CardColor;
  chosenColor: CardColor;
  unoMissed: boolean;
  goingOut: boolean;
};

export type PendingAction = PendingWildColor | PendingWildDraw4Response;

export type Hands = {
  human: Card[];
  computer: Card[];
};

export type PlayerScores = {
  human: number;
  computer: number;
};

export type UnoFlags = {
  human: boolean;
  computer: boolean;
};

export type VoluntaryDrawInfo = {
  playerId: PlayerId;
  color: CardColor | null;
};

export type GameState = {
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  hands: Hands;
  activeColor: CardColor | null;
  currentPlayer: PlayerId;
  dealer: PlayerId;
  direction: Direction;
  gamePhase: GamePhase;
  scores: PlayerScores;
  pendingAction: PendingAction | null;
  winner: PlayerId | null;
  matchWinner: PlayerId | null;
  drawnCardId: string | null;
  unoDeclared: UnoFlags;
  lastHandScore: HandScoreSummary | null;
  log: GameLogEntry[];
  nextLogId: number;
  rngSeed: number;
  rules: RuleConfig;
  aiDifficulty: AiDifficulty;
  debug: boolean;
  lastError: string | null;
  statusMessage: string;
  sfx: SfxEvent | null;
  lastPlayedCardId: string | null;
  handNumber: number;
  computerSaidUno: boolean;
  lastVoluntaryDraw: VoluntaryDrawInfo | null;
};

export type StartMatchOptions = {
  seed?: number;
  difficulty?: AiDifficulty;
  debug?: boolean;
  rules?: Partial<RuleConfig>;
};
