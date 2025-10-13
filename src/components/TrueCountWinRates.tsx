import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
import { TrueCountStats } from "@/lib/types";

interface TrueCountWinRatesProps {
  trueCountStats: Record<number, TrueCountStats>;
}

export function TrueCountWinRates({ trueCountStats }: TrueCountWinRatesProps) {
  // Ensure we have valid data
  const safeStats = trueCountStats || {};
  
  // Convert the stats data to chart format and filter out-of-range values
  const allData = Object.entries(safeStats)
    .map(([count, stats]) => ({
      trueCount: parseInt(count),
      winRate: stats.winRate,
      hands: stats.hands,
      netWinnings: stats.netWinnings,
      avgWinPerHand: stats.hands > 0 ? stats.netWinnings / stats.hands : 0,
    }))
    .filter(item => item.hands >= 10) // Only show counts with significant sample sizes
    .sort((a, b) => a.trueCount - b.trueCount);

  // Filter chart data to only include values within the specified range
  const chartData = allData.filter(item => 
    item.avgWinPerHand >= -0.2 && 
    item.avgWinPerHand <= 0.2 &&
    item.trueCount >= -8 &&
    item.trueCount <= 8
  );

  // Fixed Y-axis range
  const yAxisMin = -0.2;
  const yAxisMax = 0.2;
  
  // Determine if any values are outside the range
  const hasOutOfRangeValues = allData.some(item => 
    item.avgWinPerHand < -0.2 || 
    item.avgWinPerHand > 0.2 ||
    item.trueCount < -8 ||
    item.trueCount > 8
  );

  // Custom tooltip for average win per hand
  const AvgWinTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium mb-2">{`True Count: ${label}`}</p>
          <p className="text-sm text-primary">{`Avg Win/Hand: ${data.avgWinPerHand.toFixed(4)}`}</p>
          <p className="text-sm text-muted-foreground">{`Hands: ${data.hands.toLocaleString()}`}</p>
          <p className="text-sm text-accent">{`Win Rate: ${data.winRate.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate some summary statistics
  const totalHands = chartData.reduce((sum, item) => sum + item.hands, 0);
  const bestCount = chartData.length > 0 ? chartData.reduce((best, item) => 
    item.avgWinPerHand > best.avgWinPerHand ? item : best
  ) : { trueCount: 0, avgWinPerHand: 0, hands: 0 };
  const worstCount = chartData.length > 0 ? chartData.reduce((worst, item) => 
    item.avgWinPerHand < worst.avgWinPerHand ? item : worst
  ) : { trueCount: 0, avgWinPerHand: 0, hands: 0 };

  // Find the range for better display - fixed to show all quadrants
  const minCount = -8;
  const maxCount = 8;
  
  // Identify values outside the allowed range
  const outOfRangeValues = allData.filter(d => 
    d.avgWinPerHand < -0.2 || 
    d.avgWinPerHand > 0.2 ||
    d.trueCount < -8 ||
    d.trueCount > 8
  );

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Average Win per Hand by True Count</h3>
        <div className="text-sm text-muted-foreground mb-4">
          <p>Average win/loss amount per hand for each true count value (minimum 10 hands required)</p>
          <p className="text-xs">Y-axis fixed to -0.2 to 0.2, X-axis fixed to -8 to 8 (showing all quadrants)</p>
          <p className="text-xs">Data points outside these ranges are not displayed on the graph</p>
        </div>
        
        {totalHands > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Best Count</div>
                <div className="text-lg font-semibold text-primary">
                  {bestCount.trueCount} ({bestCount.avgWinPerHand.toFixed(4)})
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Worst Count</div>
                <div className="text-lg font-semibold text-destructive">
                  {worstCount.trueCount} ({worstCount.avgWinPerHand.toFixed(4)})
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
                  Values Outside Display Range (not shown on graph)
                </div>
                <div className="flex flex-wrap gap-2">
                  {outOfRangeValues.map(item => (
                    <div 
                      key={item.trueCount}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.avgWinPerHand < -0.2 
                          ? 'bg-destructive/20 text-destructive' 
                          : item.avgWinPerHand > 0.2
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      TC {item.trueCount}: {item.avgWinPerHand.toFixed(4)}
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
          {/* Average Win per Hand Chart */}
          <div>
            <h4 className="text-md font-medium mb-2">Average Win per Hand by True Count</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="trueCount" 
                    type="number"
                    scale="linear"
                    domain={[-8, 8]}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    orientation="bottom"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Average Win per Hand', angle: -90, position: 'insideLeft' }}
                    domain={[-0.2, 0.2]}
                    tickFormatter={(value) => value.toFixed(3)}
                    axisLine={false}
                  />
                  <Tooltip content={<AvgWinTooltip />} />
                  {/* X-axis reference line at y=0 */}
                  <ReferenceLine 
                    y={0} 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={2}
                    strokeDasharray="none"
                  />
                  {/* Y-axis reference line at x=0 */}
                  <ReferenceLine 
                    x={0} 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={2}
                    strokeDasharray="none"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgWinPerHand" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{
                      fill: "hsl(var(--primary))",
                      stroke: "hsl(var(--primary))",
                      strokeWidth: 2,
                      r: 4
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
            <div className="text-sm">Run a simulation to see average win per hand by true count</div>
          </div>
        </div>
      )}
    </Card>
  );
}