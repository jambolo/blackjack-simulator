import { Card } from './types';

export class HiLoCounter {
  private runningCount: number = 0;
  private cardsDealt: number = 0;
  private totalDecks: number;

  constructor(totalDecks: number) {
    this.totalDecks = totalDecks;
  }

  /**
   * Get Hi-Lo value for a card
   * Low cards (2-6): +1
   * Neutral cards (7-9): 0
   * High cards (10, J, Q, K, A): -1
   */
  private getHiLoValue(card: Card): number {
    const rank = card.rank;
    
    if (['2', '3', '4', '5', '6'].includes(rank)) {
      return 1;
    } else if (['7', '8', '9'].includes(rank)) {
      return 0;
    } else {
      // 10, J, Q, K, A
      return -1;
    }
  }

  /**
   * Process a card and update the running count
   */
  countCard(card: Card): void {
    this.runningCount += this.getHiLoValue(card);
    this.cardsDealt++;
  }

  /**
   * Process multiple cards
   */
  countCards(cards: Card[]): void {
    for (const card of cards) {
      this.countCard(card);
    }
  }

  /**
   * Get the current running count
   */
  getRunningCount(): number {
    return this.runningCount;
  }

  /**
   * Get the estimated number of decks remaining
   */
  getDecksRemaining(): number {
    const cardsRemaining = (this.totalDecks * 52) - this.cardsDealt;
    return Math.max(0.5, cardsRemaining / 52); // Minimum 0.5 decks
  }

  /**
   * Get the true count (running count / decks remaining)
   */
  getTrueCount(): number {
    const decksRemaining = this.getDecksRemaining();
    return this.runningCount / decksRemaining;
  }

  /**
   * Get the true count rounded to the nearest integer
   */
  getTrueCountInteger(): number {
    return Math.round(this.getTrueCount());
  }

  /**
   * Reset the counter for a new shoe
   */
  reset(totalDecks: number): void {
    this.runningCount = 0;
    this.cardsDealt = 0;
    this.totalDecks = totalDecks;
  }

  /**
   * Get current counter state for debugging
   */
  getState(): {
    runningCount: number;
    cardsDealt: number;
    decksRemaining: number;
    trueCount: number;
    trueCountInteger: number;
  } {
    return {
      runningCount: this.runningCount,
      cardsDealt: this.cardsDealt,
      decksRemaining: this.getDecksRemaining(),
      trueCount: this.getTrueCount(),
      trueCountInteger: this.getTrueCountInteger()
    };
  }
}