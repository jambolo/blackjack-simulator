import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SimulationStats } from "@/lib/types";

interface SimulationProgressProps {
  progress: number;
  isRunning: boolean;
  currentStats?: SimulationStats;
}

export function SimulationProgress({ progress, isRunning, currentStats }: SimulationProgressProps) {
  if (!isRunning && !currentStats) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const formatCurrency = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)} units`;
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          {isRunning ? 'Simulation Running...' : 'Simulation Complete'}
        </h3>
        <span className="text-sm text-muted-foreground">
          {formatPercent(progress)}
        </span>
      </div>

      <Progress value={progress} className="w-full" />

      {currentStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatNumber(currentStats.totalHands)}
            </div>
            <div className="text-sm text-muted-foreground">Total Hands</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatNumber(currentStats.totalShoes)}
            </div>
            <div className="text-sm text-muted-foreground">Shoes Played</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${currentStats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(currentStats.winRate)}
            </div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${currentStats.netWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentStats.netWinnings)}
            </div>
            <div className="text-sm text-muted-foreground">Net Winnings</div>
          </div>
        </div>
      )}

      {isRunning && (
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <div>Running optimal basic strategy simulation...</div>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span>⚡ Multi-threaded processing</span>
            <span>•</span>
            <span>{navigator.hardwareConcurrency || 4} CPU cores</span>
          </div>
        </div>
      )}
    </Card>
  );
}