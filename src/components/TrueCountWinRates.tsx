import { Box, Card, CardContent, Typography } from "@mui/material";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
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
        <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, p: 1.5, boxShadow: 2 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>{`True Count: ${label}`}</Typography>
          <Typography variant="body2" color="primary.main">{`Avg Win/Hand: ${data.avgWinPerHand.toFixed(4)}`}</Typography>
          <Typography variant="body2" color="text.secondary">{`Hands: ${data.hands.toLocaleString()}`}</Typography>
          <Typography variant="body2" color="secondary.main">{`Win Rate: ${data.winRate.toFixed(2)}%`}</Typography>
        </Box>
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
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Average Win per Hand by True Count</Typography>
          <Typography variant="body2" color="text.secondary">Average win/loss amount per hand for each true count value (minimum 10 hands required).</Typography>
          <Typography variant="caption" color="text.secondary" display="block">Y-axis fixed to -0.2 to 0.2, X-axis fixed to -8 to 8.</Typography>
          <Typography variant="caption" color="text.secondary" display="block">Data points outside these ranges are not displayed on the graph.</Typography>
        </Box>

        {totalHands > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                mb: 2,
              }}
            >
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "grey.100" }}>
                <Typography variant="body2" color="text.secondary">Best Count</Typography>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  {bestCount.trueCount} ({bestCount.avgWinPerHand.toFixed(4)})
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "grey.100" }}>
                <Typography variant="body2" color="text.secondary">Worst Count</Typography>
                <Typography variant="h6" color="error.main" fontWeight={700}>
                  {worstCount.trueCount} ({worstCount.avgWinPerHand.toFixed(4)})
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "grey.100" }}>
                <Typography variant="body2" color="text.secondary">Count Range</Typography>
                <Typography variant="h6" fontWeight={700}>
                  {chartData.length > 0 ? `${minCount} to ${maxCount}` : 'No data'}
                </Typography>
              </Box>
            </Box>

            {hasOutOfRangeValues && (
              <Box sx={{ p: 1.5, borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "rgba(184,138,42,0.08)" }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Values Outside Display Range (not shown on graph)
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {outOfRangeValues.map(item => (
                    <Box
                      key={item.trueCount}
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: 12,
                        fontWeight: 600,
                        bgcolor: item.avgWinPerHand < -0.2
                          ? "rgba(211,47,47,0.12)"
                          : item.avgWinPerHand > 0.2
                            ? "rgba(46,125,50,0.12)"
                            : "rgba(0,0,0,0.05)",
                        color: item.avgWinPerHand < -0.2
                          ? "error.main"
                          : item.avgWinPerHand > 0.2
                            ? "success.main"
                            : "text.secondary",
                      }}
                    >
                      TC {item.trueCount}: {item.avgWinPerHand.toFixed(4)}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

      {chartData.length > 0 ? (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Average Win per Hand by True Count</Typography>
          <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="trueCount"
                    type="number"
                    scale="linear"
                    domain={[-8, 8]}
                    tick={{ fontSize: 12 }}
                    axisLine={true}
                    orientation="bottom"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Average Win per Hand', angle: -90, position: 'insideLeft', offset: 10 }}
                    domain={[-0.2, 0.2]}
                    tickFormatter={(value) => value.toFixed(3)}
                    axisLine={false}
                  />
                  <Tooltip content={<AvgWinTooltip />} />
                  <ReferenceLine
                    y={0}
                    stroke="#374151"
                    strokeWidth={2}
                    strokeDasharray="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgWinPerHand"
                    stroke="#1f7a4d"
                    strokeWidth={2}
                    dot={{
                      fill: "#1f7a4d",
                      stroke: "#1f7a4d",
                      strokeWidth: 2,
                      r: 4
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
          </Box>
        </Box>
      ) : (
        <Box sx={{ height: 256, display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>No Data Available</Typography>
            <Typography variant="body2">Run a simulation to see average win per hand by true count.</Typography>
          </Box>
        </Box>
      )}
      </CardContent>
    </Card>
  );
}