import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SimulationConfig, DEFAULT_SIMULATION_CONFIG } from "@/lib/types";

interface SimulationConfigurationProps {
  simulationConfig: SimulationConfig;
  onSimulationConfigChange: (config: SimulationConfig) => void;
}

export function SimulationConfiguration({ simulationConfig, onSimulationConfigChange }: SimulationConfigurationProps) {
  const updateSimulationConfig = <K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) => {
    onSimulationConfigChange({ ...simulationConfig, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shoe-count">Number of Shoes to Simulate</Label>
        <Input
          id="shoe-count"
          type="number"
          min="1"
          max="100000000"
          step="1"
          value={simulationConfig.shoeCount}
          onChange={(e) => {
            const value = parseInt(e.target.value) || DEFAULT_SIMULATION_CONFIG.shoeCount;
            const clampedValue = Math.max(1, Math.min(100000000, value));
            updateSimulationConfig('shoeCount', clampedValue);
          }}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Range: 1 to 100,000,000 shoes. More shoes provide more accurate results but take longer to run.
        </p>
      </div>
    </div>
  );
}