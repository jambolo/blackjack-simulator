import { Box, Card, CardContent, Typography } from "@mui/material";
import { Timer, Lightning, Cpu } from "@phosphor-icons/react";

interface PerformanceStatsProps {
  startTime?: number;
  endTime?: number;
  totalHands: number;
  isMultiThreaded: boolean;
}

export function PerformanceStats({ startTime, endTime, totalHands, isMultiThreaded }: PerformanceStatsProps) {
  if (!startTime || !endTime) return null;

  const durationSeconds = (endTime - startTime) / 1000;
  const handsPerSecond = totalHands / durationSeconds;
  const estimatedSpeedup = isMultiThreaded ? navigator.hardwareConcurrency || 4 : 1;

  return (
    <Card variant="outlined" sx={{ background: "linear-gradient(90deg, rgba(31,122,77,0.08) 0%, rgba(184,138,42,0.12) 100%)" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Lightning size={20} />
          <Typography variant="h6">Performance Metrics</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mb: 0.5 }}>
              <Timer size={16} />
              <Typography variant="body2" color="text.secondary">Duration</Typography>
            </Box>
            <Typography variant="h6" color="primary" fontWeight={700}>
            {durationSeconds.toFixed(1)}s
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mb: 0.5 }}>
              <Lightning size={16} />
              <Typography variant="body2" color="text.secondary">Hands/Second</Typography>
            </Box>
            <Typography variant="h6" color="secondary" fontWeight={700}>
            {handsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mb: 0.5 }}>
              <Cpu size={16} />
              <Typography variant="body2" color="text.secondary">CPU Cores</Typography>
            </Box>
            <Typography variant="h6" color="primary" fontWeight={700}>
            {estimatedSpeedup}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}