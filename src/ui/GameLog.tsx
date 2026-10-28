import { useGame } from "./GameProvider";

export function GameLog() {
  const { state } = useGame();
  return (
    <aside
      className="max-h-40 overflow-auto rounded-xl bg-black/25 p-3 text-xs leading-5 text-emerald-50/90 sm:max-h-none"
      aria-label="Game history"
    >
      <h2 className="mb-2 text-[0.7rem] font-black uppercase tracking-[0.2em] text-amber-200">
        History
      </h2>
      <ol className="space-y-1">
        {state.log.map((entry) => (
          <li key={entry.id}>{entry.text}</li>
        ))}
      </ol>
    </aside>
  );
}
