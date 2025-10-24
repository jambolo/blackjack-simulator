// Import strategy files as modules for build-time inclusion
import { BlackjackRules } from './types';


// Import the new strategy files
import H17_DAS_LS from '@/assets/strategies/H17_DAS_LS.json';
import H17_DAS_NS from '@/assets/strategies/H17_DAS_NS.json';
import S17_DAS_LS from '@/assets/strategies/S17_DAS_LS.json';
import S17_DAS_NS from '@/assets/strategies/S17_DAS_NS.json';

interface Chart {
  [hand: string]: Record<string, string>;
}

// Strategy file format from the JSON files
interface StrategyFile {
  meta: {
    decks: number[];
    peek_style: string;
    dealer_stands_on_soft_17: boolean;
    double_after_split_allowed: boolean;
    surrender_allowed: boolean;
    surrender_type?: string;
  };
  dealer_upcards: string[];
  actions: {
    hard: Chart;
    soft: Chart;
    pair: Chart;
  };
  legend: Record<string, string>;
}

// Strategy action types
export type StrategyAction = 'H' | 'S' | 'D' | 'P' | 'R'; // Hit, Stand, Double, sPlit, suRrender

export type StrategyActionTable = Record<string, Record<string, StrategyAction>>;
// Basic strategy data structure
export interface BasicStrategyData {
  name: string;
  hardTotals: StrategyActionTable;
  softTotals: StrategyActionTable;
  pairs: StrategyActionTable;
  surrender: StrategyActionTable;
  double: StrategyActionTable;
}

/**
 * Converts an action notation from the strategy files to standard basic strategy notation
 */
function convertAction(action: string): [StrategyAction, StrategyAction] {
  switch (action) {
    case 'H':  return ['H', 'H']; // Hit
    case 'S':  return ['S', 'S']; // Stand
    case 'P':  return ['P', 'P']; // Split
    case 'Dh': return ['D', 'H']; // Double if possible, otherwise Hit
    case 'Ds': return ['D', 'S']; // Double if possible, otherwise Stand
    case 'Rh': return ['R', 'H']; // Surrender if possible, otherwise Hit
    case 'Rs': return ['R', 'S']; // Surrender if possible, otherwise Stand
    case 'Rp': return ['R', 'P']; // Surrender if possible, otherwise Split
    default:   throw new Error("Unknown action");
  }
}

/**
 * Extracts surrender actions from hard, soft, and pair charts.
 * @param hard - The hard totals chart.
 * @param soft - The soft totals chart.
 * @param pair - The pair totals chart.
 * @returns A chart of surrender actions.
 */
function extractSurrenderActions(hard: Chart, soft: Chart, pair: Chart): StrategyActionTable {
  const surrender: StrategyActionTable = {};

  // Extract surrender actions from hard totals
  for (const [total, dealerActions] of Object.entries(hard)) {
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const [primary, _] = convertAction(action);
      if (primary === 'R') {
        if (!surrender[total]) {
          surrender[total] = {};
        }
        surrender[total][dealer] = 'R';
      }
    }
  }

  // Extract surrender actions from soft totals
  for (const [total, dealerActions] of Object.entries(soft)) {
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const [primary, _] = convertAction(action);
      if (primary === 'R') {
        if (!surrender[total]) {
          surrender[total] = {};
        }
        surrender[total][dealer] = 'R';
      }
    }
  }

  // Extract surrender actions from pairs
  for (const [rank, dealerActions] of Object.entries(pair)) {
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const [primary, _] = convertAction(action);
      if (primary === 'R') {
        if (!surrender[rank]) {
          surrender[rank] = {};
        }
        surrender[rank][dealer] = 'R';
      }
    }
  }

  return surrender;
}

/**
 * Extracts double actions from hard, soft, and pair charts.
 * @param hard - The hard totals chart.
 * @param soft - The soft totals chart.
 * @param pair - The pair totals chart.
 * @returns A chart of double actions.
 */
function extractDoubleActions(hard: Chart, soft: Chart): StrategyActionTable {
  const double: StrategyActionTable = {};

  // Extract double actions from hard totals
  for (const [total, dealerActions] of Object.entries(hard)) {
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const [primary, _] = convertAction(action);
      if (primary === 'D') {
        if (!double[total]) {
          double[total] = {};
        }
        double[total][dealer] = 'D';
      }
    }
  }

  // Extract double actions from soft totals
  for (const [total, dealerActions] of Object.entries(soft)) {
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const [primary, _] = convertAction(action);
      if (primary === 'D') {
        if (!double[total]) {
          double[total] = {};
        }
        double[total][dealer] = 'D';
      }
    }
  }

  return double;
}

/**
 * Converts a strategy file to our internal format
 */
function convertStrategyFile(strategyFile: StrategyFile): BasicStrategyData {
  const { meta, actions } = strategyFile;
  const dealerRule = meta.dealer_stands_on_soft_17 ? 'S17' : 'H17';
  const surrenderRule = meta.surrender_allowed ? 'LS' : 'NS';

  const name = `Basic Strategy - ${dealerRule}, DAS, ${surrenderRule}`;

  // Standard dealer upcards (string format to match our strategy format)
  const dealers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

  // Convert hard totals and fill in missing low totals
  const hardTotals: StrategyActionTable = {};

  // For totals 4 and below, always hit (2+2 is the lowest possible hard total)
  for (let total = 4; total <= 4; total++) {
    hardTotals[total.toString()] = {};
    dealers.forEach(dealer => {
      hardTotals[total.toString()][dealer] = 'H';
    });
  }

  // Convert existing hard totals from the file
  for (const [total, dealerActions] of Object.entries(actions.hard)) {
    hardTotals[total] = {};
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const [, secondary] = convertAction(action);
      hardTotals[total][dealer] = secondary;
    }
  }

  // Convert soft totals and fill in missing low totals
  const softTotals: StrategyActionTable = {};

  // For soft 12 and below, default to hit (A+A is the lowest possible soft total)
  for (let total = 12; total <= 12; total++) {
    softTotals[total.toString()] = {};
    dealers.forEach(dealer => {
      softTotals[total.toString()][dealer] = 'H';
    });
  }

  // Convert existing soft totals from the file
  for (const [total, dealerActions] of Object.entries(actions.soft)) {
    softTotals[total] = {};
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const [_, secondary] = convertAction(action);
      softTotals[total][dealer] = secondary;
    }
  }

  // Convert pairs
  const pairs: StrategyActionTable = {};
  for (const [rank, dealerActions] of Object.entries(actions.pair)) {
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const [primary, secondary] = convertAction(action);
      if (primary === 'P' || (primary === 'R' && secondary === 'P')) {
        if (!pairs[rank]) {
          pairs[rank] = {};
        }
        pairs[rank][dealer] = 'P';
      }
    }
  }

  // Extract surrender actions
  const surrender = extractSurrenderActions(actions.hard, actions.soft, actions.pair);

  // Extract double actions
  const double = extractDoubleActions(actions.hard, actions.soft);

  return {
    name,
    hardTotals,
    softTotals,
    pairs,
    surrender,
    double,
  };
}

/**
 * Strategy registry for fast lookup without network requests
 * Built from the imported strategy files
 */
const STRATEGY_REGISTRY: { [key: string]: BasicStrategyData } = {
  'h17-das-ls': convertStrategyFile(H17_DAS_LS as StrategyFile),
  'h17-das-ns': convertStrategyFile(H17_DAS_NS as StrategyFile),
  's17-das-ls': convertStrategyFile(S17_DAS_LS as StrategyFile),
  's17-das-ns': convertStrategyFile(S17_DAS_NS as StrategyFile),
};

/**
 * Gets strategy data from the registry based on rules
 */
export function getStrategyData(rules: BlackjackRules): BasicStrategyData {
  // Create strategy key based on rules
  const dealerRule = rules.dealerHitsSoft17 ? 'h17' : 's17';
  const surrenderRule = rules.lateSurrender ? 'ls' : 'ns';

  // All strategies assume DAS (Double After Split) since that's what we have
  const key = `${dealerRule}-das-${surrenderRule}`;

  const strategy = STRATEGY_REGISTRY[key];

  if (!strategy) {
    return STRATEGY_REGISTRY['s17-das-ns'] as BasicStrategyData;
  }

  return strategy as BasicStrategyData;
}

export function getAvailableStrategies(): string[] {
  return Object.keys(STRATEGY_REGISTRY);
}
