import {
  Box,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { TrueCountStats } from "@/lib/types";

interface BettingReturnsProps {
  trueCountStats: Record<number, TrueCountStats>;
}

export function BettingReturns({ trueCountStats }: BettingReturnsProps) {
  const safeStats = trueCountStats || {};

  const allData = Object.entries(safeStats)
    .map(([count, stats]) => ({
      trueCount: parseInt(count),
      hands: stats.hands,
      betAmount: stats.betAmount,
      avgWinPerHand: stats.hands > 0 ? stats.netWinnings / stats.hands : 0,
      totalReturns: stats.totalReturns,
    }))
    .filter(item => item.trueCount >= -2 && item.trueCount <= 8)
    .sort((a, b) => a.trueCount - b.trueCount);

  const totalReturns = allData.reduce((sum, item) => sum + item.totalReturns, 0);
  const totalHands = allData.reduce((sum, item) => sum + item.hands, 0);
  const avgReturnPerHand = totalHands > 0 ? totalReturns / totalHands : 0;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Betting Returns by True Count</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Simulated betting returns using card counting strategy.
        </Typography>
        <Box sx={{ mt: 1, p: 1.5, borderRadius: 1, bgcolor: "grey.100" }}>
          <Typography variant="subtitle2">Betting Strategy</Typography>
          <Typography variant="caption" display="block">True Count ≤ -3: Bet = 0 (no play)</Typography>
          <Typography variant="caption" display="block">True Count -2, -1, 0: Bet = 0.5 units</Typography>
          <Typography variant="caption" display="block">True Count ≥ 1: Bet = True Count units</Typography>
          <Typography variant="caption" display="block">True Count ≥ 5: Bet = 8 units</Typography>
        </Box>

        <Box
          sx={{
            mt: 2,
            mb: 3,
            p: 2,
            borderRadius: 1,
            bgcolor: "rgba(31,122,77,0.08)",
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">Total Returns</Typography>
            <Typography variant="h5" fontWeight={700} color={totalReturns >= 0 ? "success.main" : "error.main"}>
              {totalReturns >= 0 ? '+' : ''}{totalReturns.toFixed(2)} units
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Avg Return per Hand</Typography>
            <Typography variant="h5" fontWeight={700} color={avgReturnPerHand >= 0 ? "success.main" : "error.main"}>
              {avgReturnPerHand >= 0 ? '+' : ''}{avgReturnPerHand.toFixed(3)} units
            </Typography>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
              {allData.map((item) => (
                <TableCell key={item.trueCount} align="right" sx={{ fontWeight: 600 }}>
                  {item.trueCount}
                </TableCell>
              ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Bet Size</TableCell>
              {allData.map((item) => (
                <TableCell key={item.trueCount} align="right">
                  {item.betAmount.toFixed(1)}
                </TableCell>
              ))}
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Total Returns</TableCell>
              {allData.map((item) => (
                <TableCell
                  key={item.trueCount}
                  align="right"
                  sx={{ color: item.totalReturns >= 0 ? "success.main" : "error.main", fontWeight: 600 }}
                >
                  {item.totalReturns >= 0 ? '+' : ''}{item.totalReturns.toFixed(2)}
                </TableCell>
              ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {allData.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>No Data Available</Typography>
            <Typography variant="body2">Run a simulation to see betting returns by true count.</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
