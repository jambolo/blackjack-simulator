import { BlackjackRules, SimulationStats, TrueCountStats } from './types';
import { WorkerMessage, SimulationTask, PartialStats } from './simulation-worker';

function calculateBetSize(trueCount: number): number {
  if (trueCount <= -3) {
    return 0;
  } else if (-2 <= trueCount && trueCount <= 0) {
    return 0.5;
  } else if (1 <= trueCount && trueCount <= 4) {
    return trueCount;
  } else {
    return 8;
  }
}

export class MultiThreadedSimulator {
  private workers: Worker[] = [];
  private activeWorkers = 0;
  private completedWorkers = 0;
  private combinedStats: PartialStats | null = null;
  private onProgressCallback?: (progress: number, stats: SimulationStats) => void;
  private abortController?: AbortController;
  private workerProgress: number[] = [];

  constructor(private workerCount: number = Math.min(navigator.hardwareConcurrency || 4, 8)) {
    // Limit to reasonable number of workers and ensure minimum of 1
    this.workerCount = Math.max(1, this.workerCount);
  }

  async runSimulation(
    rules: BlackjackRules,
    targetShoes: number,
    onProgress?: (progress: number, stats: SimulationStats) => void,
    abortSignal?: AbortSignal
  ): Promise<SimulationStats> {
    this.onProgressCallback = onProgress;
    this.abortController = new AbortController();
    
    // Set up abort handling
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        this.abort();
      });
    }

    return new Promise((resolve, reject) => {
      this.completedWorkers = 0;
      this.activeWorkers = 0;
      this.combinedStats = null;
      
      const effectiveWorkerCount = Math.min(this.workerCount, targetShoes);
      this.workerProgress = new Array(effectiveWorkerCount).fill(0);

      // Calculate shoes per worker, ensuring minimum of 1 shoe per worker
      // If targetShoes < workerCount, reduce worker count to match
      const shoesPerWorker = Math.floor(targetShoes / effectiveWorkerCount);
      const remainderShoes = targetShoes % effectiveWorkerCount;

      // Create workers
      for (let i = 0; i < effectiveWorkerCount; i++) {
        const worker = new Worker(
          new URL('./simulation-worker.ts', import.meta.url),
          { type: 'module' }
        );

        this.workers.push(worker);

        worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
          if (this.abortController?.signal.aborted) {
            return;
          }

          const { type, workerId, data } = e.data;

          switch (type) {
            case 'start':
              this.activeWorkers++;
              break;

            case 'progress':
              this.handleProgress(data.progress, data.partialStats, workerId);
              break;

            case 'complete':
              this.handleWorkerComplete(data.partialStats, workerId);
              if (this.completedWorkers === effectiveWorkerCount) {
                this.cleanup();
                resolve(this.finalizeStats());
              }
              break;

            case 'error':
              this.cleanup();
              reject(new Error(`Worker ${workerId} error: ${data.error}`));
              break;
          }
        };

        worker.onerror = (error) => {
          this.cleanup();
          reject(new Error(`Worker ${i} error: ${error.message}`));
        };

        const workerShoes = shoesPerWorker + (i < remainderShoes ? 1 : 0);
        
        const task: SimulationTask = {
          rules,
          targetShoes: workerShoes,
          workerId: i
        };

        worker.postMessage(task);
      }
    });
  }

  private handleProgress(progress: number, partialStats: PartialStats, workerId: number): void {
    // Update progress for this specific worker
    this.workerProgress[workerId] = progress;

    // Calculate overall progress (average of all workers)
    const averageProgress = this.workerProgress.reduce((sum, p) => sum + p, 0) / this.workerProgress.length;

    // Only update progress percentage, do NOT pass stats to avoid accumulation bugs
    // Stats are only combined when workers complete via handleWorkerComplete
    if (this.onProgressCallback) {
      const emptyStats: SimulationStats = {
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
      this.onProgressCallback(Math.min(averageProgress, 99), emptyStats);
    }
  }

  private handleWorkerComplete(partialStats: PartialStats, workerId: number): void {
    this.combineStats(partialStats, workerId);
    this.completedWorkers++;
    this.activeWorkers--;
  }

  private combineStats(newStats: PartialStats, workerId: number): void {
    if (!this.combinedStats) {
      this.combinedStats = {
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
        trueCountFrequency: {},
        trueCountStats: {},
      };
    }

    // Combine basic stats
    this.combinedStats.totalHands += newStats.totalHands;
    this.combinedStats.totalShoes += newStats.totalShoes;
    this.combinedStats.wins += newStats.wins;
    this.combinedStats.losses += newStats.losses;
    this.combinedStats.pushes += newStats.pushes;
    this.combinedStats.blackjacks += newStats.blackjacks;
    this.combinedStats.surrenders += newStats.surrenders;
    this.combinedStats.doubles += newStats.doubles;
    this.combinedStats.splits += newStats.splits;
    this.combinedStats.netWinnings += newStats.netWinnings;

    // Combine true count frequency
    for (const [count, frequency] of Object.entries(newStats.trueCountFrequency)) {
      const countNum = parseInt(count);
      this.combinedStats.trueCountFrequency[countNum] = 
        (this.combinedStats.trueCountFrequency[countNum] || 0) + frequency;
    }

    // Combine true count stats
    for (const [count, stats] of Object.entries(newStats.trueCountStats)) {
      const countNum = parseInt(count);
      if (!this.combinedStats.trueCountStats[countNum]) {
        this.combinedStats.trueCountStats[countNum] = {
          hands: 0,
          wins: 0,
          losses: 0,
          pushes: 0,
          blackjacks: 0,
          netWinnings: 0,
          winRate: 0,
          betAmount: calculateBetSize(countNum),
          totalReturns: 0,
        };
      }

      const combined = this.combinedStats.trueCountStats[countNum];
      combined.hands += stats.hands;
      combined.wins += stats.wins;
      combined.losses += stats.losses;
      combined.pushes += stats.pushes;
      combined.blackjacks += stats.blackjacks;
      combined.netWinnings += stats.netWinnings;
      combined.totalReturns += stats.totalReturns;

      // Recalculate win rate
      const totalDecisions = combined.wins + combined.losses;
      combined.winRate = totalDecisions > 0 ? (combined.wins / totalDecisions) * 100 : 0;
    }
  }

  private convertToSimulationStats(partialStats: PartialStats): SimulationStats {
    const totalDecisions = partialStats.wins + partialStats.losses;
    const winRate = totalDecisions > 0 ? (partialStats.wins / totalDecisions) * 100 : 0;
    const houseEdge = partialStats.totalHands > 0 ? 
      -(partialStats.netWinnings / partialStats.totalHands) * 100 : 0;

    // Calculate standard deviation (simplified)
    const standardDeviation = partialStats.totalHands > 0 ? 
      Math.abs(partialStats.netWinnings) / Math.sqrt(partialStats.totalHands) : 0;

    return {
      ...partialStats,
      winRate,
      houseEdge,
      standardDeviation,
    };
  }

  private finalizeStats(): SimulationStats {
    if (!this.combinedStats) {
      throw new Error('No stats to finalize');
    }

    return this.convertToSimulationStats(this.combinedStats);
  }

  private cleanup(): void {
    this.workers.forEach(worker => {
      worker.terminate();
    });
    this.workers = [];
  }

  abort(): void {
    this.abortController?.abort();
    this.cleanup();
  }
}

// Fallback to single-threaded simulation for compatibility
export async function runSimulationMultiThreaded(
  rules: BlackjackRules,
  targetShoes: number = 1000,
  onProgress?: (progress: number, stats: SimulationStats) => void,
  abortSignal?: AbortSignal
): Promise<SimulationStats> {
  // Check if Web Workers are supported
  if (typeof Worker === 'undefined') {
    // Fallback to original single-threaded simulation
    const { runSimulation } = await import('./simulator');
    return runSimulation(rules, targetShoes, onProgress);
  }

  const simulator = new MultiThreadedSimulator();
  try {
    return await simulator.runSimulation(rules, targetShoes, onProgress, abortSignal);
  } catch (error) {
    const { runSimulation } = await import('./simulator');
    return runSimulation(rules, targetShoes, onProgress);
  }
}