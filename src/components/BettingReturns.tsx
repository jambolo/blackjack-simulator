import { Card } from "@/components/ui/card";
import { TrueCountStats } from "@/lib/types";

interface BettingReturnsProps {
  trueCountStats: Record<number, TrueCountStats>;
}

export function BettingReturns({ trueCountStats }: BettingReturnsProps) {
  const safeStats = trueCountStats || {};
  
  const allData = Object.entries(safeStats)
    .map(([count, stats]) => ({
      trueCount: parseInt(count),
      hands: stats.hands,
      betAmount: stats.betAmount,
      avgWinPerHand: stats.hands > 0 ? stats.netWinnings / stats.hands : 0,
      totalReturns: stats.totalReturns,
    }))
    .filter(item => item.hands >= 10)
    .sort((a, b) => a.trueCount - b.trueCount);

  const totalReturns = allData.reduce((sum, item) => sum + item.totalReturns, 0);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Betting Returns by True Count</h3>
        <div className="text-sm text-muted-foreground mb-4">
          <p>Simulated betting returns using card counting strategy</p>
          <div className="mt-2 bg-muted p-3 rounded-lg space-y-1 text-xs">
            <div className="font-semibold">Betting Strategy:</div>
            <div>• True Count ≤ -3: Bet = 0 (no play)</div>
            <div>• True Count -2, -1, 0: Bet = 0.5 units</div>
            <div>• True Count ≥ 1: Bet = True Count units</div>
          </div>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg mb-4">
          <div className="text-sm text-muted-foreground">Total Returns</div>
          <div className={`text-2xl font-bold ${totalReturns >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {totalReturns >= 0 ? '+' : ''}{totalReturns.toFixed(2)} units
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">True Count</th>
              <th className="text-right py-2 px-2">Hands</th>
              <th className="text-right py-2 px-2">Bet Size</th>
              <th className="text-right py-2 px-2">Avg Win/Hand</th>
              <th className="text-right py-2 px-2">Total Returns</th>
            </tr>
          </thead>
          <tbody>
            {allData.map((item) => (
              <tr 
                key={item.trueCount} 
                className="border-b border-border/50 hover:bg-muted/50"
              >
                <td className="py-2 px-2 font-medium">{item.trueCount}</td>
                <td className="text-right py-2 px-2">{item.hands.toLocaleString()}</td>
                <td className="text-right py-2 px-2">{item.betAmount.toFixed(1)}</td>
                <td className={`text-right py-2 px-2 ${item.avgWinPerHand >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {item.avgWinPerHand >= 0 ? '+' : ''}{item.avgWinPerHand.toFixed(4)}
                </td>
                <td className={`text-right py-2 px-2 font-medium ${item.totalReturns >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {item.totalReturns >= 0 ? '+' : ''}{item.totalReturns.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 font-bold">
              <td className="py-2 px-2">Total</td>
              <td className="text-right py-2 px-2">{allData.reduce((sum, item) => sum + item.hands, 0).toLocaleString()}</td>
              <td className="text-right py-2 px-2">—</td>
              <td className="text-right py-2 px-2">—</td>
              <td className={`text-right py-2 px-2 ${totalReturns >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {totalReturns >= 0 ? '+' : ''}{totalReturns.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {allData.length === 0 && (
        <div className="h-32 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">Run a simulation to see betting returns by true count</div>
          </div>
        </div>
      )}
    </Card>
  );
}
