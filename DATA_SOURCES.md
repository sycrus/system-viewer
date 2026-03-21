# Indie Game Dev Data Sources

This systems thinking viewer includes several data sources specifically focused on indie game development ecosystems and monetization methods.

## Available Data Sources

### 1. Game Dev Ecosystem Template
**Location:** `src/data/gameDevEcosystem.json`
**Description:** A complete system dynamics model for indie game development with:
- **Stocks:** Player Base, Development Budget, Marketing Budget
- **Flows:** Player Acquisition, Player Churn, Revenue Generation, Development Cost, Marketing Spend
- **Variables:** Game Quality, Community Engagement, Review Score, Retention Rate

**Usage:** Click "Game Dev Ecosystem" in the Data Sources panel to load this complete model.

### 2. Monetization Template
**Location:** `src/data/gameDevMonetization.csv`
**Description:** Sample revenue stream data for indie games:
- Premium Sales
- In-App Purchases
- Subscriptions
- Ad Revenue
- DLC Content
- Crowdfunding
- Merchandise
- Licensing

**Columns:** revenue_stream, monthly_revenue, user_base, conversion_rate, cost_per_user
**Usage:** Click "Monetization Template" to load pre-built revenue analysis.

### 3. CSV Import
**Format:** CSV files with headers matching the monetization template or custom data.
**Supported Columns:**
- Any numeric data that can be mapped to stocks, flows, or variables
- First column treated as label/name
- Subsequent columns as values

**Usage:** Upload your own CSV files via the "Upload CSV Data" button.

### 4. Platform Analytics API (Mock)
**Description:** Simulated API response with platform sales data:
- Steam, Epic Games, itch.io, Google Play, App Store
- Revenue and user metrics
- Time-series data simulation

**Usage:** Click "Platform Analytics API" for mock platform data.

## Data Integration Features

### Automatic Node Creation
- CSV data creates Stock nodes with revenue values
- Ecosystem JSON creates complete network with relationships
- API data creates Variable nodes with platform metrics

### Visualization
- **Revenue Chart:** D3-based bar chart showing revenue distribution
- **Node Colors:** 
  - Blue: Stock/reservoir nodes
  - Green: Flow/rate nodes  
  - Purple: Variable/converter nodes
- **Edge Styling:** Thickness based on relationship strength, color based on polarity

### Monetization Insights
- Total revenue calculation
- User base aggregation
- Revenue share percentages
- Cost-per-user averages

## Extending Data Sources

### Adding New CSV Templates
1. Create CSV file in `src/data/` directory
2. Update `dataParser.ts` to handle new format
3. Add import option in `DataSourceManager.tsx`

### Connecting Real APIs
1. Add API service in `src/services/` directory
2. Implement authentication/request logic
3. Add data transformation to node/edge format
4. Add UI option in DataSourceManager

### Custom Ecosystem Models
1. Create JSON file following `GameDevEcosystem` interface
2. Define nodes with types: "stock", "flow", "variable"
3. Define edges with source, target, label, and strength
4. Add load function in dataParser.ts

## Example Use Cases

### 1. Revenue Stream Analysis
- Load monetization template
- Compare different revenue models
- Identify most profitable streams
- Analyze user conversion rates

### 2. Development Budget Planning
- Load game dev ecosystem
- Simulate budget allocation
- Track player acquisition costs
- Forecast revenue generation

### 3. Platform Performance Comparison
- Use mock API data
- Compare platform revenue
- Analyze user demographics
- Plan multi-platform strategy

### 4. Custom Game Metrics
- Upload your own CSV data
- Create custom node types
- Define relationship strengths
- Run system dynamics simulations

## Data Schema

### Node Types
```typescript
interface GameDevNode {
  id: string;
  type: 'stock' | 'flow' | 'variable';
  label: string;
  value: number;
  unit: string;
  description: string;
}
```

### Edge Types
```typescript
interface GameDevEdge {
  source: string;
  target: string;
  label: string;
  strength: number; // -1 to 1, negative for inhibitory relationships
}
```

### Monetization Data
```typescript
interface MonetizationData {
  revenue_stream: string;
  monthly_revenue: number;
  user_base: number;
  conversion_rate: number;
  cost_per_user: number;
}
```