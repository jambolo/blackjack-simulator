# Blackjack Simulation Tool

A comprehensive blackjack simulation tool that allows users to test different rule variations across 1000 shoes to analyze statistical outcomes and optimize playing strategies.

**Experience Qualities**: 
1. **Analytical** - Provides detailed statistical insights with clear data presentation
2. **Professional** - Clean, casino-inspired interface that feels authoritative and trustworthy  
3. **Interactive** - Responsive controls that make rule configuration intuitive and immediate

**Complexity Level**: Light Application (multiple features with basic state)
- Multiple configurable rule variations with statistical analysis and data visualization

## Essential Features

### Rule Configuration Panel
- **Functionality**: Configure 7 different blackjack rule variations (deck count, penetration, dealer rules, player options)
- **Purpose**: Allow users to test different casino conditions and house rules
- **Trigger**: User selects from dropdown menus and toggles in configuration panel
- **Progression**: Select rule → See impact preview → Apply to simulation → Run analysis
- **Success Criteria**: All rule combinations work correctly and produce valid statistical outcomes

### Simulation Engine
- **Functionality**: Simulate 1000 complete shoes of blackjack with proper card counting and game flow
- **Purpose**: Generate statistically significant data for strategy analysis
- **Trigger**: User clicks "Run Simulation" after configuring rules
- **Progression**: Start simulation → Show progress → Process hands → Calculate statistics → Display results
- **Success Criteria**: Accurate blackjack gameplay with all rule variations properly implemented

### Statistical Dashboard
- **Functionality**: Display win/loss rates, house edge, hand distribution, and key performance metrics
- **Purpose**: Provide actionable insights for strategy optimization
- **Trigger**: Automatically displays after simulation completes
- **Progression**: Simulation completes → Process data → Generate charts → Show key metrics → Allow export
- **Success Criteria**: Clear, accurate statistical presentation with visual charts and key insights

### Progress Tracking
- **Functionality**: Real-time progress indicator during simulation with estimated completion time
- **Purpose**: Keep users engaged during longer simulation runs
- **Trigger**: Starts when simulation begins
- **Progression**: Initialize → Update progress → Show current statistics → Complete
- **Success Criteria**: Smooth progress updates without blocking the UI

## Edge Case Handling

- **Invalid Rule Combinations**: Validate rule combinations and show helpful error messages
- **Simulation Interruption**: Allow users to stop simulation mid-run and view partial results
- **Large Data Sets**: Efficiently handle and display statistics from 1000 shoes without performance issues
- **Rule Reset**: Provide easy way to reset to default casino rules

## Design Direction

The design should feel professional and casino-inspired with a focus on data clarity - clean lines, sophisticated color palette, and excellent typography hierarchy that makes complex statistical information easily digestible.

## Color Selection

Complementary (opposite colors) - Deep casino green paired with elegant gold accents to evoke professional gambling environments while maintaining excellent readability for data analysis.

- **Primary Color**: Deep Casino Green (oklch(0.35 0.12 150)) - Communicates sophistication and gambling heritage
- **Secondary Colors**: Charcoal Grey (oklch(0.25 0.02 270)) for cards and data backgrounds, Warm White (oklch(0.97 0.01 85)) for clean contrast
- **Accent Color**: Casino Gold (oklch(0.75 0.15 85)) - Attention-grabbing highlight for key statistics and call-to-action elements
- **Foreground/Background Pairings**: 
  - Background (Warm White #F8F8F6): Dark Charcoal (#3A3A3C) - Ratio 12.8:1 ✓
  - Card (Light Grey #F2F2F0): Dark Charcoal (#3A3A3C) - Ratio 11.2:1 ✓
  - Primary (Casino Green #2D5A3D): White (#FFFFFF) - Ratio 7.8:1 ✓
  - Accent (Casino Gold #C4963A): Dark Charcoal (#3A3A3C) - Ratio 4.9:1 ✓

## Font Selection

Typography should convey precision and professionalism with excellent readability for both configuration options and statistical data - using Inter for its clean lines and superior number rendering.

- **Typographic Hierarchy**: 
  - H1 (App Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter SemiBold/24px/normal spacing  
  - H3 (Configuration Groups): Inter Medium/18px/normal spacing
  - Body (Rules & Stats): Inter Regular/16px/relaxed line height
  - Data Labels: Inter Medium/14px/tight letter spacing
  - Large Numbers: Inter Bold/28px/tabular numbers

## Animations

Subtle and functional animations that enhance the analytical experience - smooth transitions between configuration states and satisfying progress indicators that communicate system reliability.

- **Purposeful Meaning**: Motion should reinforce the precision and reliability of the simulation engine
- **Hierarchy of Movement**: Configuration changes get subtle transitions, simulation progress gets prominent feedback, results appear with gentle reveal animations

## Component Selection

- **Components**: Card components for rule configuration sections, Progress bars for simulation tracking, Table components for statistical results, Tabs for organizing different result views, Select dropdowns for rule options, Toggle switches for boolean rules
- **Customizations**: Casino-themed card styling with subtle shadows, Custom progress indicator with percentage and ETA, Statistical dashboard with charts and key metrics
- **States**: Configuration controls show immediate preview of impact, simulation button shows loading state during run, results cards highlight significant findings
- **Icon Selection**: Settings gear for configuration, Play arrow for simulation start, Chart icons for statistics, Cards suit symbols for decoration
- **Spacing**: Generous padding in configuration cards (p-6), tight spacing in statistical tables (p-2), comfortable margins between sections (mb-8)
- **Mobile**: Stack configuration options vertically, simplify statistical dashboard to key metrics first, ensure touch-friendly control sizing