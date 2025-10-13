import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrueCountStats } from "@/lib/types";

interface TrueCountWinRatesProps {
  trueCountStats: Record<number, TrueCountStats>;
}

export function TrueCountWinRates({ trueCountStats }: TrueCountWinRatesProps) {
  // Ensure we have valid data
  const safeStats = trueCountStats || {};
  
  // Fixed Y-axis range
  const yAxisMin = 45;
  const yAxisMax = 55;
  
  // Convert the stats data to chart format
  const chartData = Object.entries(safeStats)
    .map(([count, stats]) => ({
      trueCount: parseInt(count),
      winRate: stats.winRate,
      winRateDisplay: Math.max(yAxisMin, Math.min(yAxisMax, stats.winRate)), // Clamp for display
      hands: stats.hands,
      netWinnings: stats.netWinnings,
      avgWinPerHand: stats.hands > 0 ? stats.netWinnings / stats.hands : 0,
      isOutOfRange: stats.winRate < yAxisMin || stats.winRate > yAxisMax,
    }))
    .filter(item => item.hands >= 10) // Only show counts with significant sample sizes
    .sort((a, b) => a.trueCount - b.trueCount);

  // Custom tooltip for win rates
  const WinRateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOutOfRange = data.isOutOfRange;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium mb-2">{`True Count: ${label}`}</p>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-primary">{`Win Rate: ${data.winRate.toFixed(2)}%`}</p>
            {isOutOfRange && (
              <span className="text-xs bg-accent/20 text-accent px-1 rounded">
                Out of range
              </span>
            )}
          </div>
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
  
  // Identify values outside the fixed range
  const outOfRangeValues = chartData.filter(d => d.winRate < yAxisMin || d.winRate > yAxisMax);
  const hasOutOfRangeValues = outOfRangeValues.length > 0;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Win/Loss Rates by True Count</h3>
        <div className="text-sm text-muted-foreground mb-4">
          <p>Win rates for each true count value (minimum 10 hands required)</p>
          <p className="text-xs">Y-axis fixed to 45%-55% range for better comparison</p>
        </div>
        
        {totalHands > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            {hasOutOfRangeValues && (
              <div className="bg-accent/10 border border-accent rounded-lg p-3">
                <div className="text-sm font-medium text-accent-foreground mb-2">
                  Values Outside Range (45%-55%)
                </div>
                <div className="flex flex-wrap gap-2">
                  {outOfRangeValues.map(item => (
                    <div 
                      key={item.trueCount}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.winRate < yAxisMin 
                          ? 'bg-destructive/20 text-destructive' 
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      TC {item.trueCount}: {item.winRate.toFixed(1)}%
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    tickFormatter={(value) => `${value}%`}
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
                    dataKey="winRateDisplay" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isOutOfRange = payload?.isOutOfRange;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={isOutOfRange ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                          stroke={isOutOfRange ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                          strokeWidth={isOutOfRange ? 3 : 2}
                        />
                      );
                    }}
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