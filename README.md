# Systems Thinking Viewer

An interactive, browser-based editor for building and exploring **stock-and-flow** (system dynamics) diagrams. Load models from templates or CSV data, wire up stocks, flows and variables on a canvas, run simulations, and get AI suggestions for improving the model.

The default domain is indie game development (player acquisition, monetization, budgets). Other domains are partly scaffolded.

Built with React 19, TypeScript, Vite, [React Flow](https://reactflow.dev/), D3, Tailwind CSS and [sd.js](https://github.com/bpowers/sd.js).

## Features

- **Canvas editor.** Drag, connect, edit and delete stock (blue), flow (green) and variable (purple) nodes.
- **Domains.** Switch domains in the header to get that domain's node types and data sources:
  - 🎮 Game Development
  - 🚀 Startup Business
  - 📦 Supply Chain
  - 🌳 Environmental Systems
- **Data sources** (left sidebar):
  - *Game Dev Ecosystem*: a complete JSON model with stocks, flows, variables and weighted edges.
  - *Monetization Analysis*: a CSV of revenue streams, shown as a D3 revenue chart with summary metrics.
  - *Upload CSV Data*: your own monetization or sales CSV.
  - *Steam API*: currently returns **mock** platform data (Steam, Epic, itch.io, Google Play, App Store).
- **Properties panel** (right sidebar): edit a selected node's label, value, rate and unit, and view revenue charts and simulation results.
- **Auto Layout.** Tries hierarchical, directional, force-directed, grid and circular layouts, then keeps the one with the fewest overlaps and best edge lengths.
- **Simulation.** Runs an XMILE model through sd.js and writes final values back to nodes whose labels match variable names.
- **AI suggestions.** Sends the current graph to an LLM (DeepSeek) and gets back suggested connections, nodes, data sources and insights. You can apply most of them with one click. With no API key set, it returns mock suggestions.
- **Persistence.** Save and load the graph in browser `localStorage`, or export and import it as JSON.
- **Undo, copy and paste.** Keyboard shortcuts are listed below.

## Getting Started

Requires Node.js 20+.

```bash
npm install
npm run dev       # start dev server at http://localhost:5173
npm run build     # type-check and build to dist/
npm run preview   # serve the production build
npm run lint      # run ESLint
```

### LLM API key (optional)

To get real AI suggestions instead of mock ones, provide a [DeepSeek](https://platform.deepseek.com/) API key in one of two ways:

1. Add it to `.env.local` (which git ignores):
   ```
   VITE_DEEPSEEK_API_KEY=your-key-here
   ```
2. Or paste it into the AI suggestions panel in the app. A key entered there is saved to `localStorage`.

> **Note:** Vite inlines `VITE_*` variables into the client bundle, and the browser calls the API directly. Use this setup only for local or personal use. Don't deploy a build that contains your key.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Delete` / `Backspace` | Delete selected nodes |
| `Ctrl/Cmd + C` or `C` | Copy selected nodes |
| `Ctrl/Cmd + V` or `V` | Paste |
| `Ctrl/Cmd + A` | Select all nodes |
| `Ctrl/Cmd + Z` | Undo |
| `Esc` | Clear focus and return to the canvas |

## Project Structure

```
public/data/                 Runtime-loaded models and data
  gameDevEcosystem.json      Game dev ecosystem model
  gameDevMonetization.csv    Monetization template
  hares_and_foxes.xmile      Sample XMILE model used by "Run Simulation"
src/
  App.tsx                    App shell and domain selector
  components/
    SystemsViewer.tsx        Canvas, state, history, shortcuts, simulation and LLM wiring
    LeftSidebar.tsx          Data sources and "Add Elements" palette
    RightPropertiesPanel.tsx Node properties, persistence, simulation and AI suggestions
    DataSourceManager.tsx    Loads templates, CSVs and (mock) API data
    charts/RevenueChart.tsx  D3 revenue bar chart
    nodes/                   Custom React Flow nodes (Stock, Flow, Variable)
  utils/
    domains.ts               Domain definitions: node types, data sources, templates, tools
    dataParser.ts            CSV/JSON parsing and conversion to nodes
    graphLayout.ts           Layout algorithms and layout quality scoring
    simulation.ts            sd.js wrapper (SystemDynamicsSimulator)
    llmService.ts            DeepSeek client, prompt building, mock suggestions
```

See [DATA_SOURCES.md](DATA_SOURCES.md) for data formats, schemas and how to add new sources.

## Adding a Domain

Add an entry to `DOMAINS` in [src/utils/domains.ts](src/utils/domains.ts) with its `nodeTypes`, `dataSources` and `templates`. Each node type maps to one of the three base types (`stock`, `flow` or `variable`). The new domain then appears in the header dropdown and the sidebar.

## Current Limitations

- **Run Simulation** always loads the bundled `hares_and_foxes.xmile` sample. It does not generate a model from the graph on the canvas yet (`createXmileFromGraph` is a stub).
- The **Pause** and **Reset** simulation buttons are placeholders.
- The **Steam API** source returns mock data, and the Market Data API is a placeholder URL.
- Only the Game Development domain has working data sources. The Startup Business domain references `startupFinancials.csv`, which doesn't exist yet.
