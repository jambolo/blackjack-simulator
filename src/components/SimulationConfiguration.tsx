import { Stack, TextField, Typography } from "@mui/material";
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
    <Stack spacing={1.5}>
      <TextField
          id="shoe-count"
          label="Number of Shoes to Simulate"
          type="number"
          inputProps={{ min: 1, max: 100000000, step: 1 }}
          value={simulationConfig.shoeCount}
          onChange={(e) => {
            const value = parseInt(e.target.value) || DEFAULT_SIMULATION_CONFIG.shoeCount;
            const clampedValue = Math.max(1, Math.min(100000000, value));
            updateSimulationConfig('shoeCount', clampedValue);
          }}
          fullWidth
        />
      <Typography variant="caption" color="text.secondary">
          Range: 1 to 100,000,000 shoes. More shoes provide more accurate results but take longer to run.
      </Typography>
    </Stack>
  );
}