import { canHumanPlayCard } from "../engine";
import { useGame } from "./GameProvider";
import { CardBack, CardView } from "./CardView";
import { UnoButton } from "./UnoButton";

export function ComputerArea() {
  const { state } = useGame();
  const count = state.hands.computer.length;
  const showFaces = state.debug;
  const cards = state.hands.computer.slice(0, Math.min(count, 12));

  return (
    <section className="px-3 pt-2" aria-label="Computer">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div>
          <p className="font-black">Computer</p>
          <p className="text-emerald-100/80">
            {state.scores.computer} pts · {count} {count === 1 ? "card" : "cards"}
          </p>
        </div>
        {state.computerSaidUno || count === 1 ? (
          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-stone-900">
            UNO
          </span>
        ) : null}
      </div>
      <p className="sr-only">
        Computer has {count} face-down {count === 1 ? "card" : "cards"}.
      </p>
      <div className="hand-scroller">
        <div className="hand-row justify-center">
          {count === 0 ? (
            <p className="text-sm text-emerald-100/70">No cards</p>
          ) : (
            (showFaces ? state.hands.computer : cards).map((card, index) => (
              <div
                key={card.id}
                className="hand-slot deal-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {showFaces ? <CardView card={card} button={false} /> : <CardBack />}
              </div>
            ))
          )}
          {!showFaces && count > 12 && (
            <p className="ml-2 self-center text-sm font-bold">+{count - 12}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function HumanArea() {
  const { state, dispatch, focusedIndex, setFocusedIndex, onHumanCardClick } = useGame();
  const count = state.hands.human.length;
  const calledUno = state.unoDeclared.human && count === 2;

  return (
    <section className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" aria-label="Your hand">
      <div className="relative z-20 mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div>
          <p className="font-black">You</p>
          <p className="text-emerald-100/80">
            {state.scores.human} pts · {count} {count === 1 ? "card" : "cards"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {calledUno ? (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-stone-900">
              UNO
            </span>
          ) : null}
          <UnoButton />
          <button
            type="button"
            className="min-h-12 rounded-full bg-emerald-800 px-4 font-bold disabled:opacity-50"
            disabled={state.gamePhase !== "humanTurn"}
            onClick={() => dispatch({ type: "DRAW_CARD", playerId: "human" })}
            aria-keyshortcuts="D"
          >
            Draw
          </button>
        </div>
      </div>
      <div className="hand-scroller relative z-0">
        <div className="hand-row" role="list">
          {state.hands.human.map((card, index) => {
            const playable = canHumanPlayCard(state, card.id);
            return (
              <div key={card.id} className="hand-slot deal-in" role="listitem">
                <CardView
                  card={card}
                  playable={playable}
                  dimmed={!playable}
                  selected={focusedIndex === index}
                  onClick={() => {
                    setFocusedIndex(index);
                    onHumanCardClick(card.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
