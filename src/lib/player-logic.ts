import { Hand, Card, BlackjackRules } from './types';
import { HandCalculator, BasicStrategy, Deck } from './blackjack-engine';

export class PlayerLogic {
  private rules: BlackjackRules;
  private stats: {
    surrenders: number;
    doubles: number;
    splits: number;
  };

  constructor(rules: BlackjackRules, stats: { surrenders: number; doubles: number; splits: number }) {
    this.rules = rules;
    this.stats = stats;
  }

  /**
   * Plays all player hands according to basic strategy
   * @param playerHand The initial player hand
   * @param dealerUpCard The dealer's up card value
   * @param deck The deck to deal cards from
   * @param canSplit Whether splitting is allowed (default: true)
   * @param splitCount Current number of splits (default: 0)
   * @returns Array of final player hands after all decisions
   */
  playPlayerHands(
    playerHand: Hand, 
    dealerUpCard: number, 
    deck: Deck,
    canSplit: boolean = true, 
    splitCount: number = 0
  ): Hand[] {
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
      if (this.shouldAttemptSurrender(currentHand, currentHandIndex, dealerUpCard)) {
        currentHand.surrendered = true;
        this.stats.surrenders++;
        currentHandIndex++;
        continue;
      }

      // Check for split
      if (this.shouldAttemptSplit(currentHand, canSplit, splitCount, dealerUpCard)) {
        const newHand = this.performSplit(currentHand, deck, hands);
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
      const action = this.getPlayerAction(currentHand, dealerUpCard, splitCount);
      
      if (action === 'double') {
        this.performDouble(currentHand, deck);
        this.stats.doubles++;
        currentHandIndex++;
      } else if (action === 'hit') {
        this.performHit(currentHand, deck);
        
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
  private shouldAttemptSurrender(hand: Hand, handIndex: number, dealerUpCard: number): boolean {
    return (
      hand.cards.length === 2 && 
      handIndex === 0 && 
      this.rules.lateSurrender &&
      BasicStrategy.shouldSurrender(hand.total, hand.soft, dealerUpCard)
    );
  }

  /**
   * Checks if split should be attempted
   */
  private shouldAttemptSplit(hand: Hand, canSplit: boolean, splitCount: number, dealerUpCard: number): boolean {
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

    return BasicStrategy.shouldSplitPair(hand.cards[0].rank, dealerUpCard);
  }

  /**
   * Performs a split operation on the current hand
   */
  private performSplit(currentHand: Hand, deck: Deck, hands: Hand[]): Hand | null {
    const secondCard = currentHand.cards.pop();
    if (!secondCard) return null;

    const newHand = this.createHand([secondCard], currentHand.bet);
    
    // Deal new cards to both hands
    currentHand.cards.push(deck.deal());
    newHand.cards.push(deck.deal());
    
    // Recalculate totals for both hands
    this.recalculateHand(currentHand);
    this.recalculateHand(newHand);
    
    hands.push(newHand);
    return newHand;
  }

  /**
   * Gets the appropriate action for the current hand
   */
  private getPlayerAction(hand: Hand, dealerUpCard: number, splitCount: number): 'hit' | 'stand' | 'double' {
    const canDouble = hand.cards.length === 2 && (!splitCount || this.rules.doubleAfterSplit);
    const action = BasicStrategy.shouldHit(hand.total, hand.soft, dealerUpCard, canDouble);

    // If we want to double but can't, hit instead
    if (action === 'double' && !canDouble) {
      return 'hit';
    }

    return action as 'hit' | 'stand' | 'double';
  }

  /**
   * Performs a double down action
   */
  private performDouble(hand: Hand, deck: Deck): void {
    hand.doubled = true;
    hand.bet *= 2;
    hand.cards.push(deck.deal());
    this.recalculateHand(hand);
  }

  /**
   * Performs a hit action
   */
  private performHit(hand: Hand, deck: Deck): void {
    hand.cards.push(deck.deal());
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