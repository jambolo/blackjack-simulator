import { BlackjackRules } from './types';
import { getStrategyData } from './strategy-registry';

// Strategy action types
export type StrategyAction = 'H' | 'S' | 'D' | 'P' | 'R'; // Hit, Stand, Double, sPlit, suRrender

// Basic strategy data structure
export interface BasicStrategyData {
  name: string;
  hardTotals: Record<string, Record<string, StrategyAction>>;
  softTotals: Record<string, Record<string, StrategyAction>>;
  pairs: Record<string, Record<string, StrategyAction>>;
  surrender: Record<string, Record<string, StrategyAction>>;
}

// Optimized strategy lookup structure for fast O(1) access
export interface OptimizedStrategy {
  name: string;
  // Using Maps for faster lookup than objects
  hardTotals: Map<number, Map<number, StrategyAction>>;
  softTotals: Map<number, Map<number, StrategyAction>>;
  pairs: Map<string, Map<number, StrategyAction>>;
  surrender: Map<number, Map<number, StrategyAction>>;
}

/**
 * Loads and optimizes a basic strategy into efficient data structures
 */
export function loadBasicStrategy(rules: BlackjackRules): OptimizedStrategy {
  const strategyData = getStrategyData(rules);
  
  // Convert to optimized Maps for O(1) lookup
  const optimized: OptimizedStrategy = {
    name: strategyData.name,
    hardTotals: new Map(),
    softTotals: new Map(),
    pairs: new Map(),
    surrender: new Map(),
  };
  
  // Convert hard totals
  for (const [total, dealerActions] of Object.entries(strategyData.hardTotals)) {
    const totalNum = parseInt(total);
    const dealerMap = new Map<number, StrategyAction>();
    
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const dealerValue = dealer === 'A' ? 11 : parseInt(dealer);
      dealerMap.set(dealerValue, action as StrategyAction);
    }
    
    optimized.hardTotals.set(totalNum, dealerMap);
  }
  
  // Convert soft totals
  for (const [total, dealerActions] of Object.entries(strategyData.softTotals)) {
    const totalNum = parseInt(total);
    const dealerMap = new Map<number, StrategyAction>();
    
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const dealerValue = dealer === 'A' ? 11 : parseInt(dealer);
      dealerMap.set(dealerValue, action as StrategyAction);
    }
    
    optimized.softTotals.set(totalNum, dealerMap);
  }
  
  // Convert pairs
  for (const [rank, dealerActions] of Object.entries(strategyData.pairs)) {
    const dealerMap = new Map<number, StrategyAction>();
    
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const dealerValue = dealer === 'A' ? 11 : parseInt(dealer);
      dealerMap.set(dealerValue, action as StrategyAction);
    }
    
    optimized.pairs.set(rank, dealerMap);
  }
  
  // Convert surrender
  for (const [total, dealerActions] of Object.entries(strategyData.surrender)) {
    const totalNum = parseInt(total);
    const dealerMap = new Map<number, StrategyAction>();
    
    for (const [dealer, action] of Object.entries(dealerActions)) {
      const dealerValue = dealer === 'A' ? 11 : parseInt(dealer);
      dealerMap.set(dealerValue, action as StrategyAction);
    }
    
    optimized.surrender.set(totalNum, dealerMap);
  }
  
  return optimized;
}

/**
 * Basic strategy lookup class with optimized data structures
 */
export class OptimizedBasicStrategy {
  private strategy: OptimizedStrategy;
  
  constructor(strategy: OptimizedStrategy) {
    this.strategy = strategy;
  }
  
  /**
   * Gets the optimal action for a given situation
   */
  getAction(
    playerTotal: number, 
    playerSoft: boolean, 
    dealerUpCard: number, 
    canDouble: boolean = false,
    canSplit: boolean = false,
    pairRank?: string
  ): StrategyAction {
    // Normalize dealer up card (Ace = 11, others face value)
    const dealerValue = dealerUpCard === 1 ? 11 : dealerUpCard;
    
    // Check for pair first if applicable
    if (canSplit && pairRank) {
      const action = this.getPairAction(pairRank, dealerValue);
      if (action === 'P') return action;
    }
    
    // Check for surrender if available (only on initial 2-card hands)
    if (canDouble) { // canDouble indicates initial hand
      const surrenderAction = this.getSurrenderAction(playerTotal, dealerValue);
      if (surrenderAction === 'R') return surrenderAction;
    }
    
    // Get main action (hit/stand/double)
    const action = playerSoft 
      ? this.getSoftAction(playerTotal, dealerValue) 
      : this.getHardAction(playerTotal, dealerValue);
    
    // If strategy says double but we can't, hit instead
    if (action === 'D' && !canDouble) {
      return 'H';
    }
    
    return action;
  }
  
  /**
   * Gets action for hard totals
   */
  private getHardAction(total: number, dealerUpCard: number): StrategyAction {
    const dealerMap = this.strategy.hardTotals.get(total);
    if (!dealerMap) {
      // Default fallback for unusual totals
      if (total <= 8) return 'H';              // Always hit low totals
      if (total >= 17) return 'S';             // Always stand on 17+
      if (total >= 13 && dealerUpCard <= 6) return 'S';  // Stand on stiff vs weak dealer
      return 'H';                              // Hit otherwise
    }
    
    return dealerMap.get(dealerUpCard) || 'H';
  }
  
  /**
   * Gets action for soft totals
   */
  private getSoftAction(total: number, dealerUpCard: number): StrategyAction {
    const dealerMap = this.strategy.softTotals.get(total);
    if (!dealerMap) {
      // Default fallback for unusual soft totals
      if (total <= 17) return 'H';    // Hit soft 17 and below
      return 'S';                     // Stand on soft 18+
    }
    
    return dealerMap.get(dealerUpCard) || 'H';
  }
  
  /**
   * Gets action for pairs
   */
  private getPairAction(rank: string, dealerUpCard: number): StrategyAction {
    const dealerMap = this.strategy.pairs.get(rank);
    if (!dealerMap) {
      return 'H'; // Default if pair not found
    }
    
    return dealerMap.get(dealerUpCard) || 'H';
  }
  
  /**
   * Gets surrender action if applicable
   */
  private getSurrenderAction(total: number, dealerUpCard: number): StrategyAction | null {
    const dealerMap = this.strategy.surrender.get(total);
    if (!dealerMap) {
      return null;
    }
    
    return dealerMap.get(dealerUpCard) || null;
  }
  
  /**
   * Convenience methods for backward compatibility
   */
  shouldHit(playerTotal: number, playerSoft: boolean, dealerUpCard: number, canDouble: boolean = false): 'hit' | 'stand' | 'double' {
    const action = this.getAction(playerTotal, playerSoft, dealerUpCard, canDouble);
    
    switch (action) {
      case 'H': return 'hit';
      case 'S': return 'stand';
      case 'D': return canDouble ? 'double' : 'hit';
      default: return 'hit';
    }
  }
  
  shouldSplitPair(rank: string, dealerUpCard: number): boolean {
    const action = this.getPairAction(rank, dealerUpCard);
    return action === 'P';
  }
  
  shouldSurrender(playerTotal: number, playerSoft: boolean, dealerUpCard: number): boolean {
    if (playerSoft) return false; // Never surrender soft hands in basic strategy
    const action = this.getSurrenderAction(playerTotal, dealerUpCard);
    return action === 'R';
  }
}

/**
 * Strategy manager that handles loading and caching of strategies
 */
export class StrategyManager {
  private static cache = new Map<string, OptimizedBasicStrategy>();
  
  /**
   * Gets the appropriate strategy for the given rules, loading if necessary
   */
  static getStrategy(rules: BlackjackRules): OptimizedBasicStrategy {
    const cacheKey = this.getCacheKey(rules);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    try {
      const optimizedStrategy = loadBasicStrategy(rules);
      const strategy = new OptimizedBasicStrategy(optimizedStrategy);
      this.cache.set(cacheKey, strategy);
      return strategy;
    } catch (error) {
      throw new Error('Unable to load any basic strategy');
    }
  }
  
  /**
   * Generate a cache key based on rules
   */
  private static getCacheKey(rules: BlackjackRules): string {
    const dealerRule = rules.dealerHitsSoft17 ? 'h17' : 's17';
    const surrenderRule = rules.lateSurrender ? 'ls' : 'ns';
    return `${dealerRule}-das-${surrenderRule}`;
  }
  
  /**
   * Clears the strategy cache (useful for testing or rule changes)
   */
  static clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Pre-loads strategies for common rule sets to improve performance
   */
  static preloadCommonStrategies(): void {
    const commonRuleSets: BlackjackRules[] = [
      { deckCount: 6, dealerHitsSoft17: true, doubleAfterSplit: true, resplitAces: false, hitAfterSplitAces: false, lateSurrender: false, penetration: 1.5 },
      { deckCount: 6, dealerHitsSoft17: false, doubleAfterSplit: true, resplitAces: false, hitAfterSplitAces: false, lateSurrender: false, penetration: 1.5 },
      { deckCount: 1, dealerHitsSoft17: false, doubleAfterSplit: true, resplitAces: false, hitAfterSplitAces: false, lateSurrender: false, penetration: 0.5 },
    ];
    
    commonRuleSets.forEach(rules => this.getStrategy(rules));
  }
}