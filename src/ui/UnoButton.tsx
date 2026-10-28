import { canDeclareUno } from "../engine";
import { useGame } from "./GameProvider";

export function UnoButton() {
  const { state, callUno } = useGame();
  const ready = canDeclareUno(state, "human");
  const called = state.unoDeclared.human && state.hands.human.length === 2;

  let label = "UNO!";
  if (called) label = "UNO called";
  else if (ready) label = "Say UNO!";

  return (
    <button
      type="button"
      className={`uno-btn min-h-12 min-w-[7.5rem] rounded-full px-5 text-base font-black shadow-lg ${
        called
          ? "bg-emerald-400 text-stone-900"
          : ready
            ? "uno-hot bg-amber-400 text-stone-900"
            : "bg-emerald-950 text-emerald-100"
      }`}
      aria-pressed={called}
      aria-keyshortcuts="U"
      aria-label={called ? "UNO declared" : "Declare UNO"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        callUno();
      }}
    >
      {label}
    </button>
  );
}

export function UnoBurst() {
  const { unoBurst, unoBurstNonce, state } = useGame();
  const showComputer = state.computerSaidUno && state.statusMessage === "Computer says UNO!";
  if (!unoBurst && !showComputer) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center"
      aria-hidden="true"
    >
      <p key={unoBurst ? unoBurstNonce : "computer"} className="uno-shout">
        UNO!
      </p>
    </div>
  );
}
