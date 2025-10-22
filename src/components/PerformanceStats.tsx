import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
      <div className="flex items-center gap-2 mb-3">
        <Lightning className="h-5 w-5 text-accent" />
        <h4 className="font-semibold text-foreground">Performance Metrics</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Duration</span>
          </div>
          <div className="text-lg font-bold text-primary">
            {durationSeconds.toFixed(1)}s
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Lightning className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Hands/Second</span>
          </div>
          <div className="text-lg font-bold text-accent">
            {handsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">CPU Cores</span>
          </div>
          <div className="text-lg font-bold text-primary">
            {estimatedSpeedup}
          </div>
        </div>
      </div>
    </Card>
  );
}