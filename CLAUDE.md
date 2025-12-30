# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Instructions for Claude

### Token Discipline

- Be concise by default.
- No explanations unless explicitly requested.
- No restating the question.
- No summaries at the end.
- Use bullet points only when clarity improves.
- Prefer short sentences.
- Assume reader is expert.

### Output Rules

- Answer the question directly.
- Do not add context, background, or alternatives unless asked.
- If uncertain, say "unknown" or ask one clarifying question.

### Code

- Output code only, no commentary.
- Prefer minimal, idiomatic solutions.
- Limit comments to very brief descriptions of what the code does. Do not describe why changes were made.

### Interaction

- Ask at most one clarifying question.
- Never suggest next steps unless requested.

## Project Overview

Blackjack Simulator is a browser-based Vite + React web app that runs large-scale Monte Carlo simulations of blackjack with configurable casino rules, strategy support, and card-counting (High-Low) analysis. The simulator uses Web Workers for multi-threaded execution to handle 100,000+ shoes efficiently in the browser.

## Development Commands

**Install dependencies**
```bash
npm install
```

**Start dev server** (Vite default port 5173)
```bash
npm run dev
```

**Build for production**
```bash
npm run build
```

**Lint code**
```bash
npm lint
```

**Kill dev server** (if stuck on port 5000)
```bash
npm run kill
```

**Optimize Vite** (pre-bundle dependencies)
```bash
npm run optimize
```

## Architecture

### Core Structure

The app is organized around three main layers:

1. **Simulation Core** (`src/lib/`): Pure TypeScript simulation logic for blackjack gameplay
2. **Worker Infrastructure** (`src/lib/multi-threaded-simulator.ts`, `src/lib/simulation-worker.ts`): Web Worker orchestration
3. **React UI** (`src/components/`, `src/App.tsx`): Configuration, progress tracking, and results visualization

### Key Simulation Classes

- **`BlackjackGame`** (src/lib/simulator.ts): Main game loop - orchestrates deck shuffling, deal, hand play, payout calculation, and card counting
- **`Deck`** (src/lib/blackjack-engine.ts): Card management with Fisher-Yates shuffle and penetration tracking
- **`PlayerLogic`** (src/lib/player-logic.ts): Player decisions based on loaded strategy JSON files
- **`DealerLogic`** (src/lib/dealer-logic.ts): Dealer hit/stand logic per BlackjackRules
- **`HiLoCounter`** (src/lib/card-counter.ts): High-Low card counting tracking running/true count and true-count bins
- **`StrategyManager`** (src/lib/strategy-loader.ts): Loads and caches strategy JSON from `src/assets/strategies/`

### Multi-Threading Model

- **`MultiThreadedSimulator`** (src/lib/multi-threaded-simulator.ts): Spawns N workers (min 1, max 8, defaults to hardware concurrency), splits shoe count across workers, aggregates PartialStats
- **`simulation-worker.ts`**: Web Worker entry point; each worker runs independent BlackjackGame instances and reports progress/stats
- Workers communicate via `WorkerMessage` type with shoe count allocation and abort signal handling

### Rules and Data Types

- **`BlackjackRules`** (src/lib/types.ts): Deck count, penetration, dealer S17/H17, DAS, resplit aces, surrender options
- **`SimulationStats`**: Aggregated stats (wins, losses, pushes, net winnings, house edge, stddev, true-count bins)
- **`TrueCountStats`**: Per-bin metrics (win rate, net winnings by true-count range)

### Strategy System

Strategies are JSON files in `src/assets/strategies/` with structure:
- `meta`: Deck count range, dealer upcard, rules applicability
- `dealer_upcards`: Array of upcard labels ("2"-"10", "A")
- `actions`: `hard`, `soft`, `pair` objects mapping totals/ranks to action codes (H, S, P, Dh, Ds, Rh, Rs, Rp)

**Current strategies**:
- H17_DAS_LS (Dealer hits soft 17, Double After Split, Late Surrender)
- H17_DAS_NS (H17, DAS, No Surrender)
- S17_DAS_LS (Dealer stands soft 17, DAS, Late Surrender)
- S17_DAS_NS (S17, DAS, No Surrender)

StrategyManager dynamically loads and caches these based on the current BlackjackRules.

### React Component Hierarchy

- **`App.tsx`**: Top-level state (rules, simulationConfig, progress, stats), simulation orchestration via `runSimulationMultiThreaded`, toast notifications
- **UI Inputs**: `RuleConfiguration`, `SimulationConfiguration` - form controls that update state
- **Simulation**: `SimulationProgress` - real-time progress bar and live stats; `PerformanceStats` - timing/throughput
- **Results**: `SimulationResults` - summary stats export; `BettingReturns` - true-count bin table; `TrueCountWinRates`, `PerformanceStats` - charts

### External Dependencies

- **Vite + React 19**: Build and UI framework
- **TypeScript ~5.7**: Type safety
- **Tailwind CSS 4 + @tailwindcss/vite**: Styling
- **Radix UI**: Headless component library (select, dialog, tabs, progress, etc.)
- **React Hook Form + Zod**: Form validation
- **Recharts**: Statistical charts (bar, line, pie)
- **@github/spark**: GitHub design system (custom hooks, icons, Phosphor icons)
- **react-resizable-panels**: Flexible layout panels
- **sonner**: Toast notifications

## Key Patterns

### Progress & Cancellation

Simulations use `AbortController` for clean cancellation. Workers listen to abort signals and stop processing. Progress callbacks are debounced (only update if `totalHands > 0`).

### Card Counting Integration

Each `BlackjackGame` instance maintains a `HiLoCounter` that tracks true count throughout each shoe. Stats aggregation bucketes results by true-count bin (integer ranges like -3..0, 1..4, etc.) to show EV and win rate per count level.

### Bet Sizing

`calculateBetSize()` in `multi-threaded-simulator.ts` implements a simple counting strategy:
- True count ≤ -3: 0 (skip hand)
- -2 to 0: 0.5 unit
- 1 to 4: 1-4 units (linear)
- ≥ 5: 8 units

This models a realistic betting spread for counting analysis.

### Strategy Validation

`StrategyStatus` component checks if the current `BlackjackRules` match any loaded strategy. The simulator will fail at runtime if no matching strategy is found.

## Testing & Validation Notes

- Core logic (hand value calculation, dealer logic, payout accounting) is deterministic and should be unit-tested
- Strategies are validated by structure (meta, actions keys) during load
- Penetration calculations: total cards × penetration = shuffle point; decks count as 52 cards each
- True-count calculation: running count ÷ (remaining cards ÷ 52)
- Monte Carlo validation: run ~100k shoes and compare house edge to theoretical values (typically 0.4-0.6% depending on rules)

## Build Configuration

- **Vite entry**: `index.html` with React root
- **Chunk splitting** (vite.config.ts): Vendor chunks for React, Radix, forms/validation, and charts
- **Path alias**: `@/` maps to `src/`
- **Tailwind 4**: CSS generation via Vite plugin
- **Spark plugins**: Icon proxy and Spark design system integration (required)

## Common Development Tasks

### Adding a New Rule Option

1. Add field to `BlackjackRules` interface (src/lib/types.ts)
2. Update `DEFAULT_RULES` and `VALID_PENETRATIONS` if needed
3. Add form control in `RuleConfiguration` component
4. Implement logic in `DealerLogic` or `PlayerLogic` as appropriate
5. Update strategy JSON files if the new rule affects strategy validity

### Adding a New Strategy

1. Create JSON file in `src/assets/strategies/` following the documented structure
2. Register in `STRATEGY_MAP` within `strategy-registry.ts`
3. Test with `StrategyStatus` component to ensure it loads correctly

### Debugging Simulation Logic

- Use `BlackjackGame.playHand()` step-by-step with console logging
- Verify deck reset at penetration threshold
- Check `HiLoCounter` logic by comparing running/true count manually against log output
- Validate payout multipliers in `calculatePayout()` match current rules

### Performance Optimization

- Worker count is capped at 8; increasing beyond hardware concurrency degrades performance
- `calculateBetSize()` is called per-hand; avoid expensive operations here
- Stats aggregation uses object merging; consider using typed arrays for very large shoe counts
- CSS animations: `.animate-pulse` on stop button is GPU-accelerated; avoid adding expensive animations during simulation

## Notes on the Codebase

- The app uses browser localStorage (via `useKV` from `@github/spark`) to persist rules and simulation config between sessions
- Errors during simulation are caught and shown as toast notifications; the simulation state is cleaned up properly
- The build output includes vendor chunking to optimize cache busting on dependency updates
- Spark plugin is required for the app to build; do not remove the `createIconImportProxy` and `sparkPlugin` calls from vite.config.ts
