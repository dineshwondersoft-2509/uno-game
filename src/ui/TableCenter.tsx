import { formatColor } from "../engine/format";
import { useGame } from "./GameProvider";
import { CardBack, CardView } from "./CardView";
import { topDiscard } from "../engine/matching";
import type { CardColor } from "../engine/types";

export function TableCenter() {
  const { state, dispatch } = useGame();
  const top = topDiscard(state.discardPile);
  const canDraw =
    state.gamePhase === "humanTurn" && state.currentPlayer === "human";
  const canKeep =
    state.gamePhase === "humanDrewCard" && state.currentPlayer === "human";

  return (
    <section className="flex flex-col items-center justify-center gap-3 px-3 py-2" aria-label="Table">
      <p className="min-h-10 max-w-[36rem] text-center text-sm font-semibold sm:text-base" role="status" aria-live="polite">
        {state.statusMessage}
      </p>
      <div className="flex items-end justify-center gap-6 sm:gap-10">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            className="relative disabled:opacity-60"
            onClick={() => dispatch({ type: "DRAW_CARD", playerId: "human" })}
            disabled={!canDraw}
            aria-label={`Draw pile, ${state.drawPile.length} cards. Draw a card.`}
          >
            <CardBack />
            <span className="absolute -right-2 -top-2 min-w-7 rounded-full bg-black/70 px-1.5 text-center text-xs font-bold">
              {state.drawPile.length}
            </span>
          </button>
          <span className="text-xs uppercase tracking-wider text-emerald-100/80">Draw</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          {top ? (
            <div className="play-pop">
              <CardView card={top} button={false} />
            </div>
          ) : (
            <div className="card-shell border border-dashed border-white/30" />
          )}
          <span className="text-xs uppercase tracking-wider text-emerald-100/80">Discard</span>
        </div>
      </div>
      <ActiveColorPill color={state.activeColor} />
      {canKeep && (
        <button
          type="button"
          className="min-h-11 rounded-full bg-emerald-800 px-4 font-bold"
          onClick={() => dispatch({ type: "KEEP_DRAWN_CARD", playerId: "human" })}
        >
          Keep drawn card
        </button>
      )}
    </section>
  );
}

function ActiveColorPill({ color }: { color: CardColor | null }) {
  if (!color) {
    return <p className="text-xs text-emerald-100/80">No active color yet</p>;
  }
  const bg: Record<CardColor, string> = {
    red: "#e23d2d",
    yellow: "#f0c419",
    green: "#1f9d55",
    blue: "#2b6cb0",
  };
  const ink = color === "yellow" ? "#1a1303" : "#fff";
  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold"
      style={{ background: bg[color], color: ink }}
      aria-label={`Active color ${formatColor(color)}`}
    >
      <span className="uppercase tracking-wide">{formatColor(color)}</span>
    </div>
  );
}
