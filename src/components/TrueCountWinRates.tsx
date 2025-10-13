import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrueCountStats } from "@/lib/types";

interface TrueCountWinRatesProps {
  trueCountStats: Record<number, TrueCountStats>;
}

export function TrueCountWinRates({ trueCountStats }: TrueCountWinRatesProps) {
  // Ensure we have valid data
  const safeStats = trueCountStats || {};
  
  // Convert the stats data to chart format
  const chartData = Object.entries(safeStats)
    .map(([count, stats]) => ({
      trueCount: parseInt(count),
      winRate: stats.winRate,
      hands: stats.hands,
      netWinnings: stats.netWinnings,
      avgWinPerHand: stats.hands > 0 ? stats.netWinnings / stats.hands : 0,
    }))
    .filter(item => item.hands >= 10) // Only show counts with significant sample sizes
    .sort((a, b) => a.trueCount - b.trueCount);

  // Custom tooltip for win rates
  const WinRateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium mb-2">{`True Count: ${label}`}</p>
          <p className="text-sm text-primary">{`Win Rate: ${data.winRate.toFixed(2)}%`}</p>
          <p className="text-sm text-muted-foreground">{`Hands: ${data.hands.toLocaleString()}`}</p>
          <p className="text-sm text-accent">{`Avg Win/Hand: ${data.avgWinPerHand.toFixed(4)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate some summary statistics
  const totalHands = chartData.reduce((sum, item) => sum + item.hands, 0);
  const bestCount = chartData.length > 0 ? chartData.reduce((best, item) => 
    item.winRate > best.winRate ? item : best
  ) : { trueCount: 0, winRate: 0, hands: 0 };
  const worstCount = chartData.length > 0 ? chartData.reduce((worst, item) => 
    item.winRate < worst.winRate ? item : worst
  ) : { trueCount: 0, winRate: 0, hands: 0 };

  // Find the range for better display
  const trueCountValues = chartData.map(d => d.trueCount);
  const minCount = trueCountValues.length > 0 ? Math.min(...trueCountValues) : 0;
  const maxCount = trueCountValues.length > 0 ? Math.max(...trueCountValues) : 0;
  
  // Calculate win rate range for Y-axis
  const winRateValues = chartData.map(d => d.winRate);
  const minWinRate = winRateValues.length > 0 ? Math.min(...winRateValues) : 45;
  const maxWinRate = winRateValues.length > 0 ? Math.max(...winRateValues) : 55;
  const winRateRange = maxWinRate - minWinRate;
  const padding = Math.max(1, winRateRange * 0.1); // 10% padding, minimum 1%
  const yAxisMin = Math.max(0, minWinRate - padding);
  const yAxisMax = Math.min(100, maxWinRate + padding);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Win/Loss Rates by True Count</h3>
        <div className="text-sm text-muted-foreground mb-4">
          <p>Win rates for each true count value (minimum 10 hands required)</p>
        </div>
        
        {totalHands > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Best Count</div>
              <div className="text-lg font-semibold text-primary">
                {bestCount.trueCount} ({bestCount.winRate.toFixed(1)}%)
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Worst Count</div>
              <div className="text-lg font-semibold text-destructive">
                {worstCount.trueCount} ({worstCount.winRate.toFixed(1)}%)
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Count Range</div>
              <div className="text-lg font-semibold">
                {chartData.length > 0 ? `${minCount} to ${maxCount}` : 'No data'}
              </div>
            </div>
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <div className="space-y-6">
          {/* Win Rate Chart */}
          <div>
            <h4 className="text-md font-medium mb-2">Win Rate by True Count</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="trueCount" 
                    type="number"
                    scale="linear"
                    domain={[minCount - 1, maxCount + 1]}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
                    domain={[yAxisMin, yAxisMax]}
                    tickFormatter={(value) => `${Math.round(value)}%`}
                  />
                  <Tooltip content={<WinRateTooltip />} />
                  {/* Reference line at 50% */}
                  <Line 
                    type="monotone" 
                    dataKey={() => 50} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">Run a simulation to see win/loss rates by true count</div>
          </div>
        </div>
      )}
    </Card>
  );
}