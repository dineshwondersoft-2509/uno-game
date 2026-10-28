export function RulesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div className="max-h-[90svh] w-full max-w-lg overflow-auto rounded-2xl bg-[#102018] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="rules-title" className="text-2xl font-black">
            Classic rules
          </h2>
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-full bg-emerald-900 font-bold"
            onClick={onClose}
            aria-label="Close rules"
          >
            ×
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-emerald-50/90">
          <p>Match the discard by color, number, or symbol. A standard Wild can always be played.</p>
          <p>On your turn you may play a legal card or draw exactly one card, even if you already have a playable card.</p>
          <p>If the drawn card is playable you may play that card immediately or keep it. You cannot play a different card that was already in your hand.</p>
          <p>In this two-player game, Skip and Reverse both skip the opponent, so you play again. Draw Two makes the opponent draw 2 and skip, then you play again.</p>
          <p>After a Wild, choose the new active color. Wild Draw Four is legal only when you have no card matching the current active color. Same numbers or symbols in other colors do not make it illegal.</p>
          <p>You may still play an illegal Wild Draw Four as a bluff. The opponent may accept (+4) or challenge. A successful challenge penalizes the bluffer 4 cards. A failed challenge makes the challenger draw 6.</p>
          <p>When you play from 2 cards to 1, press UNO first (or the U key). If you forget, the computer catches you and you draw 2. Going from 1 card to 0 does not require UNO.</p>
          <p>If the draw pile runs out, older discard cards are shuffled into a new draw pile. The current top discard stays in place.</p>
          <p>The player who empties their hand scores the value of the opponent’s remaining cards: numbers face value, Skip/Reverse/Draw Two 20, Wilds 50. First to 500 points wins the match.</p>
          <p className="rounded-lg bg-amber-200/15 p-3 font-semibold text-amber-100">
            Stacking, Jump-In and 7-0 are disabled in Classic mode.
          </p>
        </div>
      </div>
    </div>
  );
}
