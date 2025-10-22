// Import strategy files as modules for build-time inclusion  
import { BlackjackRules } from './types';
import { BasicStrategyData } from './strategy-loader';

// Import the new strategy files
import H17_DAS_LS from '@/assets/strategies/H17_DAS_LS.json';
import H17_DAS_NS from '@/assets/strategies/H17_DAS_NS.json';
import S17_DAS_LS from '@/assets/strategies/S17_DAS_LS.json';
import S17_DAS_NS from '@/assets/strategies/S17_DAS_NS.json';

// Strategy file format from the JSON files
interface StrategyFile {
  meta: {
    decks: string;
    style: string;
    dealer_stands_on_soft_17: boolean;
    double_after_split_allowed: boolean;
    surrender_allowed: boolean;
    surrender_type?: string;
  };
  dealer_upcards: string[];
  actions: {
    hard: Record<string, Record<string, string>>;
    soft: Record<string, Record<string, string>>;
    pair: Record<string, Record<string, string>>;
  };
  legend: Record<string, string>;
}

// Simplified strategy data structure (type-safe)
interface StrategyLookup {
  [key: string]: {
    name: string;
    hardTotals: Record<string, Record<string, string>>;
    softTotals: Record<string, Record<string, string>>;
    pairs: Record<string, Record<string, string>>;
    surrender: Record<string, Record<string, string>>;
  };
}

/**
 * Converts an action notation from the strategy files to standard basic strategy notation
 */
function convertAction(action: string): string {
  switch (action) {
    case 'H': return 'H';     // Hit
    case 'S': return 'S';     // Stand
    case 'P': return 'P';     // Split
    case 'Dh': return 'D';    // Double if possible, otherwise Hit
    case 'Ds': return 'D';    // Double if possible, otherwise Stand (simplified to D)
    case 'Rh': return 'R';    // Surrender if possible, otherwise Hit
    case 'Rs': return 'R';    // Surrender if possible, otherwise Stand
    case 'Rp': return 'R';    // Surrender if possible, otherwise Split (rare case)
    default: return 'H';      // Default to Hit for unknown actions
  }
}

/**
 * Extracts surrender actions from strategy data
 */
function extractSurrenderActions(hardTotals: Record<string, Record<string, string>>): Record<string, Record<string, string>> {
  const surrender: Record<string, Record<string, string>> = {};
  
  for (const [total, dealerActions] of Object.entries(hardTotals)) {
    const surrenderActions: Record<string, string> = {};
    let hasSurrender = false;
    
    for (const [dealer, action] of Object.entries(dealerActions)) {
      if (action.startsWith('R')) {
        surrenderActions[dealer] = 'R';
        hasSurrender = true;
      }
    }
    
    if (hasSurrender) {
      surrender[total] = surrenderActions;
    }
  }
  
  return surrender;
}

/**
 * Converts a strategy file to our internal format
 */
function convertStrategyFile(strategyFile: StrategyFile): {
  name: string;
  hardTotals: Record<string, Record<string, string>>;
  softTotals: Record<string, Record<string, string>>;
  pairs: Record<string, Record<string, string>>;
  surrender: Record<string, Record<string, string>>;
} {
  const { meta, actions } = strategyFile;
  const dealerRule = meta.dealer_stands_on_soft_17 ? 'S17' : 'H17';
  const surrenderRule = meta.surrender_allowed ? 'LS' : 'NS';
  
  const name = `Basic Strategy - ${dealerRule}, DAS, ${surrenderRule}`;
  
  // Standard dealer upcards (string format to match our strategy format)
  const dealers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
  
  // Convert hard totals and fill in missing low totals
  const hardTotals: Record<string, Record<string, string>> = {};
  
  // For totals 4 and below, always hit
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
      hardTotals[total][dealer] = convertAction(action);
    }
  }
  
  // Convert soft totals and fill in missing low totals  
  const softTotals: Record<string, Record<string, string>> = {};
  
  // For soft 12 and below (A,1 through A,A), always hit
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
      softTotals[total][dealer] = convertAction(action);
    }
  }
  
  // Convert pairs
  const pairs: Record<string, Record<string, string>> = {};
  for (const [rank, dealerActions] of Object.entries(actions.pair)) {
    pairs[rank] = {};
    for (const [dealer, action] of Object.entries(dealerActions)) {
      pairs[rank][dealer] = convertAction(action);
    }
  }
  
  // Extract surrender actions from hard totals
  const surrender = extractSurrenderActions(actions.hard);
  
  return {
    name,
    hardTotals,
    softTotals,
    pairs,
    surrender
  };
}

/**
 * Strategy registry for fast lookup without network requests
 * Built from the imported strategy files
 */
const STRATEGY_REGISTRY: StrategyLookup = {
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