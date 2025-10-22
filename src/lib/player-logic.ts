import { Hand, Card, BlackjackRules } from './types';
import { HandCalculator, Deck } from './blackjack-engine';
import { OptimizedBasicStrategy, StrategyManager } from './strategy-loader';
import { HiLoCounter } from './card-counter';

export class PlayerLogic {
  private rules: BlackjackRules;
  private stats: {
    surrenders: number;
    doubles: number;
    splits: number;
  };
  private strategy: OptimizedBasicStrategy | null = null;

  constructor(rules: BlackjackRules, stats: { surrenders: number; doubles: number; splits: number }) {
    this.rules = rules;
    this.stats = stats;
    this.initializeStrategy();
  }

  /**
   * Initialize the strategy for this ruleset (public method)
   */
  initialize(): void {
    this.initializeStrategy();
  }

  /**
   * Initialize the strategy for this ruleset
   */
  private initializeStrategy(): void {
    try {
      this.strategy = StrategyManager.getStrategy(this.rules);
    } catch (error) {
      this.strategy = null;
    }
  }

  /**
   * Ensure strategy is loaded before use
   */
  private ensureStrategy(): OptimizedBasicStrategy | null {
    if (!this.strategy) {
      this.initializeStrategy();
    }
    return this.strategy;
  }

  /**
   * Plays all player hands according to basic strategy
   * @param playerHand The initial player hand
   * @param dealerUpCard The dealer's up card value
   * @param deck The deck to deal cards from
   * @param cardCounter The card counter to track dealt cards
   * @param canSplit Whether splitting is allowed (default: true)
   * @param splitCount Current number of splits (default: 0)
   * @returns Array of final player hands after all decisions
   */
  playPlayerHands(
    playerHand: Hand, 
    dealerUpCard: number, 
    deck: Deck,
    cardCounter: HiLoCounter,
    canSplit: boolean = true, 
    splitCount: number = 0
  ): Hand[] {
    const strategy = this.ensureStrategy();
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
      if (this.shouldAttemptSurrender(currentHand, currentHandIndex, dealerUpCard, strategy)) {
        currentHand.surrendered = true;
        this.stats.surrenders++;
        currentHandIndex++;
        continue;
      }

      // Check for split
      if (this.shouldAttemptSplit(currentHand, canSplit, splitCount, dealerUpCard, strategy)) {
        const newHand = this.performSplit(currentHand, deck, cardCounter, hands);
        if (newHand) {
          splitCount++;
          this.stats.splits++;
          
          // Check if split aces and can't hit after split
          if (currentHand.cards[0].rank === 'A' && !this.rules.hitAfterSplitAces) {
            currentHandIndex++;
            continue;
          }
        }
      }

      // Determine action for current hand
      const action = this.getPlayerAction(currentHand, dealerUpCard, splitCount, strategy);
      
      if (action === 'double') {
        this.performDouble(currentHand, deck, cardCounter);
        this.stats.doubles++;
        currentHandIndex++;
      } else if (action === 'hit') {
        this.performHit(currentHand, deck, cardCounter);
        
        // Move to next hand if busted
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

  /**
   * Checks if surrender should be attempted
   */
  private shouldAttemptSurrender(
    hand: Hand, 
    handIndex: number, 
    dealerUpCard: number, 
    strategy: OptimizedBasicStrategy | null
  ): boolean {
    if (hand.cards.length !== 2 || handIndex !== 0 || !this.rules.lateSurrender) {
      return false;
    }

    if (strategy) {
      return strategy.shouldSurrender(hand.total, hand.soft, dealerUpCard);
    } else {
      // Fallback to basic surrender logic
      if (hand.soft) return false;
      if (hand.total === 16 && (dealerUpCard === 9 || dealerUpCard === 10 || dealerUpCard === 11)) return true;
      if (hand.total === 15 && dealerUpCard === 10) return true;
      return false;
    }
  }

  /**
   * Checks if split should be attempted
   */
  private shouldAttemptSplit(
    hand: Hand, 
    canSplit: boolean, 
    splitCount: number, 
    dealerUpCard: number, 
    strategy: OptimizedBasicStrategy | null
  ): boolean {
    if (hand.cards.length !== 2 || !canSplit || splitCount >= 3) {
      return false;
    }

    const canSplitPair = HandCalculator.canSplit(hand.cards);
    if (!canSplitPair) {
      return false;
    }

    // Handle resplit aces rule
    if (hand.cards[0].rank === 'A' && splitCount > 0 && !this.rules.resplitAces) {
      return false;
    }

    if (strategy) {
      return strategy.shouldSplitPair(hand.cards[0].rank, dealerUpCard);
    } else {
      // Fallback to basic split logic
      const pairStrategy: Record<string, number[]> = {
        'A': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        '8': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        '9': [2, 3, 4, 5, 6, 8, 9],
        '7': [2, 3, 4, 5, 6, 7],
        '6': [2, 3, 4, 5, 6],
        '3': [2, 3, 4, 5, 6, 7],
        '2': [2, 3, 4, 5, 6, 7],
        '4': [],
        '5': [],
        '10': [],
      };
      return pairStrategy[hand.cards[0].rank]?.includes(dealerUpCard) || false;
    }
  }

  /**
   * Performs a split operation on the current hand
   */
  private performSplit(currentHand: Hand, deck: Deck, cardCounter: HiLoCounter, hands: Hand[]): Hand | null {
    const secondCard = currentHand.cards.pop();
    if (!secondCard) return null;

    const newHand = this.createHand([secondCard], currentHand.bet);
    
    if (!deck.hasEnoughCards(2)) {
      throw new Error('Not enough cards to complete split operation');
    }
    
    // Deal new cards to both hands
    const card1 = deck.deal();
    const card2 = deck.deal();
    cardCounter.countCards([card1, card2]);
    
    currentHand.cards.push(card1);
    newHand.cards.push(card2);
    
    // Recalculate totals for both hands
    this.recalculateHand(currentHand);
    this.recalculateHand(newHand);
    
    hands.push(newHand);
    return newHand;
  }

  /**
   * Gets the appropriate action for the current hand
   */
  private getPlayerAction(
    hand: Hand, 
    dealerUpCard: number, 
    splitCount: number, 
    strategy: OptimizedBasicStrategy | null
  ): 'hit' | 'stand' | 'double' {
    const canDouble = hand.cards.length === 2 && (!splitCount || this.rules.doubleAfterSplit);
    
    if (strategy) {
      const action = strategy.shouldHit(hand.total, hand.soft, dealerUpCard, canDouble);
      return action as 'hit' | 'stand' | 'double';
    } else {
      // Fallback to basic strategy logic
      if (hand.soft) {
        return this.getSoftStrategyFallback(hand.total, dealerUpCard, canDouble);
      } else {
        return this.getHardStrategyFallback(hand.total, dealerUpCard, canDouble);
      }
    }
  }

  /**
   * Fallback hard strategy for when optimized strategy fails to load
   */
  private getHardStrategyFallback(total: number, dealerUp: number, canDouble: boolean): 'hit' | 'stand' | 'double' {
    if (total >= 17) return 'stand';
    if (total <= 8) return 'hit';
    
    if (total === 9) {
      if (canDouble && dealerUp >= 3 && dealerUp <= 6) return 'double';
      return 'hit';
    }
    
    if (total === 10) {
      if (canDouble && dealerUp <= 9) return 'double';
      return 'hit';
    }
    
    if (total === 11) {
      if (canDouble) return 'double';
      return 'hit';
    }
    
    if (total === 12) {
      if (dealerUp >= 4 && dealerUp <= 6) return 'stand';
      return 'hit';
    }
    
    if (total >= 13 && total <= 16) {
      if (dealerUp <= 6) return 'stand';
      return 'hit';
    }
    
    return 'hit';
  }

  /**
   * Fallback soft strategy for when optimized strategy fails to load
   */
  private getSoftStrategyFallback(total: number, dealerUp: number, canDouble: boolean): 'hit' | 'stand' | 'double' {
    if (total >= 19) return 'stand';
    if (total <= 13) return 'hit';
    
    if (total === 18) {
      if (dealerUp <= 6) {
        if (canDouble && dealerUp >= 3) return 'double';
        return 'stand';
      }
      if (dealerUp === 7 || dealerUp === 8) return 'stand';
      return 'hit';
    }
    
    if (total === 17) {
      if (canDouble && dealerUp >= 3 && dealerUp <= 6) return 'double';
      return 'hit';
    }
    
    if (total >= 15 && total <= 16) {
      if (canDouble && dealerUp >= 4 && dealerUp <= 6) return 'double';
      return 'hit';
    }
    
    if (total >= 13 && total <= 14) {
      if (canDouble && dealerUp >= 5 && dealerUp <= 6) return 'double';
      return 'hit';
    }
    
    return 'hit';
  }

  /**
   * Performs a double down action
   */
  private performDouble(hand: Hand, deck: Deck, cardCounter: HiLoCounter): void {
    hand.doubled = true;
    hand.bet *= 2;
    if (!deck.hasEnoughCards(1)) {
      throw new Error('Not enough cards to complete double operation');
    }
    const card = deck.deal();
    cardCounter.countCard(card);
    hand.cards.push(card);
    this.recalculateHand(hand);
  }

  /**
   * Performs a hit action
   */
  private performHit(hand: Hand, deck: Deck, cardCounter: HiLoCounter): void {
    if (!deck.hasEnoughCards(1)) {
      throw new Error('Not enough cards to complete hit operation');
    }
    const card = deck.deal();
    cardCounter.countCard(card);
    hand.cards.push(card);
    this.recalculateHand(hand);
  }

  /**
   * Creates a new hand with the given cards and bet
   */
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

  /**
   * Recalculates hand totals and properties after adding cards
   */
  private recalculateHand(hand: Hand): void {
    const { total, soft } = HandCalculator.calculateHand(hand.cards);
    hand.total = total;
    hand.soft = soft;
    hand.isBlackjack = HandCalculator.isBlackjack(hand.cards);
  }
}