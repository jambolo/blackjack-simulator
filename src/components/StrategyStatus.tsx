import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { StrategyManager } from "@/lib/strategy-loader";
import { getAvailableStrategies } from "@/lib/strategy-registry";
import { DEFAULT_RULES } from "@/lib/types";

export function StrategyStatus() {
  const [strategyLoaded, setStrategyLoaded] = useState(false);
  const [strategyName, setStrategyName] = useState("");
  const [availableStrategies, setAvailableStrategies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Load default strategy to test the system
      const strategy = StrategyManager.getStrategy(DEFAULT_RULES);
      setStrategyLoaded(true);
      setStrategyName("Optimized Basic Strategy (loaded)");
      setAvailableStrategies(getAvailableStrategies());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStrategyLoaded(false);
    }
  }, []);

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