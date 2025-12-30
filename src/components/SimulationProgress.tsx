import { Box, Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";
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
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">
          {isRunning ? 'Simulation Running...' : 'Simulation Complete'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
          {formatPercent(progress)}
          </Typography>
        </Stack>

        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 2 }} />

        {currentStats && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5" color="primary" fontWeight={700}>
              {formatNumber(currentStats.totalHands)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Hands</Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5" color="primary" fontWeight={700}>
              {formatNumber(currentStats.totalShoes)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Shoes Played</Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5" fontWeight={700} color={currentStats.winRate >= 50 ? "success.main" : "error.main"}>
              {formatPercent(currentStats.winRate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Win Rate</Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5" fontWeight={700} color={currentStats.netWinnings >= 0 ? "success.main" : "error.main"}>
              {formatCurrency(currentStats.netWinnings)}
              </Typography>
              <Typography variant="body2" color="text.secondary">Net Winnings</Typography>
            </Box>
          </Box>
        )}

        {isRunning && (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">Running optimal basic strategy simulation...</Typography>
            <Typography variant="caption" color="text.secondary">
              Multi-threaded processing on {navigator.hardwareConcurrency || 4} CPU cores
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}