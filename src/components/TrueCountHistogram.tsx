import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrueCountHistogramProps {
  trueCountFrequency: Record<number, number>;
}

export function TrueCountHistogram({ trueCountFrequency }: TrueCountHistogramProps) {
  // Convert the frequency data to chart format
  const chartData = Object.entries(trueCountFrequency)
    .map(([count, frequency]) => ({
      trueCount: parseInt(count),
      frequency: frequency,
      percentage: 0 // Will be calculated below
    }))
    .sort((a, b) => a.trueCount - b.trueCount);

  // Calculate total hands and percentages
  const totalHands = Object.values(trueCountFrequency).reduce((sum, freq) => sum + freq, 0);
  chartData.forEach(item => {
    item.percentage = totalHands > 0 ? (item.frequency / totalHands) * 100 : 0;
  });

  // Custom tooltip to show both frequency and percentage
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-md">
          <p className="text-sm font-medium">{`True Count: ${label}`}</p>
          <p className="text-sm text-blue-600">{`Frequency: ${data.frequency.toLocaleString()}`}</p>
          <p className="text-sm text-green-600">{`Percentage: ${data.percentage.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Get the range of true counts for better display
  const trueCountValues = chartData.map(d => d.trueCount);
  const minCount = Math.min(...trueCountValues);
  const maxCount = Math.max(...trueCountValues);

  // Find the most frequent true count
  const mostFrequent = chartData.reduce((max, item) => 
    item.frequency > max.frequency ? item : max, 
    chartData[0]
  );

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">True Count Distribution (Hi-Lo System)</h3>
        <div className="text-sm text-muted-foreground mb-4">
          <p>Frequency of true count values at the beginning of each round</p>
        </div>
        
        {totalHands > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Rounds</div>
              <div className="text-lg font-semibold">{totalHands.toLocaleString()}</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Count Range</div>
              <div className="text-lg font-semibold">{minCount} to {maxCount}</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Most Frequent</div>
              <div className="text-lg font-semibold">
                {mostFrequent.trueCount} ({mostFrequent.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="trueCount" 
                type="number"
                scale="linear"
                domain={[minCount - 1, maxCount + 1]}
                tickCount={Math.min(20, maxCount - minCount + 3)}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Percent of Total (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="percentage" 
                fill="hsl(var(--primary))"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">Run a simulation to see the true count distribution</div>
          </div>
        </div>
      )}
    </Card>
  );
}