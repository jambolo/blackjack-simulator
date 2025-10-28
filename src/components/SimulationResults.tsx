import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimulationStats, BlackjackRules } from "@/lib/types";
import { TrueCountWinRates } from "@/components/TrueCountWinRates";
import { TrendUp, TrendDown, Trophy, Download } from "@phosphor-icons/react";
import { toast } from "sonner";
import { getStrategyData } from "@/lib/strategy-registry";

interface SimulationResultsProps {
  stats: SimulationStats;
  rules?: BlackjackRules;
  simulationConfig?: any;
}

export function SimulationResults({ stats, rules, simulationConfig }: SimulationResultsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercent = (num: number, decimals = 2) => {
    return `${num.toFixed(decimals)}%`;
  };

  const formatCurrency = (num: number, decimals = 2) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(decimals)}`;
  };

  const formatNetWinnings = (num: number) => {
    const sign = num >= 0 ? '+' : '-';
    if (num > 100000 || num < -100000) {
      const valueInK = Math.round(num / 1000);
      return `${sign}$${Math.abs(valueInK).toLocaleString()}k`;
    }
    return `${sign}$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const strategyName = rules ? getStrategyData(rules).name : 'Unknown Strategy';

  const handleExportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      strategy: strategyName,
      rules: rules || null,
      simulationConfig: simulationConfig || null,
      results: stats,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blackjack-simulation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Results exported successfully');
  };

  const winRate = stats.winRate;
  const lossRate = ((stats.losses / (stats.wins + stats.losses)) * 100) || 0;
  const pushRate = ((stats.pushes / stats.totalHands) * 100) || 0;
  const blackjackRate = ((stats.blackjacks / stats.totalHands) * 100) || 0;
  const surrenderRate = ((stats.surrenders / stats.totalHands) * 100) || 0;
  const doubleRate = ((stats.doubles / stats.totalHands) * 100) || 0;
  const splitRate = ((stats.splits / stats.totalHands) * 100) || 0;

  const avgHandsPerShoe = stats.totalShoes > 0 ? stats.totalHands / stats.totalShoes : 0;
  const avgWinPerHand = stats.totalHands > 0 ? stats.netWinnings / stats.totalHands : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-accent" />
          Simulation Results (Flat Betting $1)
        </h2>
        <Button
          onClick={handleExportJSON}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
      </div>

      <div className="mb-6 p-3 bg-muted/50 rounded-md">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Strategy Used:</span> {strategyName}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="outcomes">Hand Outcomes</TabsTrigger>
          <TabsTrigger value="actions">Player Actions</TabsTrigger>
          <TabsTrigger value="counting">Card Counting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">House Edge</p>
                  <p className={`text-2xl font-bold ${stats.houseEdge <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(stats.houseEdge)}
                  </p>
                </div>
                {stats.houseEdge <= 0 ? (
                  <TrendUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>

            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Winnings</p>
                  <p className={`text-2xl font-bold ${stats.netWinnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNetWinnings(stats.netWinnings)}
                  </p>
                </div>
                {stats.netWinnings >= 0 ? (
                  <TrendUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>

            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className={`text-2xl font-bold ${winRate >= 45 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(winRate)}
                  </p>
                </div>
                {winRate >= 45 ? (
                  <TrendUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>

            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Win/Hand</p>
                  <p className={`text-2xl font-bold ${avgWinPerHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(avgWinPerHand, 4)}
                  </p>
                </div>
                {avgWinPerHand >= 0 ? (
                  <TrendUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Game Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Hands Played:</span>
                <span className="font-medium">{formatNumber(stats.totalHands)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shoes Completed:</span>
                <span className="font-medium">{formatNumber(stats.totalShoes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Hands per Shoe:</span>
                <span className="font-medium">{avgHandsPerShoe.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard Deviation (Winnings):</span>
                <span className="font-medium">{stats.standardDeviation.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{formatNumber(stats.wins)}</div>
                <div className="text-sm text-green-600 font-medium">Wins</div>
                <div className="text-xs text-green-600">{formatPercent(winRate)}</div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700">{formatNumber(stats.losses)}</div>
                <div className="text-sm text-red-600 font-medium">Losses</div>
                <div className="text-xs text-red-600">{formatPercent(lossRate)}</div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{formatNumber(stats.pushes)}</div>
                <div className="text-sm text-gray-600 font-medium">Pushes</div>
                <div className="text-xs text-gray-600">{formatPercent(pushRate)}</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-700">{formatNumber(stats.blackjacks)}</div>
                <div className="text-sm text-yellow-600 font-medium">Blackjacks</div>
                <div className="text-xs text-yellow-600">{formatPercent(blackjackRate)}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{formatNumber(stats.doubles)}</div>
                <div className="text-sm text-blue-600 font-medium">Doubles</div>
                <div className="text-xs text-blue-600">{formatPercent(doubleRate)}</div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">{formatNumber(stats.splits)}</div>
                <div className="text-sm text-purple-600 font-medium">Splits</div>
                <div className="text-xs text-purple-600">{formatPercent(splitRate)}</div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-700">{formatNumber(stats.surrenders)}</div>
                <div className="text-sm text-orange-600 font-medium">Surrenders</div>
                <div className="text-xs text-orange-600">{formatPercent(surrenderRate)}</div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {formatNumber(stats.totalHands - stats.doubles - stats.splits - stats.surrenders)}
                </div>
                <div className="text-sm text-gray-600 font-medium">Hit/Stand</div>
                <div className="text-xs text-gray-600">
                  {formatPercent(((stats.totalHands - stats.doubles - stats.splits - stats.surrenders) / stats.totalHands) * 100)}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="counting" className="space-y-6">
          <TrueCountWinRates trueCountStats={stats.trueCountStats || {}} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}