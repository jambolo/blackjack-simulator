import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { StrategyManager } from "@/lib/strategy-loader";
import { getAvailableStrategies, getStrategyData } from "@/lib/strategy-registry";
import { DEFAULT_RULES, BlackjackRules } from "@/lib/types";

interface StrategyStatusProps {
  rules?: BlackjackRules;
}

export function StrategyStatus({ rules = DEFAULT_RULES }: StrategyStatusProps) {
  const [strategyLoaded, setStrategyLoaded] = useState(false);
  const [strategyName, setStrategyName] = useState("");
  const [availableStrategies, setAvailableStrategies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Load strategy for current rules
      const strategy = StrategyManager.getStrategy(rules);
      const strategyData = getStrategyData(rules);
      setStrategyLoaded(true);
      setStrategyName(strategyData.name);
      setAvailableStrategies(getAvailableStrategies());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStrategyLoaded(false);
    }
  }, [rules]);

  const rulesSummary = `${rules.dealerHitsSoft17 ? 'H17' : 'S17'}, DAS, ${rules.lateSurrender ? 'LS' : 'NS'}`;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Strategy System Status</h3>
          <Badge variant={strategyLoaded ? "default" : "destructive"}>
            {strategyLoaded ? "Active" : "Error"}
          </Badge>
        </div>
        
        {strategyLoaded && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Active Strategy:</strong> {strategyName}</p>
            <p><strong>Current Rules:</strong> {rulesSummary}</p>
            <p><strong>Available Strategies:</strong> {availableStrategies.length}</p>
            <div className="flex flex-wrap gap-1">
              {availableStrategies.map(strategy => (
                <Badge key={strategy} variant="outline" className="text-xs">
                  {strategy}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-sm text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </Card>
  );
}