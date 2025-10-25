import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
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
import { toast } from "sonner";

function App() {
  const [rules, setRules] = useKV<BlackjackRules>('blackjack-rules', DEFAULT_RULES);
  const [simulationConfig, setSimulationConfig] = useKV<SimulationConfig>('simulation-config', DEFAULT_SIMULATION_CONFIG);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStats, setCurrentStats] = useState<SimulationStats | null>(null);
  const [finalStats, setFinalStats] = useState<SimulationStats | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [simulationStartTime, setSimulationStartTime] = useState<number | null>(null);
  const [simulationEndTime, setSimulationEndTime] = useState<number | null>(null);

  const handleStartSimulation = async () => {
    if (isSimulating) {
      // Stop simulation
      if (abortController) {
        abortController.abort();
      }
      setIsSimulating(false);
      setAbortController(null);
      toast.info("Simulation stopped");
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
      toast.success("Starting blackjack simulation...");
      
      const stats = await runSimulationMultiThreaded(
        rules || DEFAULT_RULES,
        simulationConfig?.shoeCount || DEFAULT_SIMULATION_CONFIG.shoeCount,
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
        const shoeCount = simulationConfig?.shoeCount || DEFAULT_SIMULATION_CONFIG.shoeCount;
        toast.success(`Simulation complete! Played ${stats.totalHands.toLocaleString()} hands across ${stats.totalShoes.toLocaleString()} shoes (${shoeCount.toLocaleString()} requested).`);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        toast.error("Simulation failed. Please try again.");
      }
    } finally {
      setIsSimulating(false);
      setAbortController(null);
    }
  };

  const simulationComplete = finalStats && !isSimulating;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Blackjack Simulation Tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze different blackjack rule variations using basic strategy.
          </p>
        </div>

        {/* Configuration */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RuleConfiguration 
              rules={rules || DEFAULT_RULES} 
              onRulesChange={setRules}
            />
          </div>
          <div>
            <StrategyStatus rules={rules || DEFAULT_RULES} />
          </div>
        </div>

        {/* Control Panel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Simulation Control</h3>
              <p className="text-sm text-muted-foreground">
                Run {(simulationConfig?.shoeCount || DEFAULT_SIMULATION_CONFIG.shoeCount).toLocaleString()} complete shoes using basic strategy
              </p>
              <p className="text-xs text-accent-foreground mt-1">
                ⚡ Multi-threaded simulation using {navigator.hardwareConcurrency || 4} CPU cores
              </p>
            </div>
            <Button
              onClick={handleStartSimulation}
              size="lg"
              variant={isSimulating ? "destructive" : "default"}
              className="min-w-32 transition-all duration-200 active:scale-95 hover:scale-105"
              disabled={false}
            >
              {isSimulating ? (
                <>
                  <Square className="h-5 w-5 mr-2 animate-pulse" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Simulation
                </>
              )}
            </Button>
          </div>
          
          <div className="border-t pt-6">
            <h4 className="text-md font-medium mb-4">Simulation Configuration</h4>
            <SimulationConfiguration
              simulationConfig={simulationConfig || DEFAULT_SIMULATION_CONFIG}
              onSimulationConfigChange={setSimulationConfig}
            />
          </div>
        </Card>

        {/* Progress */}
        {(isSimulating || currentStats) && (
          <SimulationProgress
            progress={progress}
            isRunning={isSimulating}
            currentStats={currentStats || undefined}
          />
        )}

        {/* Results */}
        {simulationComplete && (
          <div className="space-y-6">
            <PerformanceStats
              startTime={simulationStartTime || undefined}
              endTime={simulationEndTime || undefined}
              totalHands={finalStats.totalHands}
              isMultiThreaded={true}
            />
            <SimulationResults 
              stats={finalStats} 
              rules={rules || DEFAULT_RULES}
              simulationConfig={simulationConfig || DEFAULT_SIMULATION_CONFIG}
            />
            <BettingReturns trueCountStats={finalStats.trueCountStats} />
          </div>
        )}


      </div>
    </div>
  );
}

export default App;