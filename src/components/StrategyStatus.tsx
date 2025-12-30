import { Alert, Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { useMemo } from "react";
import { getStrategyData } from "@/lib/strategy-registry";
import { DEFAULT_RULES, BlackjackRules } from "@/lib/types";

interface StrategyStatusProps {
  rules?: BlackjackRules;
}

export function StrategyStatus({ rules = DEFAULT_RULES }: StrategyStatusProps) {
  const strategyInfo = useMemo(() => {
    try {
      const strategyData = getStrategyData(rules);
      const rulesSummary = `${rules.dealerHitsSoft17 ? 'H17' : 'S17'}, DAS, ${rules.lateSurrender ? 'LS' : 'NS'}`;

      return {
        loaded: true,
        name: strategyData.name,
        rulesSummary,
        error: null
      };
    } catch (err) {
      return {
        loaded: false,
        name: '',
        rulesSummary: '',
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }, [rules]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Active Strategy</Typography>
          <Chip
            size="small"
            color={strategyInfo.loaded ? "success" : "error"}
            label={strategyInfo.loaded ? "Loaded" : "Error"}
          />
        </Box>

        {strategyInfo.loaded && (
          <Box>
            <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "grey.100", mb: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                {strategyInfo.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rules: {strategyInfo.rulesSummary}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Strategy automatically updates when rule configuration changes
            </Typography>
          </Box>
        )}

        {strategyInfo.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {strategyInfo.error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}