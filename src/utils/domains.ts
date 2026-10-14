export interface Domain {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  dataSources: DataSource[];
  nodeTypes: NodeType[];
  templates: Template[];
  apiEndpoints?: ApiEndpoint[];
  analysisTools: AnalysisTool[];
}

export interface DataSource {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'csv' | 'json' | 'template' | 'mock';
  config: Record<string, unknown>;
}

export interface NodeType {
  id: string;
  name: string;
  description: string;
  color: string;
  defaultUnit?: string;
  baseType: 'stock' | 'flow' | 'variable';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  filePath: string;
  nodeCount: number;
  edgeCount: number;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  requiresAuth: boolean;
  description: string;
}

export interface AnalysisTool {
  id: string;
  name: string;
  description: string;
  component?: string;
  parameters: AnalysisParameter[];
}

export interface AnalysisParameter {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  defaultValue: unknown;
  options?: string[];
}

// Define domains
export const DOMAINS: Record<string, Domain> = {
  'game-development': {
    id: 'game-development',
    name: 'Game Development',
    description: 'Prototyping and analysis for indie game development',
    icon: '🎮',
    color: 'blue',
    dataSources: [
      {
        id: 'steam-api',
        name: 'Steam API',
        description: 'Real-time Steam store and player data',
        type: 'api',
        config: {
          baseUrl: 'https://api.steampowered.com',
          endpoints: ['GetNumberOfCurrentPlayers', 'GetNewsForApp', 'GetGlobalAchievementPercentagesForApp']
        }
      },
      {
        id: 'game-dev-ecosystem',
        name: 'Game Dev Ecosystem',
        description: 'Complete indie game development model',
        type: 'template',
        config: { filePath: '/data/gameDevEcosystem.json' }
      },
      {
        id: 'monetization-template',
        name: 'Monetization Analysis',
        description: 'Revenue stream analysis template',
        type: 'template',
        config: { filePath: '/data/gameDevMonetization.csv' }
      },
      {
        id: 'csv-upload',
        name: 'Upload CSV Data',
        description: 'Custom monetization or sales data',
        type: 'csv',
        config: { accept: '.csv,.txt' }
      }
    ],
    nodeTypes: [
      {
        id: 'stock',
        name: 'Stock (Reservoir)',
        description: 'Accumulated resource or population',
        color: 'blue',
        defaultUnit: 'units',
        baseType: 'stock'
      },
      {
        id: 'flow',
        name: 'Flow (Rate)',
        description: 'Rate of change between stocks',
        color: 'green',
        defaultUnit: 'units/time',
        baseType: 'flow'
      },
      {
        id: 'variable',
        name: 'Variable (Converter)',
        description: 'Intermediate calculation or parameter',
        color: 'purple',
        defaultUnit: 'value',
        baseType: 'variable'
      }
    ],
    templates: [
      {
        id: 'basic-game-dev',
        name: 'Basic Game Dev Model',
        description: 'Simple player acquisition and monetization',
        filePath: '/data/gameDevEcosystem.json',
        nodeCount: 12,
        edgeCount: 13
      },
      {
        id: 'monetization-analysis',
        name: 'Monetization Analysis',
        description: 'Revenue stream performance tracking',
        filePath: '/data/gameDevMonetization.csv',
        nodeCount: 8,
        edgeCount: 0
      }
    ],
    apiEndpoints: [
      {
        id: 'steam-player-count',
        name: 'Steam Player Count',
        url: 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/',
        method: 'GET',
        requiresAuth: false,
        description: 'Get current player count for any Steam game'
      },
      {
        id: 'steam-game-details',
        name: 'Steam Game Details',
        url: 'https://store.steampowered.com/api/appdetails',
        method: 'GET',
        requiresAuth: false,
        description: 'Get detailed information about a Steam game'
      }
    ],
    analysisTools: [
      {
        id: 'genre-analysis',
        name: 'Genre Analysis',
        description: 'Analyze market size and competition for game genres',
        parameters: [
          {
            id: 'target-genre',
            name: 'Target Genre',
            type: 'select',
            defaultValue: 'Roguelike',
            options: ['Roguelike', 'Deckbuilder', 'Farming Sim', 'Platformer', 'Puzzle', 'Strategy']
          },
          {
            id: 'competition-threshold',
            name: 'Competition Threshold',
            type: 'number',
            defaultValue: 0.7
          }
        ]
      },
      {
        id: 'monetization-simulator',
        name: 'Monetization Simulator',
        description: 'Simulate revenue from different monetization strategies',
        parameters: [
          {
            id: 'price-point',
            name: 'Price Point',
            type: 'number',
            defaultValue: 19.99
          },
          {
            id: 'conversion-rate',
            name: 'Conversion Rate',
            type: 'number',
            defaultValue: 0.05
          },
          {
            id: 'player-count',
            name: 'Player Count',
            type: 'number',
            defaultValue: 10000
          }
        ]
      }
    ]
  },
  'startup-business': {
    id: 'startup-business',
    name: 'Startup Business',
    description: 'Business modeling and financial analysis for startups',
    icon: '🚀',
    color: 'green',
    dataSources: [
      {
        id: 'financial-template',
        name: 'Financial Model Template',
        description: 'Basic startup financial projections',
        type: 'template',
        config: { filePath: '/data/startupFinancials.csv' }
      },
      {
        id: 'market-data',
        name: 'Market Data API',
        description: 'Industry growth rates and market sizes',
        type: 'api',
        config: { baseUrl: 'https://api.marketdata.example.com' }
      }
    ],
    nodeTypes: [
      {
        id: 'revenue',
        name: 'Revenue Stream',
        description: 'Income from products or services',
        color: 'green',
        defaultUnit: 'USD/month',
        baseType: 'stock'
      },
      {
        id: 'cost',
        name: 'Cost Center',
        description: 'Business expenses and overhead',
        color: 'red',
        defaultUnit: 'USD/month',
        baseType: 'stock'
      },
      {
        id: 'customer',
        name: 'Customer Segment',
        description: 'Target customer group',
        color: 'blue',
        defaultUnit: 'customers',
        baseType: 'stock'
      },
      {
        id: 'metric',
        name: 'Business Metric',
        description: 'Key performance indicator',
        color: 'purple',
        defaultUnit: 'ratio',
        baseType: 'variable'
      }
    ],
    templates: [],
    analysisTools: [
      {
        id: 'break-even',
        name: 'Break-even Analysis',
        description: 'Calculate when business becomes profitable',
        parameters: [
          {
            id: 'fixed-costs',
            name: 'Fixed Costs',
            type: 'number',
            defaultValue: 50000
          },
          {
            id: 'variable-cost-per-unit',
            name: 'Variable Cost per Unit',
            type: 'number',
            defaultValue: 10
          },
          {
            id: 'price-per-unit',
            name: 'Price per Unit',
            type: 'number',
            defaultValue: 25
          }
        ]
      }
    ]
  },
  'supply-chain': {
    id: 'supply-chain',
    name: 'Supply Chain',
    description: 'Modeling logistics, inventory, and distribution networks',
    icon: '📦',
    color: 'orange',
    dataSources: [],
    nodeTypes: [
      {
        id: 'inventory',
        name: 'Inventory',
        description: 'Stock of goods or materials',
        color: 'blue',
        defaultUnit: 'units',
        baseType: 'stock'
      },
      {
        id: 'supplier',
        name: 'Supplier',
        description: 'Source of materials or components',
        color: 'green',
        defaultUnit: 'orders/week',
        baseType: 'flow'
      },
      {
        id: 'distribution',
        name: 'Distribution Center',
        description: 'Goods storage and distribution point',
        color: 'purple',
        defaultUnit: 'units/day',
        baseType: 'flow'
      },
      {
        id: 'demand',
        name: 'Demand Point',
        description: 'Customer demand location',
        color: 'red',
        defaultUnit: 'units/week',
        baseType: 'variable'
      }
    ],
    templates: [],
    analysisTools: []
  },
  'environmental': {
    id: 'environmental',
    name: 'Environmental Systems',
    description: 'Ecological and environmental impact modeling',
    icon: '🌳',
    color: 'emerald',
    dataSources: [],
    nodeTypes: [
      {
        id: 'population',
        name: 'Population',
        description: 'Biological population count',
        color: 'blue',
        defaultUnit: 'individuals',
        baseType: 'stock'
      },
      {
        id: 'resource',
        name: 'Resource',
        description: 'Natural resource stock',
        color: 'green',
        defaultUnit: 'units',
        baseType: 'stock'
      },
      {
        id: 'pollutant',
        name: 'Pollutant',
        description: 'Contaminant concentration',
        color: 'red',
        defaultUnit: 'ppm',
        baseType: 'stock'
      },
      {
        id: 'process',
        name: 'Process',
        description: 'Environmental transformation',
        color: 'purple',
        defaultUnit: 'rate',
        baseType: 'flow'
      }
    ],
    templates: [],
    analysisTools: []
  }
};

// Helper functions
export function getDomain(domainId: string): Domain {
  return DOMAINS[domainId] || DOMAINS['game-development'];
}

export function getAllDomains(): Domain[] {
  return Object.values(DOMAINS);
}

export function getDefaultNodeTypes(domainId: string): NodeType[] {
  return getDomain(domainId).nodeTypes;
}

export function getDataSources(domainId: string): DataSource[] {
  return getDomain(domainId).dataSources;
}