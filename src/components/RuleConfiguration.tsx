import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { BlackjackRules, VALID_PENETRATIONS, DEFAULT_RULES } from "@/lib/types";

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
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <SettingsIcon color="primary" />
            <Typography variant="h6">Game Rules Configuration</Typography>
          </Stack>
          <Button variant="text" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle1" color="primary">
              Deck Configuration
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="deck-count-label">Number of Decks</InputLabel>
              <Select
                labelId="deck-count-label"
                id="deck-count"
                value={rules.deckCount}
                label="Number of Decks"
                onChange={(event) => updateRule('deckCount', Number(event.target.value) as 1 | 2 | 6)}
              >
                <MenuItem value={1}>Single Deck</MenuItem>
                <MenuItem value={2}>Double Deck</MenuItem>
                <MenuItem value={6}>6-Deck Shoe</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="penetration-label">Deck Penetration</InputLabel>
              <Select
                labelId="penetration-label"
                id="penetration"
                value={rules.penetration}
                label="Deck Penetration"
                onChange={(event) => updateRule('penetration', Number(event.target.value) as 0.5 | 1 | 1.5 | 2)}
              >
                {validPenetrations.map((penetration) => (
                  <MenuItem key={penetration} value={penetration}>
                    {penetration === 0.5 ? '1/2 Deck' : `${penetration} Deck${penetration > 1 ? 's' : ''}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle1" color="primary">
              Player and Dealer Rules
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  id="dealer-soft-17"
                  checked={rules.dealerHitsSoft17}
                  onChange={(_, checked) => updateRule('dealerHitsSoft17', checked)}
                />
              }
              label="Dealer Hits Soft 17"
            />
            <FormControlLabel
              control={
                <Switch
                  id="double-after-split"
                  checked={rules.doubleAfterSplit}
                  onChange={(_, checked) => updateRule('doubleAfterSplit', checked)}
                />
              }
              label="Double After Split (DAS)"
            />
            <FormControlLabel
              control={
                <Switch
                  id="resplit-aces"
                  checked={rules.resplitAces}
                  onChange={(_, checked) => updateRule('resplitAces', checked)}
                />
              }
              label="Resplit Aces (RSA)"
            />
            <FormControlLabel
              control={
                <Switch
                  id="hit-split-aces"
                  checked={rules.hitAfterSplitAces}
                  onChange={(_, checked) => updateRule('hitAfterSplitAces', checked)}
                />
              }
              label="Hit After Split Aces (HSA)"
            />
            <FormControlLabel
              control={
                <Switch
                  id="late-surrender"
                  checked={rules.lateSurrender}
                  onChange={(_, checked) => updateRule('lateSurrender', checked)}
                />
              }
              label="Late Surrender (LS)"
            />
          </Stack>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
            Rule Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">Dealer checks for blackjack (American style)</Typography>
          <Typography variant="body2" color="text.secondary">Split up to 4 hands</Typography>
          <Typography variant="body2" color="text.secondary">Double on any first two cards</Typography>
          <Typography variant="body2" color="text.secondary">Blackjack pays 3:2</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}