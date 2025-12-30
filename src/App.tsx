import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Container, Divider, Snackbar, Stack, Typography } from "@mui/material";
import { RuleConfiguration } from "@/components/RuleConfiguration";
import { SimulationConfiguration } from "@/components/SimulationConfiguration";
import { SimulationProgress } from "@/components/SimulationProgress";
import { SimulationResults } from "@/components/SimulationResults";
import { StrategyStatus } from "@/components/StrategyStatus";
import { PerformanceStats } from "@/components/PerformanceStats";
import { BettingReturns } from "@/components/BettingReturns";
import { BlackjackRules, SimulationConfig, SimulationStats, DEFAULT_RULES, DEFAULT_SIMULATION_CONFIG } from "@/lib/types";
import { runSimulationMultiThreaded } from "@/lib/multi-threaded-simulator";
import { Play, Square } from "@phosphor-icons/react";
import { useLocalStorage } from "@/hooks/use-local-storage";

type NoticeSeverity = "success" | "info" | "error";

interface NoticeState {
  open: boolean;
  message: string;
  severity: NoticeSeverity;
}

function App() {
  const [rules, setRules] = useLocalStorage<BlackjackRules>('blackjack-rules', DEFAULT_RULES);
  const [simulationConfig, setSimulationConfig] = useLocalStorage<SimulationConfig>('simulation-config', DEFAULT_SIMULATION_CONFIG);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStats, setCurrentStats] = useState<SimulationStats | null>(null);
  const [finalStats, setFinalStats] = useState<SimulationStats | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [simulationStartTime, setSimulationStartTime] = useState<number | null>(null);
  const [simulationEndTime, setSimulationEndTime] = useState<number | null>(null);
  const [notice, setNotice] = useState<NoticeState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showNotice = (message: string, severity: NoticeSeverity) => {
    setNotice({ open: true, message, severity });
  };

  const handleStartSimulation = async () => {
    if (isSimulating) {
      // Stop simulation
      if (abortController) {
        abortController.abort();
      }
      setIsSimulating(false);
      setAbortController(null);
      showNotice("Simulation stopped", "info");
      return;
    }

    // Start simulation
    setIsSimulating(true);
    setProgress(0);
    setCurrentStats(null);
    setFinalStats(null);
    setSimulationStartTime(Date.now());
    setSimulationEndTime(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      showNotice("Starting blackjack simulation...", "info");

      const stats = await runSimulationMultiThreaded(
        rules,
        simulationConfig.shoeCount,
        (progressPercent, stats) => {
          if (controller.signal.aborted) return;
          setProgress(progressPercent);
          // Only update stats if they contain actual data (totalHands > 0)
          // This prevents displaying accumulated stats during progress updates
          if (stats.totalHands > 0) {
            setCurrentStats(stats);
          }
        },
        controller.signal
      );

      if (!controller.signal.aborted) {
        setFinalStats(stats);
        setProgress(100);
        setSimulationEndTime(Date.now());
        const shoeCount = simulationConfig.shoeCount;
        showNotice(
          `Simulation complete. Played ${stats.totalHands.toLocaleString()} hands across ${stats.totalShoes.toLocaleString()} shoes (${shoeCount.toLocaleString()} requested).`,
          "success"
        );
      }
    } catch {
      if (!controller.signal.aborted) {
        showNotice("Simulation failed. Please try again.", "error");
      }
    } finally {
      setIsSimulating(false);
      setAbortController(null);
    }
  };

  const simulationComplete = finalStats && !isSimulating;

  return (
    <Box sx={{ minHeight: "100vh", py: 6 }}>
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" gutterBottom>
            Blackjack Simulation Tool
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mx: "auto" }}>
            Analyze different blackjack rule variations using basic strategy.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            }}
          >
            <RuleConfiguration
              rules={rules}
              onRulesChange={setRules}
            />
            <StrategyStatus rules={rules} />
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6">Simulation Control</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Run {simulationConfig.shoeCount.toLocaleString()} complete shoes using basic strategy
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Multi-threaded simulation using {navigator.hardwareConcurrency || 4} CPU cores
                  </Typography>
                </Box>
                <Button
                  onClick={handleStartSimulation}
                  size="large"
                  color={isSimulating ? "error" : "primary"}
                  variant="contained"
                  startIcon={isSimulating ? <Square size={18} /> : <Play size={18} />}
                  sx={{ minWidth: 180, alignSelf: { xs: "stretch", md: "center" } }}
                >
                  {isSimulating ? "Stop" : "Start Simulation"}
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Simulation Configuration
              </Typography>
              <SimulationConfiguration
                simulationConfig={simulationConfig}
                onSimulationConfigChange={setSimulationConfig}
              />
            </CardContent>
          </Card>

          {(isSimulating || currentStats) && (
            <SimulationProgress
              progress={progress}
              isRunning={isSimulating}
              currentStats={currentStats || undefined}
            />
          )}

          {simulationComplete && (
            <Stack spacing={3}>
              <PerformanceStats
                startTime={simulationStartTime || undefined}
                endTime={simulationEndTime || undefined}
                totalHands={finalStats.totalHands}
                isMultiThreaded={true}
              />
              <SimulationResults
                stats={finalStats}
                rules={rules}
                simulationConfig={simulationConfig}
                onNotify={(message, severity) => showNotice(message, severity)}
              />
              <BettingReturns trueCountStats={finalStats.trueCountStats} />
            </Stack>
          )}
        </Stack>
      </Container>
      <Snackbar
        open={notice.open}
        autoHideDuration={3500}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
          severity={notice.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;