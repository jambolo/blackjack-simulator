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