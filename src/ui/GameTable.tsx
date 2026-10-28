import { useState } from "react";
import { ChallengePrompt } from "./ChallengePrompt";
import { ColorPicker } from "./ColorPicker";
import { DebugPanel } from "./DebugPanel";
import { GameLog } from "./GameLog";
import { useGame } from "./GameProvider";
import { ComputerArea, HumanArea } from "./PlayerAreas";
import { HandOverModal, MatchOverModal } from "./ResultModals";
import { RulesModal } from "./RulesModal";
import { TableCenter } from "./TableCenter";
import { TopBar } from "./TopBar";
import { UnoBurst } from "./UnoButton";

export function GameTable() {
  const { toast } = useGame();
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="felt-table wood-frame relative mx-auto min-h-svh w-full max-w-6xl overflow-hidden">
      <div className="grid min-h-svh grid-rows-[auto_auto_1fr_auto] lg:grid-cols-[1fr_16rem] lg:grid-rows-[auto_auto_1fr_auto]">
        <div className="lg:col-span-2">
          <TopBar onOpenRules={() => setRulesOpen(true)} />
        </div>
        <div className="lg:col-start-1">
          <ComputerArea />
        </div>
        <div className="px-3 lg:col-start-1">
          <TableCenter />
        </div>
        <div className="lg:col-start-1">
          <HumanArea />
        </div>
        <div className="px-3 pb-3 lg:col-start-2 lg:row-start-2 lg:row-end-5 lg:pt-2">
          <div className="flex h-full flex-col gap-3">
            <GameLog />
            <DebugPanel />
          </div>
        </div>
      </div>
      <ColorPicker />
      <ChallengePrompt />
      <HandOverModal />
      <MatchOverModal />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <UnoBurst />
      {toast && (
        <div className="toast pointer-events-none absolute bottom-24 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl bg-stone-900/95 px-4 py-3 text-center text-sm font-semibold text-amber-100 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
