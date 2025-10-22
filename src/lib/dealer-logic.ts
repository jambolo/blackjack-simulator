import { Hand, Card, BlackjackRules } from './types';
import { HandCalculator, Deck } from './blackjack-engine';
import { HiLoCounter } from './card-counter';

export class DealerLogic {
  private rules: BlackjackRules;

  constructor(rules: BlackjackRules) {
    this.rules = rules;
  }

  /**
   * Plays the dealer hand according to house rules
   * @param dealerHand The dealer's initial hand
   * @param deck The deck to deal cards from
   * @param cardCounter The card counter to track dealt cards
   * @returns The completed dealer hand
   */
  playDealerHand(dealerHand: Hand, deck: Deck, cardCounter: HiLoCounter): Hand {
    // Continue hitting while dealer should hit
    while (this.shouldDealerHit(dealerHand)) {
      if (!deck.hasEnoughCards(1)) {
        throw new Error('Not enough cards for dealer to complete hand');
      }
      const card = deck.deal();
      cardCounter.countCard(card);
      dealerHand.cards.push(card);
      this.recalculateHand(dealerHand);
    }
    
    return dealerHand;
  }

  /**
   * Determines if the dealer should hit based on house rules
   * @param dealerHand The dealer's current hand
   * @returns true if dealer should hit, false if dealer should stand
   */
  shouldDealerHit(dealerHand: Hand): boolean {
    // Dealer must hit on totals less than 17
    if (dealerHand.total < 17) {
      return true;
    }
    
    // Dealer action on soft 17 depends on house rules
    if (dealerHand.total === 17 && dealerHand.soft && this.rules.dealerHitsSoft17) {
      return true;
    }
    
    // Dealer stands on all other totals (hard 17+, soft 17 when dealer stands)
    return false;
  }

  /**
   * Checks if dealer has blackjack (for American-style peek)
   * @param dealerHand The dealer's initial 2-card hand
   * @returns true if dealer has blackjack
   */
  hasBlackjack(dealerHand: Hand): boolean {
    return dealerHand.cards.length === 2 && dealerHand.isBlackjack;
  }

  /**
   * Gets the dealer's up card value for player decision making
   * @param dealerHand The dealer's hand
   * @returns The value of the dealer's first (up) card
   */
  getUpCardValue(dealerHand: Hand): number {
    if (dealerHand.cards.length === 0) {
      throw new Error('Dealer hand is empty');
    }
    
    const upCard = dealerHand.cards[0];
    return upCard.value === 11 ? 11 : upCard.value; // Ace as 11, others face value
  }

  /**
   * Creates a new dealer hand with the given cards
   * @param cards The cards to create the hand with
   * @returns A new Hand object
   */
  createHand(cards: Card[] = []): Hand {
    const { total, soft } = HandCalculator.calculateHand(cards);
    return {
      cards,
      total,
      soft,
      isBlackjack: HandCalculator.isBlackjack(cards),
      doubled: false,
      surrendered: false,
      bet: 0, // Dealer doesn't bet
    };
  }

  /**
   * Recalculates hand totals and properties after adding cards
   * @param hand The hand to recalculate
   */
  private recalculateHand(hand: Hand): void {
    const { total, soft } = HandCalculator.calculateHand(hand.cards);
    hand.total = total;
    hand.soft = soft;
    // Dealer can't have blackjack after hitting (more than 2 cards)
    hand.isBlackjack = hand.cards.length === 2 && HandCalculator.isBlackjack(hand.cards);
  }

  /**
   * Checks if dealer is busted
   * @param dealerHand The dealer's hand
   * @returns true if dealer total exceeds 21
   */
  isBusted(dealerHand: Hand): boolean {
    return dealerHand.total > 21;
  }

  /**
   * Gets the dealer's final result for comparison with player hands
   * @param dealerHand The completed dealer hand
   * @returns Object containing dealer's final total and whether they busted
   */
  getFinalResult(dealerHand: Hand): { total: number; busted: boolean; blackjack: boolean } {
    return {
      total: dealerHand.total,
      busted: this.isBusted(dealerHand),
      blackjack: dealerHand.isBlackjack
    };
  }
}