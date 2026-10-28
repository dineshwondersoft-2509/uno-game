import { COLORS } from "../engine/constants";
import { formatColor } from "../engine/format";
import type { CardColor } from "../engine/types";
import { HUMAN_ID } from "../engine/types";
import { useGame } from "./GameProvider";

export function ColorPicker() {
  const { state, dispatch } = useGame();
  const pending = state.pendingAction;
  if (
    state.gamePhase !== "choosingWildColor" ||
    pending?.type !== "wildColor" ||
    pending.playerId !== HUMAN_ID
  ) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a color"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#14241c] p-5 text-center shadow-2xl">
        <h2 className="mb-1 text-xl font-bold">Choose a color</h2>
        <p className="mb-4 text-sm text-emerald-100/80">This becomes the active color.</p>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map((color, index) => (
            <ColorButton
              key={color}
              color={color}
              shortcut={String(index + 1)}
              onClick={() =>
                dispatch({ type: "CHOOSE_COLOR", playerId: HUMAN_ID, color })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorButton({
  color,
  shortcut,
  onClick,
}: {
  color: CardColor;
  shortcut: string;
  onClick: () => void;
}) {
  const bg: Record<CardColor, string> = {
    red: "#e23d2d",
    yellow: "#f0c419",
    green: "#1f9d55",
    blue: "#2b6cb0",
  };
  const ink = color === "yellow" ? "#1a1303" : "#fff";
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 rounded-xl px-3 py-3 text-base font-black shadow-md"
      style={{ background: bg[color], color: ink }}
      aria-label={formatColor(color)}
    >
      {formatColor(color)}
      <span className="block text-xs font-semibold opacity-80">Key {shortcut}</span>
    </button>
  );
}
