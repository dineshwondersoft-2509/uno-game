import { playerName } from "../engine/format";
import { useGame } from "./GameProvider";

export function HandOverModal() {
  const { state, dispatch } = useGame();
  if (state.gamePhase !== "handOver" || !state.lastHandScore || !state.winner) {
    return null;
  }

  const summary = state.lastHandScore;
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hand-complete-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#13231c] p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Hand complete</p>
        <h2 id="hand-complete-title" className="mt-1 text-2xl font-black">
          Winner: {playerName(summary.winner)}
        </h2>
        <p className="mt-2 text-emerald-50/90">
          Points earned this hand: <strong>{summary.points}</strong>
        </p>
        <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-sm">
          {summary.breakdown.map((line) => (
            <li key={line.cardId} className="flex justify-between gap-4">
              <span>{line.label}</span>
              <span>{line.points}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl bg-black/20 p-3 text-sm">
          <p>Total — Human: {state.scores.human}</p>
          <p>Total — Computer: {state.scores.computer}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="min-h-12 rounded-xl bg-amber-400 font-bold text-stone-900"
            onClick={() => dispatch({ type: "START_NEW_HAND" })}
          >
            Next Hand
          </button>
          <button
            type="button"
            className="min-h-12 rounded-xl bg-emerald-800 font-bold"
            onClick={() => dispatch({ type: "RESET_MATCH" })}
          >
            Restart Match
          </button>
        </div>
      </div>
    </div>
  );
}

export function MatchOverModal() {
  const { state, dispatch } = useGame();
  if (state.gamePhase !== "matchOver" || !state.matchWinner || !state.lastHandScore) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-winner-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#13231c] p-6 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Match winner</p>
        <h2 id="match-winner-title" className="mt-2 text-3xl font-black">
          {playerName(state.matchWinner)} wins
        </h2>
        <p className="mt-3 text-emerald-50/90">
          First to {state.rules.matchPointsToWin} points.
        </p>
        <div className="mt-4 rounded-xl bg-black/20 p-3 text-sm">
          <p>Human: {state.scores.human}</p>
          <p>Computer: {state.scores.computer}</p>
        </div>
        {state.lastHandScore.breakdown.length > 0 && (
          <ul className="mt-3 space-y-1 text-left text-sm">
            {state.lastHandScore.breakdown.map((line) => (
              <li key={line.cardId} className="flex justify-between">
                <span>{line.label}</span>
                <span>{line.points}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="mt-6 min-h-12 w-full rounded-xl bg-amber-400 font-bold text-stone-900"
          onClick={() => dispatch({ type: "RESET_MATCH" })}
        >
          Restart Match
        </button>
      </div>
    </div>
  );
}
