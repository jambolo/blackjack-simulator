import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BlackjackRules, VALID_PENETRATIONS, DEFAULT_RULES } from "@/lib/types";
import { Gear } from "@phosphor-icons/react";

interface RuleConfigurationProps {
  rules: BlackjackRules;
  onRulesChange: (rules: BlackjackRules) => void;
}

export function RuleConfiguration({ rules, onRulesChange }: RuleConfigurationProps) {
  const updateRule = <K extends keyof BlackjackRules>(key: K, value: BlackjackRules[K]) => {
    const newRules = { ...rules, [key]: value };
    
    // Auto-adjust penetration if deck count changes
    if (key === 'deckCount') {
      const validPenetrations = VALID_PENETRATIONS[value as BlackjackRules['deckCount']];
      if (validPenetrations.length > 0 && !validPenetrations.includes(rules.penetration)) {
        newRules.penetration = validPenetrations[validPenetrations.length - 1] as 0.5 | 1 | 1.5 | 2;
      }
    }
    
    onRulesChange(newRules);
  };

  const resetToDefaults = () => {
    onRulesChange(DEFAULT_RULES);
  };

  const validPenetrations = VALID_PENETRATIONS[rules.deckCount];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gear className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Game Rules Configuration</h2>
        </div>
        <button
          onClick={resetToDefaults}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-primary">Deck Configuration</h3>
          
          <div className="space-y-2">
            <Label htmlFor="deck-count">Number of Decks</Label>
            <Select
              value={rules.deckCount.toString()}
              onValueChange={(value) => updateRule('deckCount', value === 'continuous' ? 'continuous' : parseInt(value) as 1 | 2 | 6)}
            >
              <SelectTrigger id="deck-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Single Deck</SelectItem>
                <SelectItem value="2">Double Deck</SelectItem>
                <SelectItem value="6">6-Deck Shoe</SelectItem>
                <SelectItem value="continuous">6-Deck Continuous Shuffle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rules.deckCount !== 'continuous' && (
            <div className="space-y-2">
              <Label htmlFor="penetration">Deck Penetration</Label>
              <Select
                value={rules.penetration.toString()}
                onValueChange={(value) => updateRule('penetration', parseFloat(value) as 0.5 | 1 | 1.5 | 2)}
              >
                <SelectTrigger id="penetration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {validPenetrations.map((penetration) => (
                    <SelectItem key={penetration} value={penetration.toString()}>
                      {penetration === 0.5 ? '1/2 Deck' : `${penetration} Deck${penetration > 1 ? 's' : ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-primary">Player & Dealer Rules</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="dealer-soft-17" className="text-sm">
                Dealer Hits Soft 17
              </Label>
              <Switch
                id="dealer-soft-17"
                checked={rules.dealerHitsSoft17}
                onCheckedChange={(checked) => updateRule('dealerHitsSoft17', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="double-after-split" className="text-sm">
                Double After Split (DAS)
              </Label>
              <Switch
                id="double-after-split"
                checked={rules.doubleAfterSplit}
                onCheckedChange={(checked) => updateRule('doubleAfterSplit', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="resplit-aces" className="text-sm">
                Resplit Aces (RSA)
              </Label>
              <Switch
                id="resplit-aces"
                checked={rules.resplitAces}
                onCheckedChange={(checked) => updateRule('resplitAces', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="hit-split-aces" className="text-sm">
                Hit After Split Aces (HSA)
              </Label>
              <Switch
                id="hit-split-aces"
                checked={rules.hitAfterSplitAces}
                onCheckedChange={(checked) => updateRule('hitAfterSplitAces', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="late-surrender" className="text-sm">
                Late Surrender (LS)
              </Label>
              <Switch
                id="late-surrender"
                checked={rules.lateSurrender}
                onCheckedChange={(checked) => updateRule('lateSurrender', checked)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <h3 className="font-medium text-primary">Rule Summary</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Dealer checks for blackjack (American style)</p>
            <p>• Split up to 4 hands</p>
            <p>• Double on any first two cards</p>
            <p>• Blackjack pays 3:2</p>
            <p>• Basic strategy play</p>
          </div>
        </div>
      </div>
    </Card>
  );
}