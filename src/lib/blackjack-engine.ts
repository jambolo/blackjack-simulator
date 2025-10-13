import { Card, Hand, BlackjackRules } from './types';

export class Deck {
  private cards: Card[] = [];
  private discardPile: Card[] = [];

  constructor(deckCount: number) {
    this.initialize(deckCount);
    this.shuffle();
  }

  private initialize(deckCount: number): void {
    this.cards = [];
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    for (let deck = 0; deck < deckCount; deck++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          this.cards.push({
            suit,
            rank,
            value: rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(rank) ? 10 : parseInt(rank)
          });
        }
      }
    }
  }

  shuffle(): void {
    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(): Card {
    if (this.cards.length === 0) {
      throw new Error('Cannot deal from empty deck');
    }
    const card = this.cards.pop()!;
    this.discardPile.push(card);
    return card;
  }

  needsNewShoe(penetration: number, totalDecks: number): boolean {
    const cutCardPosition = Math.floor((totalDecks * 52) - (penetration * 52));
    return this.cards.length <= cutCardPosition;
  }

  getRemainingCards(): number {
    return this.cards.length;
  }

  reset(deckCount: number): void {
    this.discardPile = [];
    this.initialize(deckCount);
    this.shuffle();
  }
}

export class HandCalculator {
  static calculateHand(cards: Card[]): { total: number; soft: boolean } {
    let total = 0;
    let aces = 0;

    for (const card of cards) {
      if (card.rank === 'A') {
        aces++;
        total += 11;
      } else {
        total += card.value;
      }
    }

    // Convert aces from 11 to 1 if total > 21
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    const soft = aces > 0; // true if at least one ace is counted as 11
    return { total, soft };
  }

  static isBlackjack(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    const hasAce = cards.some(card => card.rank === 'A');
    const hasTen = cards.some(card => card.value === 10);
    return hasAce && hasTen;
  }

  static isBusted(total: number): boolean {
    return total > 21;
  }

  static canSplit(cards: Card[]): boolean {
    return cards.length === 2 && cards[0].value === cards[1].value;
  }
}

// Legacy BasicStrategy class - now deprecated, use OptimizedBasicStrategy from strategy-loader.ts
export class BasicStrategy {
  // Keep for backward compatibility, but these will delegate to the new system
  static shouldHit(playerTotal: number, playerSoft: boolean, dealerUpCard: number, canDouble: boolean = false): 'hit' | 'stand' | 'double' | 'split' {
    // Fallback to hardcoded strategy if new system fails
    if (playerSoft) {
      return this.getSoftStrategy(playerTotal, dealerUpCard, canDouble);
    } else {
      return this.getHardStrategy(playerTotal, dealerUpCard, canDouble);
    }
  }

  private static getHardStrategy(total: number, dealerUp: number, canDouble: boolean): 'hit' | 'stand' | 'double' {
    // Hard totals basic strategy (fallback implementation)
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

  private static getSoftStrategy(total: number, dealerUp: number, canDouble: boolean): 'hit' | 'stand' | 'double' {
    // Soft totals basic strategy (fallback implementation)
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

  static shouldSplitPair(rank: string, dealerUpCard: number): boolean {
    const pairStrategy: Record<string, number[]> = {
      'A': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Always split aces
      '8': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Always split 8s
      '9': [2, 3, 4, 5, 6, 8, 9], // Split 9s except vs 7, 10, A
      '7': [2, 3, 4, 5, 6, 7], // Split 7s vs 2-7
      '6': [2, 3, 4, 5, 6], // Split 6s vs 2-6
      '3': [2, 3, 4, 5, 6, 7], // Split 3s vs 2-7
      '2': [2, 3, 4, 5, 6, 7], // Split 2s vs 2-7
      '4': [], // Never split 4s
      '5': [], // Never split 5s (treat as 10)
      '10': [], // Never split 10s
    };

    return pairStrategy[rank]?.includes(dealerUpCard) || false;
  }

  static shouldSurrender(playerTotal: number, playerSoft: boolean, dealerUpCard: number): boolean {
    if (playerSoft) return false; // Never surrender soft hands
    
    // Late surrender strategy (fallback implementation)
    if (playerTotal === 16 && (dealerUpCard === 9 || dealerUpCard === 10 || dealerUpCard === 11)) return true;
    if (playerTotal === 15 && dealerUpCard === 10) return true;
    
    return false;
  }
}