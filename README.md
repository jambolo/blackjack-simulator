# Blackjack Simulator

A browser-first, Vite + React web app that runs large-scale simulations of the casino game blackjack and provides statistical analysis — including High–Low card-counting metrics — to evaluate strategies and betting performance.


## Highlights / Features
- Browser-based simulator (no CLI) — configure and run experiments directly in the UI.
- Flexible rule configuration: decks, penetration (shuffle frequency), dealer S17/H17, payouts, surrender, DAS, resplitting, etc.
- Strategy support: built-in basic strategy plus pluggable TypeScript strategies and counting agents.
- Card-counting analysis (High–Low): running count, true count, betting spreads, EV by true-count bin, variance, betting correlation.
- Exportable results (CSV/JSON) for offline analysis and research.

## Tech stack
- Vite, React, TypeScript
- Tailwind CSS for styling
- Frontend-only simulation core (can be adapted to run headless by reusing core modules)

## Browser Quick Start (dev & build)
Note: npm commands below are examples. If package.json is present, replace with actual scripts.

1. Install
```bash
npm install
```

2. Start dev server
```bash
npm run dev
# open the URL printed by Vite (usually http://localhost:5173)
```

3. Build for production
```bash
npm run build
# serve the build via: npm run start (if configured) or `npx serve dist`
```

## Usage (configure and run simulations in the browser UI)
- Open the app in your browser after starting the dev server or serving the production build.
- Configure experiment parameters:
  - Shoe: number of decks and penetration (shuffle point).
  - Casino rules: dealer behavior (S17/H17), blackjack payout, surrender/DAS/resplit options.
  - Player: select strategy (basic, counting, custom) and betting spread/bankroll settings.
- Run a single run or a batch job from the UI. The app supports headless batch runs in the browser (no step-by-step playback required).
- Inspect per-hand logs (optional), aggregated summaries (win rate, ROI, stddev), and detailed High–Low reports.
- Export results using the export controls to CSV or JSON for further analysis.

## Card-counting (High–Low) analysis details
What the app reports:
- Running count and true count per shoe/hand.
- True-count bins: aggregated EV and win rate per true-count bin.
- Betting spread simulation: simulated bankroll progression using chosen bet sizing tied to true count.
- Variance and standard deviation by bin; betting correlation and betting efficiency metrics.
Why this matters:
- True-count EV by bin shows how expected return changes with deck composition — crucial for sizing bets.
- Variance and betting correlation quantify real-world risk and the efficiency of your spread, helping determine whether a counting strategy is practically profitable after variance, table limits, and penetration constraints are considered.

## Strategy guidance
- Strategies are JSON modules. See src/assets/strategies for examples.

### Strategy JSON format (summary)
#### Top-level object contains these keys:

- meta (object)
  - decks: [min, max] — two-number array indicating the minimum and maximum number of decks the strategy applies to.
  - peek_style: string — describes when the dealer checks for blackjack (e.g. "American").  
  - dealer_stands_on_soft_17: boolean — true if dealer stands on soft 17 (S17), false for H17.
  - double_after_split_allowed: boolean
  - surrender_allowed: boolean
  - surrender_type: string (if allowed) — e.g. "late" or "early"

- dealer_upcards (array) — REQUIRED. Array of dealer upcard labels the strategy uses (typical values: "2","3","4","5","6","7","8","9","10","A").

- actions (object) — decision tables, split into three sub-objects:
  - hard (object) — keys are hard totals; each value is an object that maps dealer upcard (must match entries in dealer_upcards) → action code.
  - soft (object) — keys are soft totals (total when containing an ace counted as 11, e.g. "13" for A+2); same mapping shape as hard.
  - pair (object) — keys are pair ranks ("2","3",...,"10","A"); maps dealer upcard → action code.

- legend (object) — OPTIONAL. Maps action codes to human‑readable descriptions.

#### Required (if present) action codes and meanings
- H   — Hit
- S   — Stand
- P   — Split
- Dh  — Double if possible, otherwise Hit
- Ds  — Double if possible, otherwise Stand
- Rh  — Surrender if possible, otherwise Hit
- Rs  — Surrender if possible, otherwise Stand
- Rp  — Surrender if possible, otherwise Split

#### Notes
- Dealer upcard keys used inside actions must match the strings listed in dealer_upcards.
- All numeric hand totals and pair ranks are represented as strings in the JSON.
- Include a legend if you introduce nonstandard codes or want self-documenting files.
- Files following this format are located under src/assets/strategies and are consumed by the simulator to drive decision logic.

## Development notes
- Typical npm scripts (examples — replace with actual package.json scripts if present):
  - npm run dev — start Vite dev server
  - npm run build — build production bundle
  - npm run start — serve built assets
  - npm run test — run unit tests
  - npm run lint — run linters
- Source location: src/ (TypeScript, React components, simulation core, strategies)

## Testing & validation guidance
- Unit-test core simulation: dealing, shoe and shuffle behavior, payout accounting, and strategy decision correctness.
- Statistical validation: run long Monte Carlo experiments to confirm mean/variance stability and compare with theoretical EV for sanity checks.
- Add tests for counting-related metrics (true-count calculation, bet correlation).

## Contributing
- Fork, create a branch, add tests for changes to simulation/statistics, and open a PR with a clear description.
- Prefer small, focused changes that include unit tests for deterministic logic.

## License
- See LICENSE in the repository for licensing details.
