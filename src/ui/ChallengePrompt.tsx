import { HUMAN_ID } from "../engine/types";
import { formatColor } from "../engine/format";
import { useGame } from "./GameProvider";

export function ChallengePrompt() {
  const { state, dispatch } = useGame();
  const pending = state.pendingAction;
  if (
    state.gamePhase !== "awaitingWildDraw4Response" ||
    pending?.type !== "wildDraw4Response" ||
    pending.targetId !== HUMAN_ID
  ) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Wild Draw Four response"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#14241c] p-5 shadow-2xl">
        <h2 className="text-xl font-bold">Wild Draw Four</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">
          Computer chose {formatColor(pending.chosenColor)}. You may accept and draw 4,
          or challenge. A failed challenge draws 6.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="min-h-12 rounded-xl bg-emerald-700 px-3 py-3 font-bold"
            onClick={() =>
              dispatch({
                type: "RESPOND_WILD_DRAW4",
                playerId: HUMAN_ID,
                challenge: false,
              })
            }
          >
            Accept +4
          </button>
          <button
            type="button"
            className="min-h-12 rounded-xl bg-amber-400 px-3 py-3 font-bold text-stone-900"
            onClick={() =>
              dispatch({
                type: "RESPOND_WILD_DRAW4",
                playerId: HUMAN_ID,
                challenge: true,
              })
            }
          >
            Challenge
          </button>
        </div>
      </div>
    </div>
  );
}
