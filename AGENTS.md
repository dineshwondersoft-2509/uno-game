# uno-game — UNO-style card game (Human vs Computer)

This file is the project's AI context. It replaces the chat history, which was deleted on 28 Oct 2026. Cursor, Kiro, Antigravity, and Claude Code read `AGENTS.md`. After any change that matters, update **History** and **Current state** here.

## Owner and working style

- Owner: Dinesh Kumar R (GitHub `dineshwondersoft-2509`). Built on a company-managed Windows 11 laptop (PowerShell, no admin rights; Windows Firewall blocks inbound traffic on Public networks).
- The user wants direct action, then a short plain-language result. Ask before pushing, deploying, or deleting.
- To share the running game outside this PC when the LAN does not work (phone hotspot, Public network): `npx --yes cloudflared tunnel --url http://localhost:5173`. The link lives only while that process runs.

## What it is

A complete, playable UNO-style card game for the web: one human against one computer AI, official Classic rules, first to 500 points. Version 1 deliberately has no backend, accounts, or online multiplayer, but the engine is built so those (and house rules, 3–4 players, AI personalities) can be added without rewriting it. Card art is original CSS/SVG, not Mattel artwork.

## Run

```powershell
cd uno-game
npm install
npm run dev        # vite --host on port 5173 (strictPort), reachable on the LAN
npm test           # vitest, 69 tests (engine + AI + autoplay smoke tests)
npm run build      # tsc -b && vite build -> dist/
npm run lint       # oxlint (only Fast Refresh / hook warnings, no errors)
```

- Local: http://localhost:5173. Other devices on the same network: `http://<this PC's IPv4>:5173` (Windows Firewall must allow Node on a Private network; on a phone hotspot or Public network it will not work, use a Cloudflare tunnel instead).
- Debug mode, dev builds only: open `/?debug=1`. Shows the Computer hand, forces active color, skips AI delay, inspects deck count and phase. Hidden in production (`src/debug/isDebug.ts`).
- Editing `App.tsx` only changes code; the user must open the URL in a browser to see the game.

## Architecture (keep it this way)

| Layer | Folder | Rule |
|---|---|---|
| Rule engine | `src/engine/` | Pure functions + one reducer (`reducer.ts`, explicit `GamePhase` state machine in `types.ts`). Single source of truth for legality. |
| AI | `src/ai/` | Sees only `toPublicAiView(state)` (`publicView.ts`). Asks the same engine for legal moves. Never reads the human hand or draw-pile order. |
| UI | `src/ui/` | Asks the engine (`selectors.ts`) whether an action is legal. No rule logic in components. `GameProvider.tsx` drives AI turns with a 500–1000 ms delay. |
| Audio | `src/audio/sounds.ts` | Optional, toggleable. Rules never depend on animation or sound timing. |

Key engine functions: `createDeck`, `shuffleDeck` (Fisher-Yates, seeded `rng.ts`), `canPlayCard`, `canLegallyPlayWildDrawFour(hand, activeColor)`, `canSelectCardForPlay`, `wasWildDrawFourLegal`, `drawCards` (auto-recycles discard pile), `replenishDrawPile`, `playCard`, `applyCardEffect`, `resolveWildDrawFourChallenge`, `declareUno`, `checkUnoPenalty`, `calculateHandScore`, `checkMatchWinner`, `startNewHand`, `resetMatch`. `DEFAULT_MATCH_POINTS = 500` in `constants.ts`. Rule toggles live in `RuleConfig` (`setup.ts` `mergeRules`) for future house rules.

## Rules that are easy to get wrong (all implemented and tested)

- 108-card deck, unique ID per card; Wild / Wild Draw Four have `color: null`. `activeColor` is tracked separately from the top card's color.
- Opening card: Draw Two = first player draws 2 and is skipped; Skip/Reverse = first player skipped; Wild = starting player picks color; Wild Draw Four = reshuffled and redrawn.
- Drawing: a player may draw exactly one card even when holding a playable card. Afterwards only that drawn card (`drawnCardId`) may be played, or they keep it and the turn ends. No draw-until-playable.
- Two players: Skip, Reverse, and Draw Two all give the same player another turn. No stacking of any kind; Jump-In and 7-0 are off.
- Wild Draw Four may be played as a bluff. Legality is only "had no card of the previous active color" (same number or symbol does not matter), snapshotted at play time. Target chooses Accept (draw 4, lose turn) or Challenge: illegal = player who played it draws 4, challenger plays; legal = challenger draws 6 and loses turn. AI decides to challenge from public information only.
- UNO: human must press **UNO!** (or `U`) before playing the card that leaves 1 card; otherwise the Computer catches it and the human draws 2. Computer always declares. Not needed going from 1 to 0.
- Final card effects (Draw Two, Wild Draw Four incl. challenge) resolve before scoring; a successful challenge on a final illegal WD4 means the hand continues.
- Scoring: numbers face value, action cards 20, wilds 50; winner of the hand gets the opponent's hand total. Match ends at 500+ with a Match Winner screen.
- AI difficulty Easy / Medium (default) / Hard changes strategy only, never rules.

## History

- 17 Sep 2026: built from scratch in the order engine -> tests -> UI -> wild/challenge -> UNO -> scoring -> AI -> polish. Separate `vitest.config.ts` was needed because Vitest conflicted with the Vite plugins. Fixed challenge result text being overwritten by the next-turn status.
- 17 Sep 2026: UNO button reworked because presses felt like nothing happened. Now it shows a pressed state (`Say UNO!` -> `UNO called`), a big on-table "UNO!" burst, plays a sound, updates status, has a raised hit target, and stays clickable outside the right moment with an explanation instead of being dead.
- 19 Sep 2026: dev server exposed on the LAN (`vite --host`, `server.host: true`, port 5173).

## Current state

Feature-complete for Version 1. No open bugs reported. Possible next steps the user has not requested yet: online multiplayer (could reuse the `game-connect` Supabase pattern), house rules via `RuleConfig`, 3–4 local players.
