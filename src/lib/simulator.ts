import { BlackjackRules, Hand, Card, GameResult, SimulationStats } from './types';
import { Deck, HandCalculator } from './blackjack-engine';
import { PlayerLogic } from './player-logic';
import { DealerLogic } from './dealer-logic';
import { StrategyManager } from './strategy-loader';

export class BlackjackGame {
  private deck: Deck;
  private rules: BlackjackRules;
  private stats: SimulationStats;
  private playerLogic: PlayerLogic;
  private dealerLogic: DealerLogic;
  private initialized: boolean = false;

  constructor(rules: BlackjackRules) {
    this.rules = rules;
    const deckCount = rules.deckCount === 'continuous' ? 6 : rules.deckCount;
    this.deck = new Deck(deckCount);
    this.stats = this.initializeStats();
    this.playerLogic = new PlayerLogic(rules, this.stats);
    this.dealerLogic = new DealerLogic(rules);
  }

  /**
   * Initialize strategy loading
   */
  initialize(): void {
    if (this.initialized) return;
    
    this.playerLogic.initialize();
    this.initialized = true;
  }

  private initializeStats(): SimulationStats {
    return {
      totalHands: 0,
      totalShoes: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      blackjacks: 0,
      surrenders: 0,
      doubles: 0,
      splits: 0,
      netWinnings: 0,
      winRate: 0,
      houseEdge: 0,
      standardDeviation: 0,
    };
  }

  private createHand(cards: Card[] = [], bet: number = 1): Hand {
    const { total, soft } = HandCalculator.calculateHand(cards);
    return {
      cards,
      total,
      soft,
      isBlackjack: HandCalculator.isBlackjack(cards),
      doubled: false,
      surrendered: false,
      bet,
    };
  }

  private dealerShouldHit(dealerHand: Hand): boolean {
    return this.dealerLogic.shouldDealerHit(dealerHand);
  }

  private playDealerHand(dealerHand: Hand): Hand {
    return this.dealerLogic.playDealerHand(dealerHand, this.deck);
  }

  private playPlayerHand(playerHand: Hand, dealerUpCard: number, canSplit: boolean = true, splitCount: number = 0): Hand[] {
    return this.playerLogic.playPlayerHands(playerHand, dealerUpCard, this.deck, canSplit, splitCount);
  }

  private calculateResults(playerHands: Hand[], dealerHand: Hand): GameResult {
    const results: ('win' | 'loss' | 'push' | 'blackjack')[] = [];
    let netWin = 0;

    for (const playerHand of playerHands) {
      let result: 'win' | 'loss' | 'push' | 'blackjack';
      let winAmount = 0;

      if (playerHand.surrendered) {
        result = 'loss';
        winAmount = -playerHand.bet * 0.5; // Lose half bet
      } else if (playerHand.total > 21) {
        result = 'loss';
        winAmount = -playerHand.bet;
      } else if (dealerHand.total > 21) {
        if (playerHand.isBlackjack) {
          result = 'blackjack';
          winAmount = playerHand.bet * 1.5; // 3:2 payout
        } else {
          result = 'win';
          winAmount = playerHand.bet;
        }
      } else if (playerHand.isBlackjack && !dealerHand.isBlackjack) {
        result = 'blackjack';
        winAmount = playerHand.bet * 1.5; // 3:2 payout
      } else if (dealerHand.isBlackjack && !playerHand.isBlackjack) {
        result = 'loss';
        winAmount = -playerHand.bet;
      } else if (playerHand.total > dealerHand.total) {
        result = 'win';
        winAmount = playerHand.bet;
      } else if (playerHand.total < dealerHand.total) {
        result = 'loss';
        winAmount = -playerHand.bet;
      } else {
        result = 'push';
        winAmount = 0;
      }

      results.push(result);
      netWin += winAmount;
    }

    return {
      playerHands,
      dealerHand,
      results,
      netWin,
    };
  }

  playHand(): GameResult {
    // Check if new shoe is needed
    if (this.rules.deckCount === 'continuous') {
      // Continuous shuffle - reset deck after every hand
      const deckCount = 6;
      this.deck.reset(deckCount);
    } else if (this.deck.needsNewShoe(this.rules.penetration, this.rules.deckCount as number)) {
      this.deck.reset(this.rules.deckCount as number);
      this.stats.totalShoes++;
    }

    // Deal initial cards
    const playerHand = this.createHand([this.deck.deal(), this.deck.deal()]);
    const dealerHand = this.dealerLogic.createHand([this.deck.deal(), this.deck.deal()]);

    // Check for dealer blackjack (American style - peek)
    if (this.dealerLogic.hasBlackjack(dealerHand)) {
      const result = this.calculateResults([playerHand], dealerHand);
      this.updateStats(result);
      return result;
    }

    // Play player hands
    const dealerUpCard = this.dealerLogic.getUpCardValue(dealerHand);
    const finalPlayerHands = this.playPlayerHand(playerHand, dealerUpCard);

    // Play dealer hand only if player has non-busted hands
    const hasNonBustedHands = finalPlayerHands.some(hand => hand.total <= 21 && !hand.surrendered);
    if (hasNonBustedHands) {
      this.playDealerHand(dealerHand);
    }

    const result = this.calculateResults(finalPlayerHands, dealerHand);
    this.updateStats(result);
    return result;
  }

  private updateStats(result: GameResult): void {
    this.stats.totalHands++;
    this.stats.netWinnings += result.netWin;

    for (let i = 0; i < result.results.length; i++) {
      const outcome = result.results[i];
      switch (outcome) {
        case 'win':
          this.stats.wins++;
          break;
        case 'loss':
          this.stats.losses++;
          break;
        case 'push':
          this.stats.pushes++;
          break;
        case 'blackjack':
          this.stats.blackjacks++;
          this.stats.wins++; // Blackjack counts as a win
          break;
      }
    }

    // Update derived statistics
    const totalDecisions = this.stats.wins + this.stats.losses; // Exclude pushes
    this.stats.winRate = totalDecisions > 0 ? (this.stats.wins / totalDecisions) * 100 : 0;
    this.stats.houseEdge = this.stats.totalHands > 0 ? -(this.stats.netWinnings / this.stats.totalHands) * 100 : 0;
  }

  getStats(): SimulationStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = this.initializeStats();
  }
}

export async function runSimulation(
  rules: BlackjackRules, 
  targetShoes: number = 1000,
  onProgress?: (progress: number, stats: SimulationStats) => void
): Promise<SimulationStats> {
  const game = new BlackjackGame(rules);
  
  // Initialize strategy loading
  game.initialize();
  
  for (let shoe = 0; shoe < targetShoes; shoe++) {
    // Play hands until shoe needs to be replaced
    while (true) {
      game.playHand();
      
      // Check if we need a new shoe
      const stats = game.getStats();
      if (rules.deckCount === 'continuous' || stats.totalShoes > shoe) {
        break;
      }
    }
    
    // Report progress every 10 shoes
    if (onProgress && shoe % 10 === 0) {
      const progress = (shoe / targetShoes) * 100;
      onProgress(progress, game.getStats());
    }
  }
  
  const finalStats = game.getStats();
  
  // Calculate standard deviation
  // This is a simplified calculation - in a real implementation,
  // you'd track individual hand results to calculate proper variance
  const variance = Math.abs(finalStats.netWinnings) / Math.sqrt(finalStats.totalHands);
  finalStats.standardDeviation = variance;
  
  if (onProgress) {
    onProgress(100, finalStats);
  }
  
  return finalStats;
}