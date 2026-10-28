import { GameProvider } from "./ui/GameProvider";
import { GameTable } from "./ui/GameTable";

export default function App() {
  return (
    <GameProvider>
      <GameTable />
    </GameProvider>
  );
}
