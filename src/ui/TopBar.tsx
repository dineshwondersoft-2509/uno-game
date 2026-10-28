import type { AiDifficulty } from "../engine/types";
import { useGame } from "./GameProvider";

export function TopBar({ onOpenRules }: { onOpenRules: () => void }) {
  const { state, dispatch, soundOn, setSoundOn } = useGame();

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.28em] text-amber-200">Classic match</p>
        <h1 className="text-2xl font-black leading-none">KROMA</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-bold">
          AI
          <select
            className="min-h-11 rounded-full bg-emerald-950 px-3 text-sm"
            value={state.aiDifficulty}
            onChange={(event) =>
              dispatch({
                type: "SET_DIFFICULTY",
                difficulty: event.target.value as AiDifficulty,
              })
            }
            aria-label="Computer difficulty"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <button
          type="button"
          className="min-h-11 rounded-full bg-emerald-900 px-3 text-sm font-bold"
          onClick={() => setSoundOn(!soundOn)}
          aria-pressed={soundOn}
        >
          {soundOn ? "Sound on" : "Sound off"}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full bg-emerald-900 px-3 text-sm font-bold"
          onClick={onOpenRules}
        >
          Rules
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full bg-emerald-900 px-3 text-sm font-bold"
          onClick={() => dispatch({ type: "RESET_MATCH" })}
        >
          Restart Match
        </button>
      </div>
    </header>
  );
}
