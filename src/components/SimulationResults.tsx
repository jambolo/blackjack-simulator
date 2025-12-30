import { Box, Button, Card, CardContent, Paper, Tab, Tabs, Typography } from "@mui/material";
import { SimulationStats, BlackjackRules } from "@/lib/types";
import { lazy, ReactNode, Suspense, useState } from "react";
import { TrendUp, TrendDown, Trophy, Download } from "@phosphor-icons/react";
import { getStrategyData } from "@/lib/strategy-registry";

const TrueCountWinRates = lazy(() => import("@/components/TrueCountWinRates").then(m => ({ default: m.TrueCountWinRates })));

function TabPanel({ value, index, children }: { value: number; index: number; children: ReactNode }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

function StatPanel({
  title,
  value,
  isPositive,
}: {
  title: string;
  value: string;
  isPositive: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={700} color={isPositive ? "success.main" : "error.main"}>
            {value}
          </Typography>
        </Box>
        {isPositive ? <TrendUp size={28} color="#2e7d32" /> : <TrendDown size={28} color="#d32f2f" />}
      </Box>
    </Paper>
  );
}

function MetricCard({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: string;
  percent: string;
  color: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: color }}>
      <Typography variant="h5" fontWeight={700} sx={{ color }}>{value}</Typography>
      <Typography variant="body2" sx={{ color }}>{label}</Typography>
      <Typography variant="caption" sx={{ color }}>{percent}</Typography>
    </Paper>
  );
}

interface SimulationResultsProps {
  stats: SimulationStats;
  rules?: BlackjackRules;
  simulationConfig?: unknown;
  onNotify?: (message: string, severity: "success" | "info" | "error") => void;
}

export function SimulationResults({ stats, rules, simulationConfig, onNotify }: SimulationResultsProps) {
  const [tab, setTab] = useState(0);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercent = (num: number, decimals = 2) => {
    return `${num.toFixed(decimals)}%`;
  };

  const formatCurrency = (num: number, decimals = 2) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(decimals)}`;
  };

  const formatNetWinnings = (num: number) => {
    const sign = num >= 0 ? '+' : '-';
    if (num > 100000 || num < -100000) {
      const valueInK = Math.round(num / 1000);
      return `${sign}$${Math.abs(valueInK).toLocaleString()}k`;
    }
    return `${sign}$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const strategyName = rules ? getStrategyData(rules).name : 'Unknown Strategy';

  const handleExportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      strategy: strategyName,
      rules: rules || null,
      simulationConfig: simulationConfig || null,
      results: stats,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blackjack-simulation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onNotify) {
      onNotify('Results exported successfully', 'success');
    }
  };

  const winRate = stats.winRate;
  const lossRate = ((stats.losses / (stats.wins + stats.losses)) * 100) || 0;
  const pushRate = ((stats.pushes / stats.totalHands) * 100) || 0;
  const blackjackRate = ((stats.blackjacks / stats.totalHands) * 100) || 0;
  const surrenderRate = ((stats.surrenders / stats.totalHands) * 100) || 0;
  const doubleRate = ((stats.doubles / stats.totalHands) * 100) || 0;
  const splitRate = ((stats.splits / stats.totalHands) * 100) || 0;

  const avgHandsPerShoe = stats.totalShoes > 0 ? stats.totalHands / stats.totalShoes : 0;
  const avgWinPerHand = stats.totalHands > 0 ? stats.netWinnings / stats.totalHands : 0;
  const hitStandHands = stats.totalHands - stats.doubles - stats.splits - stats.surrenders;

  return (
    <Card variant="outlined">
      <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Trophy size={24} />
          Simulation Results (Flat Betting $1)
        </Typography>
        <Button
          onClick={handleExportJSON}
          variant="outlined"
          size="small"
          startIcon={<Download size={16} />}
        >
          Export JSON
        </Button>
      </Box>

      <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: "grey.100" }}>
        <Typography variant="body2" color="text.secondary">
          <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>Strategy Used:</Box> {strategyName}
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
        <Tab label="Overview" />
        <Tab label="Hand Outcomes" />
        <Tab label="Player Actions" />
        <Tab label="Card Counting" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "repeat(4, 1fr)" },
            mb: 3,
          }}
        >
          <StatPanel title="House Edge" value={formatPercent(stats.houseEdge)} isPositive={stats.houseEdge <= 0} />
          <StatPanel title="Net Winnings" value={formatNetWinnings(stats.netWinnings)} isPositive={stats.netWinnings >= 0} />
          <StatPanel title="Win Rate" value={formatPercent(winRate)} isPositive={winRate >= 45} />
          <StatPanel title="Avg Win/Hand" value={formatCurrency(avgWinPerHand, 4)} isPositive={avgWinPerHand >= 0} />
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>Game Statistics</Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">Total Hands Played:</Typography>
            <Typography variant="body2" fontWeight={600}>{formatNumber(stats.totalHands)}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">Shoes Completed:</Typography>
            <Typography variant="body2" fontWeight={600}>{formatNumber(stats.totalShoes)}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">Avg Hands per Shoe:</Typography>
            <Typography variant="body2" fontWeight={600}>{avgHandsPerShoe.toFixed(1)}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">Standard Deviation (Winnings):</Typography>
            <Typography variant="body2" fontWeight={600}>{stats.standardDeviation.toFixed(2)}</Typography>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          <MetricCard label="Wins" value={formatNumber(stats.wins)} percent={formatPercent(winRate)} color="#2e7d32" />
          <MetricCard label="Losses" value={formatNumber(stats.losses)} percent={formatPercent(lossRate)} color="#d32f2f" />
          <MetricCard label="Pushes" value={formatNumber(stats.pushes)} percent={formatPercent(pushRate)} color="#546e7a" />
          <MetricCard label="Blackjacks" value={formatNumber(stats.blackjacks)} percent={formatPercent(blackjackRate)} color="#b88a2a" />
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          <MetricCard label="Doubles" value={formatNumber(stats.doubles)} percent={formatPercent(doubleRate)} color="#1565c0" />
          <MetricCard label="Splits" value={formatNumber(stats.splits)} percent={formatPercent(splitRate)} color="#6a1b9a" />
          <MetricCard label="Surrenders" value={formatNumber(stats.surrenders)} percent={formatPercent(surrenderRate)} color="#ef6c00" />
          <MetricCard
            label="Hit/Stand"
            value={formatNumber(hitStandHands)}
            percent={formatPercent((hitStandHands / Math.max(stats.totalHands, 1)) * 100)}
            color="#455a64"
          />
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={3}>
          <Suspense fallback={<Box sx={{ height: 256, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography>Loading chart...</Typography></Box>}>
            <TrueCountWinRates trueCountStats={stats.trueCountStats || {}} />
          </Suspense>
      </TabPanel>
      </CardContent>
    </Card>
  );
}