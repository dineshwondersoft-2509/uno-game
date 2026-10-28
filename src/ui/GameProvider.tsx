import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { decideComputerAction, toPublicAiView } from "../ai";
import { playSfx, setSoundEnabled } from "../audio/sounds";
import { isDebugEnabled } from "../debug/isDebug";
import type { GameAction } from "../engine/actions";
import {
  canDeclareUno,
  canHumanPlayCard,
  humanCardFeedback,
  isComputerDecisionPhase,
} from "../engine";
import { reduce } from "../engine/reducer";
import { startMatch } from "../engine/setup";
import { canHumanDraw } from "../engine/play";
import type { GameState } from "../engine/types";
import { HUMAN_ID } from "../engine/types";

type GameContextValue = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  soundOn: boolean;
  setSoundOn: (value: boolean) => void;
  skipAiDelay: boolean;
  setSkipAiDelay: (value: boolean) => void;
  focusedIndex: number;
  setFocusedIndex: (value: number) => void;
  toast: string | null;
  notify: (message: string) => void;
  unoBurst: boolean;
  unoBurstNonce: number;
  onHumanCardClick: (cardId: string) => void;
  callUno: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const debug = isDebugEnabled();
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    startMatch({
      seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
      difficulty: "medium",
      debug,
    }),
  );
  const [soundOn, setSoundOnState] = useState(true);
  const [skipAiDelay, setSkipAiDelay] = useState(debug);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [unoBurst, setUnoBurst] = useState(false);
  const [unoBurstNonce, setUnoBurstNonce] = useState(0);
  const unoBurstTimer = useRef<number>(0);
  const skipEngineUnoSfx = useRef(false);

  const notify = useCallback((message: string) => {
    setToast(message);
  }, []);

  const triggerUnoBurst = useCallback(() => {
    window.clearTimeout(unoBurstTimer.current);
    setUnoBurstNonce((nonce) => nonce + 1);
    setUnoBurst(true);
    unoBurstTimer.current = window.setTimeout(() => setUnoBurst(false), 900);
  }, []);

  const callUno = useCallback(() => {
    const ready = canDeclareUno(state, HUMAN_ID);
    const alreadyCalled = state.unoDeclared.human && state.hands.human.length === 2;
    if (!ready && !alreadyCalled) {
      if (state.currentPlayer !== HUMAN_ID) {
        notify("Wait for your turn, then press UNO before your last-but-one card.");
        return;
      }
      notify("Press UNO when you have 2 cards, before you play.");
      return;
    }
    skipEngineUnoSfx.current = true;
    playSfx("uno");
    triggerUnoBurst();
    if (!alreadyCalled) {
      dispatch({ type: "DECLARE_UNO", playerId: HUMAN_ID });
    }
  }, [notify, state, triggerUnoBurst]);
  const rngSeedRef = useRef(state.rngSeed);
  const stateRef = useRef(state);
  const decisionKey = [
    state.gamePhase,
    state.currentPlayer,
    state.pendingAction?.type,
    state.drawnCardId,
    state.unoDeclared.computer,
    state.hands.computer.length,
  ].join("|");
  const focusedCardIndex =
    state.hands.human.length === 0
      ? 0
      : Math.min(focusedIndex, state.hands.human.length - 1);
  const banner = toast ?? state.lastError;

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    return () => window.clearTimeout(unoBurstTimer.current);
  }, []);

  useEffect(() => {
    const snapshot = stateRef.current;
    if (!isComputerDecisionPhase(snapshot)) return;
    const delay = skipAiDelay ? 40 : 500 + Math.floor(Math.random() * 500);
    const timer = window.setTimeout(() => {
      const view = toPublicAiView(snapshot);
      const decided = decideComputerAction(view, rngSeedRef.current);
      rngSeedRef.current = decided.rngSeed;
      dispatch(decided.action);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [decisionKey, skipAiDelay]);

  const setSoundOn = useCallback((value: boolean) => {
    setSoundOnState(value);
    setSoundEnabled(value);
  }, []);

  const onHumanCardClick = useCallback(
    (cardId: string) => {
      if (
        state.currentPlayer !== HUMAN_ID ||
        (state.gamePhase !== "humanTurn" && state.gamePhase !== "humanDrewCard")
      ) {
        setToast("Wait for your turn.");
        return;
      }
      if (canHumanPlayCard(state, cardId)) {
        dispatch({ type: "PLAY_CARD", playerId: HUMAN_ID, cardId });
        return;
      }
      const reason = humanCardFeedback(state, cardId);
      setToast(reason ?? "Match the current color, number, or symbol.");
    },
    [state],
  );

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => {
      setToast(null);
      dispatch({ type: "CLEAR_ERROR" });
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    if (!state.sfx) return;
    if (state.sfx === "uno" && skipEngineUnoSfx.current) {
      skipEngineUnoSfx.current = false;
      dispatch({ type: "CLEAR_SFX" });
      return;
    }
    playSfx(state.sfx);
    dispatch({ type: "CLEAR_SFX" });
  }, [state.sfx]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        callUno();
        return;
      }
      if (event.key === "d" || event.key === "D") {
        if (canHumanDraw(state)) {
          event.preventDefault();
          dispatch({ type: "DRAW_CARD", playerId: HUMAN_ID });
        }
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setFocusedIndex((index) => Math.min(state.hands.human.length - 1, index + 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setFocusedIndex((index) => Math.max(0, index - 1));
      }
      if (event.key === "Enter") {
        const card = state.hands.human[focusedCardIndex];
        if (card) {
          event.preventDefault();
          onHumanCardClick(card.id);
        }
      }
      if (state.gamePhase === "choosingWildColor" && state.pendingAction?.type === "wildColor" && state.pendingAction.playerId === HUMAN_ID) {
        const map: Record<string, "red" | "yellow" | "green" | "blue"> = {
          "1": "red",
          "2": "yellow",
          "3": "green",
          "4": "blue",
        };
        const color = map[event.key];
        if (color) {
          event.preventDefault();
          dispatch({ type: "CHOOSE_COLOR", playerId: HUMAN_ID, color });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [callUno, focusedCardIndex, onHumanCardClick, state]);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      dispatch,
      soundOn,
      setSoundOn,
      skipAiDelay,
      setSkipAiDelay,
      focusedIndex: focusedCardIndex,
      setFocusedIndex,
      toast: banner,
      notify,
      unoBurst,
      unoBurstNonce,
      onHumanCardClick,
      callUno,
    }),
    [
      banner,
      callUno,
      focusedCardIndex,
      notify,
      onHumanCardClick,
      skipAiDelay,
      soundOn,
      state,
      unoBurst,
      unoBurstNonce,
      setSoundOn,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) {
    throw new Error("useGame must be used inside GameProvider");
  }
  return value;
}
