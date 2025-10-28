import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  }, [rules.dealerHitsSoft17, rules.lateSurrender]);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Active Strategy</h3>
          <Badge variant={strategyInfo.loaded ? "default" : "destructive"}>
            {strategyInfo.loaded ? "Loaded" : "Error"}
          </Badge>
        </div>
        
        {strategyInfo.loaded && (
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="font-medium text-foreground mb-1">{strategyInfo.name}</p>
              <p className="text-xs text-muted-foreground">Rules: {strategyInfo.rulesSummary}</p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Strategy automatically updates when rule configuration changes
            </p>
          </div>
        )}
        
        {strategyInfo.error && (
          <div className="text-sm text-destructive">
            <strong>Error:</strong> {strategyInfo.error}
          </div>
        )}
      </div>
    </Card>
  );
}