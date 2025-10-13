export interface BlackjackRules {
  deckCount: 1 | 2 | 6 | 'continuous';
  penetration: 0.5 | 1 | 1.5 | 2;
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  resplitAces: boolean;
  hitAfterSplitAces: boolean;
  lateSurrender: boolean;
}

export interface SimulationConfig {
  shoeCount: number;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number; // 1-11 for A, face value for others
}

export interface Hand {
  cards: Card[];
  total: number;
  soft: boolean; // true if contains ace counted as 11
  isBlackjack: boolean;
  doubled: boolean;
  surrendered: boolean;
  bet: number;
}

export interface GameResult {
  playerHands: Hand[];
  dealerHand: Hand;
  results: ('win' | 'loss' | 'push' | 'blackjack')[];
  netWin: number;
}

export interface SimulationStats {
  totalHands: number;
  totalShoes: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  surrenders: number;
  doubles: number;
  splits: number;
  netWinnings: number;
  winRate: number;
  houseEdge: number;
  standardDeviation: number;
  trueCountFrequency: Record<number, number>;
}

export const DEFAULT_RULES: BlackjackRules = {
  deckCount: 6,
  penetration: 2,
  dealerHitsSoft17: true,
  doubleAfterSplit: true,
  resplitAces: false,
  hitAfterSplitAces: false,
  lateSurrender: false,
};

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  shoeCount: 100000,
};

export const VALID_PENETRATIONS: Record<BlackjackRules['deckCount'], number[]> = {
  1: [0.5],
  2: [0.5, 1],
  6: [0.5, 1, 1.5, 2],
  continuous: [],
};