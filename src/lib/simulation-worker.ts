import { BlackjackRules, SimulationStats, TrueCountStats } from './types';

// Import all required dependencies for the worker
import { BlackjackGame } from './simulator';

export interface WorkerMessage {
  type: 'start' | 'progress' | 'complete' | 'error';
  workerId: number;
  data?: any;
}

export interface SimulationTask {
  rules: BlackjackRules;
  targetShoes: number;
  workerId: number;
}

export interface PartialStats {
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
  trueCountFrequency: Record<number, number>;
  trueCountStats: Record<number, TrueCountStats>;
}

// Worker script - this will be executed in a Web Worker context
self.onmessage = async function(e: MessageEvent<SimulationTask>) {
  const { rules, targetShoes, workerId } = e.data;
  
  try {
    // Send start message
    const startMessage: WorkerMessage = {
      type: 'start',
      workerId,
      data: { targetShoes }
    };
    self.postMessage(startMessage);

    const game = new BlackjackGame(rules);
    game.initialize();
    
    let lastProgressUpdate = 0;
    const progressUpdateInterval = Math.max(1, Math.floor(targetShoes / 100)); // Update every 1% or at least every shoe
    
    for (let shoe = 0; shoe < targetShoes; shoe++) {
      // Play hands until shoe needs to be replaced
      const startingShoes = game.getStats().totalShoes;
      while (true) {
        game.playHand();
        
        // Check if we need a new shoe
        const stats = game.getStats();
        if (rules.deckCount === 'continuous' || stats.totalShoes > startingShoes) {
          break;
        }
      }
      
      // Report progress periodically
      if (shoe - lastProgressUpdate >= progressUpdateInterval) {
        const progress = (shoe / targetShoes) * 100;
        const stats = game.getStats();
        
        const progressMessage: WorkerMessage = {
          type: 'progress',
          workerId,
          data: {
            progress,
            partialStats: extractPartialStats(stats)
          }
        };
        self.postMessage(progressMessage);
        lastProgressUpdate = shoe;
      }
    }
    
    const finalStats = game.getStats();
    
    // Calculate standard deviation (simplified)
    const variance = Math.abs(finalStats.netWinnings) / Math.sqrt(finalStats.totalHands);
    finalStats.standardDeviation = variance;
    
    const completeMessage: WorkerMessage = {
      type: 'complete',
      workerId,
      data: {
        partialStats: extractPartialStats(finalStats)
      }
    };
    self.postMessage(completeMessage);
    
  } catch (error) {
    const errorMessage: WorkerMessage = {
      type: 'error',
      workerId,
      data: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
    self.postMessage(errorMessage);
  }
};

function extractPartialStats(stats: SimulationStats): PartialStats {
  return {
    totalHands: stats.totalHands,
    totalShoes: stats.totalShoes,
    wins: stats.wins,
    losses: stats.losses,
    pushes: stats.pushes,
    blackjacks: stats.blackjacks,
    surrenders: stats.surrenders,
    doubles: stats.doubles,
    splits: stats.splits,
    netWinnings: stats.netWinnings,
    trueCountFrequency: stats.trueCountFrequency,
    trueCountStats: stats.trueCountStats,
  };
}