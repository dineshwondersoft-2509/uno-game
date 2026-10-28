import { COLORS } from "../engine/constants";
import { formatColor } from "../engine/format";
import { numberCard, skipCard, wildDraw4Card } from "../engine/testUtils";
import { useGame } from "./GameProvider";

export function DebugPanel() {
  const { state, dispatch, skipAiDelay, setSkipAiDelay } = useGame();
  if (!state.debug) return null;

  return (
    <details className="rounded-xl bg-black/40 p-3 text-xs text-lime-100">
      <summary className="cursor-pointer font-black uppercase tracking-wider">
        Debug
      </summary>
      <div className="mt-2 space-y-2">
        <p>Phase: {state.gamePhase}</p>
        <p>Current: {state.currentPlayer}</p>
        <p>Dealer: {state.dealer}</p>
        <p>Direction: {state.direction}</p>
        <p>Draw pile: {state.drawPile.length}</p>
        <p>Discard: {state.discardPile.length}</p>
        <p>Drawn card: {state.drawnCardId ?? "none"}</p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={skipAiDelay}
            onChange={(event) => setSkipAiDelay(event.target.checked)}
          />
          Skip AI delay
        </label>
        <div className="flex flex-wrap gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="rounded bg-emerald-800 px-2 py-1"
              onClick={() => dispatch({ type: "DEBUG_FORCE_COLOR", color })}
            >
              Force {formatColor(color)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rounded bg-emerald-800 px-2 py-1"
          onClick={() =>
            dispatch({
              type: "DEBUG_SET_HANDS",
              human: [
                wildDraw4Card("debug-wdf"),
                numberCard("red", 1, "debug-r1"),
                numberCard("blue", 7, "debug-b7"),
              ],
              computer: [
                numberCard("red", 5, "debug-c-r5"),
                skipCard("yellow", "debug-c-skip"),
              ],
            })
          }
        >
          Known hands preset
        </button>
      </div>
    </details>
  );
}
