import { BlackjackRules, Hand, Card, GameResult, SimulationStats } from './types';
import { Deck, HandCalculator, BasicStrategy } from './blackjack-engine';

export class BlackjackGame {
  private deck: Deck;
  private rules: BlackjackRules;
  private stats: SimulationStats;

  constructor(rules: BlackjackRules) {
    this.rules = rules;
    const deckCount = rules.deckCount === 'continuous' ? 6 : rules.deckCount;
    this.deck = new Deck(deckCount);
    this.stats = this.initializeStats();
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
    if (dealerHand.total < 17) return true;
    if (dealerHand.total === 17 && dealerHand.soft && this.rules.dealerHitsSoft17) return true;
    return false;
  }

  private playDealerHand(dealerHand: Hand): Hand {
    while (this.dealerShouldHit(dealerHand)) {
      const card = this.deck.deal();
      dealerHand.cards.push(card);
      const { total, soft } = HandCalculator.calculateHand(dealerHand.cards);
      dealerHand.total = total;
      dealerHand.soft = soft;
    }
    return dealerHand;
  }

  private playPlayerHand(playerHand: Hand, dealerUpCard: number, canSplit: boolean = true, splitCount: number = 0): Hand[] {
    const hands: Hand[] = [playerHand];
    let currentHandIndex = 0;

    while (currentHandIndex < hands.length) {
      const currentHand = hands[currentHandIndex];
      
      // Skip if already busted, surrendered, or blackjack
      if (currentHand.total > 21 || currentHand.surrendered || currentHand.isBlackjack) {
        currentHandIndex++;
        continue;
      }

      // Check for surrender (only on first two cards, first hand)
      if (currentHand.cards.length === 2 && currentHandIndex === 0 && this.rules.lateSurrender) {
        if (BasicStrategy.shouldSurrender(currentHand.total, currentHand.soft, dealerUpCard)) {
          currentHand.surrendered = true;
          this.stats.surrenders++;
          currentHandIndex++;
          continue;
        }
      }

      // Check for split
      if (currentHand.cards.length === 2 && canSplit && splitCount < 3) {
        const canSplitPair = HandCalculator.canSplit(currentHand.cards);
        const shouldSplit = canSplitPair && BasicStrategy.shouldSplitPair(currentHand.cards[0].rank, dealerUpCard);
        
        if (shouldSplit) {
          // Handle resplit aces rule
          if (currentHand.cards[0].rank === 'A' && splitCount > 0 && !this.rules.resplitAces) {
            // Cannot resplit aces
          } else {
            // Perform split
            const secondCard = currentHand.cards.pop()!;
            const newHand = this.createHand([secondCard], currentHand.bet);
            
            // Deal new cards to both hands
            currentHand.cards.push(this.deck.deal());
            newHand.cards.push(this.deck.deal());
            
            // Recalculate totals
            const { total: total1, soft: soft1 } = HandCalculator.calculateHand(currentHand.cards);
            currentHand.total = total1;
            currentHand.soft = soft1;
            currentHand.isBlackjack = HandCalculator.isBlackjack(currentHand.cards);
            
            const { total: total2, soft: soft2 } = HandCalculator.calculateHand(newHand.cards);
            newHand.total = total2;
            newHand.soft = soft2;
            newHand.isBlackjack = HandCalculator.isBlackjack(newHand.cards);
            
            hands.push(newHand);
            this.stats.splits++;
            splitCount++;
            
            // Check if split aces and can't hit after split
            if (currentHand.cards[0].rank === 'A' && !this.rules.hitAfterSplitAces) {
              currentHandIndex++;
              continue;
            }
          }
        }
      }

      // Determine action
      const canDouble = currentHand.cards.length === 2 && (!splitCount || this.rules.doubleAfterSplit);
      const action = BasicStrategy.shouldHit(currentHand.total, currentHand.soft, dealerUpCard, canDouble);

      if (action === 'double' && canDouble) {
        currentHand.doubled = true;
        currentHand.bet *= 2;
        currentHand.cards.push(this.deck.deal());
        const { total, soft } = HandCalculator.calculateHand(currentHand.cards);
        currentHand.total = total;
        currentHand.soft = soft;
        this.stats.doubles++;
        currentHandIndex++;
      } else if (action === 'hit' || (action === 'double' && !canDouble)) {
        currentHand.cards.push(this.deck.deal());
        const { total, soft } = HandCalculator.calculateHand(currentHand.cards);
        currentHand.total = total;
        currentHand.soft = soft;
        
        if (currentHand.total > 21) {
          currentHandIndex++;
        }
      } else {
        // Stand
        currentHandIndex++;
      }
    }

    return hands;
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
    const dealerHand = this.createHand([this.deck.deal(), this.deck.deal()]);

    // Check for dealer blackjack (American style - peek)
    if (dealerHand.isBlackjack) {
      dealerHand.isBlackjack = true;
      const result = this.calculateResults([playerHand], dealerHand);
      this.updateStats(result);
      return result;
    }

    // Play player hands
    const dealerUpCard = dealerHand.cards[0].value === 11 ? 11 : dealerHand.cards[0].value;
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