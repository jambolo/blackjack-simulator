import { BlackjackRules, Hand, Card, GameResult, SimulationStats } from './types';
import { Deck, HandCalculator } from './blackjack-engine';
import { PlayerLogic } from './player-logic';
import { DealerLogic } from './dealer-logic';
import { StrategyManager } from './strategy-loader';
import { HiLoCounter } from './card-counter';

export class BlackjackGame {
  private deck: Deck;
  private rules: BlackjackRules;
  private stats: SimulationStats;
  private playerLogic: PlayerLogic;
  private dealerLogic: DealerLogic;
  private initialized: boolean = false;
  private cardCounter: HiLoCounter;
  private currentHandTrueCount: number = 0;
  private completedShoes: number = 0;
  private currentShoeHands: number = 0;

  constructor(rules: BlackjackRules) {
    this.rules = rules;
    this.deck = new Deck(rules.deckCount);
    this.stats = this.initializeStats();
    this.playerLogic = new PlayerLogic(rules, this.stats);
    this.dealerLogic = new DealerLogic(rules);
    this.cardCounter = new HiLoCounter(rules.deckCount);
    this.completedShoes = 0;
    this.currentShoeHands = 0;
    
    this.stats.totalShoes = 1;
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
      trueCountFrequency: {},
      trueCountStats: {},
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
    return this.dealerLogic.playDealerHand(dealerHand, this.deck, this.cardCounter);
  }

  private playPlayerHand(playerHand: Hand, dealerUpCard: number, canSplit: boolean = true, splitCount: number = 0): Hand[] {
    return this.playerLogic.playPlayerHands(playerHand, dealerUpCard, this.deck, this.cardCounter, canSplit, splitCount);
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
    if (this.deck.needsNewShoe(this.rules.penetration, this.rules.deckCount)) {
      this.stats.totalShoes++;
      this.deck.reset(this.rules.deckCount);
      this.cardCounter.reset(this.rules.deckCount);
    }

    const trueCountAtStart = this.cardCounter.getTrueCountInteger();
    this.currentHandTrueCount = trueCountAtStart;
    
    if (this.stats.trueCountFrequency[trueCountAtStart]) {
      this.stats.trueCountFrequency[trueCountAtStart]++;
    } else {
      this.stats.trueCountFrequency[trueCountAtStart] = 1;
    }

    try {
      const playerCard1 = this.deck.deal();
      const dealerCard1 = this.deck.deal();
      const playerCard2 = this.deck.deal();
      const dealerCard2 = this.deck.deal();

      this.cardCounter.countCards([playerCard1, dealerCard1, playerCard2, dealerCard2]);

      const playerHand = this.createHand([playerCard1, playerCard2]);
      const dealerHand = this.dealerLogic.createHand([dealerCard1, dealerCard2]);

      if (this.dealerLogic.hasBlackjack(dealerHand)) {
        const result = this.calculateResults([playerHand], dealerHand);
        this.updateStats(result);
        return result;
      }

      const dealerUpCard = this.dealerLogic.getUpCardValue(dealerHand);
      const finalPlayerHands = this.playPlayerHand(playerHand, dealerUpCard);

      const hasNonBustedHands = finalPlayerHands.some(hand => hand.total <= 21 && !hand.surrendered);
      if (hasNonBustedHands) {
        this.playDealerHand(dealerHand);
      }

      const result = this.calculateResults(finalPlayerHands, dealerHand);
      this.updateStats(result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not enough cards')) {
        this.stats.totalShoes++;
        this.deck.reset(this.rules.deckCount);
        this.cardCounter.reset(this.rules.deckCount);
        return this.playHand();
      }
      throw error;
    }
  }

  private initializeTrueCountStats(trueCount: number): void {
    if (!this.stats.trueCountStats[trueCount]) {
      this.stats.trueCountStats[trueCount] = {
        hands: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        blackjacks: 0,
        netWinnings: 0,
        winRate: 0,
      };
    }
  }

  private updateStats(result: GameResult): void {
    this.stats.totalHands++;
    this.stats.netWinnings += result.netWin;

    // Initialize true count stats if needed
    this.initializeTrueCountStats(this.currentHandTrueCount);
    const tcStats = this.stats.trueCountStats[this.currentHandTrueCount];
    
    // Update true count stats
    tcStats.hands++;
    tcStats.netWinnings += result.netWin;

    for (let i = 0; i < result.results.length; i++) {
      const outcome = result.results[i];
      switch (outcome) {
        case 'win':
          this.stats.wins++;
          tcStats.wins++;
          break;
        case 'loss':
          this.stats.losses++;
          tcStats.losses++;
          break;
        case 'push':
          this.stats.pushes++;
          tcStats.pushes++;
          break;
        case 'blackjack':
          this.stats.blackjacks++;
          this.stats.wins++; // Blackjack counts as a win
          tcStats.blackjacks++;
          tcStats.wins++; // Blackjack counts as a win
          break;
      }
    }

    // Update overall derived statistics
    const totalDecisions = this.stats.wins + this.stats.losses; // Exclude pushes
    this.stats.winRate = totalDecisions > 0 ? (this.stats.wins / totalDecisions) * 100 : 0;
    this.stats.houseEdge = this.stats.totalHands > 0 ? -(this.stats.netWinnings / this.stats.totalHands) * 100 : 0;
    
    // Update true count specific statistics
    const tcDecisions = tcStats.wins + tcStats.losses; // Exclude pushes
    tcStats.winRate = tcDecisions > 0 ? (tcStats.wins / tcDecisions) * 100 : 0;
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
  
  let progressUpdateCounter = 0;
  const progressUpdateInterval = Math.max(1, Math.floor(targetShoes / 100)); // Update progress every 1% or at least every shoe
  
  // Continue playing until we reach the target number of shoes
  while (game.getStats().totalShoes < targetShoes) {
    game.playHand();
    
    // Report progress periodically
    const currentStats = game.getStats();
    if (currentStats.totalShoes - progressUpdateCounter >= progressUpdateInterval) {
      const progress = Math.min((currentStats.totalShoes / targetShoes) * 100, 99);
      if (onProgress) {
        onProgress(progress, currentStats);
      }
      progressUpdateCounter = currentStats.totalShoes;
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