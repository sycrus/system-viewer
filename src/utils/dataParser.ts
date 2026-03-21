import * as Papa from 'papaparse';

export interface MonetizationData {
  revenue_stream: string;
  monthly_revenue: number;
  user_base: number;
  conversion_rate: number;
  cost_per_user: number;
}

export interface GameDevNode {
  id: string;
  type: string;
  label: string;
  value: number;
  unit: string;
  description: string;
}

export interface GameDevEdge {
  source: string;
  target: string;
  label: string;
  strength: number;
}

export interface GameDevEcosystem {
  nodes: GameDevNode[];
  edges: GameDevEdge[];
}

export const parseCSVData = (csvText: string): MonetizationData[] => {
  const result = Papa.parse<MonetizationData>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (header: string) => header.toLowerCase().trim(),
  });

  if (result.errors.length > 0) {
    console.error('CSV parsing errors:', result.errors);
    throw new Error('Failed to parse CSV data');
  }

  return result.data;
};

export const loadGameDevEcosystem = async (): Promise<GameDevEcosystem> => {
  try {
    const response = await fetch('/data/gameDevEcosystem.json');
    if (!response.ok) {
      throw new Error(`Failed to load ecosystem data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading game dev ecosystem:', error);
    throw error;
  }
};

export const calculateMonetizationMetrics = (data: MonetizationData[]) => {
  const totalRevenue = data.reduce((sum, item) => sum + item.monthly_revenue, 0);
  const totalUsers = data.reduce((sum, item) => sum + item.user_base, 0);
  const averageConversion = data.reduce((sum, item) => sum + item.conversion_rate, 0) / data.length;
  const averageCPC = data.reduce((sum, item) => sum + item.cost_per_user, 0) / data.length;

  const revenueShare = data.map(item => ({
    stream: item.revenue_stream,
    share: (item.monthly_revenue / totalRevenue) * 100,
    revenue: item.monthly_revenue,
  }));

  return {
    totalRevenue,
    totalUsers,
    averageConversion,
    averageCPC,
    revenueShare,
    streams: data,
  };
};

export const convertToFlowNodes = (ecosystem: GameDevEcosystem) => {
  const nodes = ecosystem.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: { 
      x: Math.random() * 800 + 100, 
      y: Math.random() * 600 + 100 
    },
    data: {
      label: node.label,
      value: node.value,
      unit: node.unit,
      description: node.description,
    },
  }));

  const edges = ecosystem.edges.map((edge, index) => ({
    id: `e${index + 1}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: Math.abs(edge.strength) > 0.3,
    style: { 
      strokeWidth: Math.abs(edge.strength) * 3 + 1,
      stroke: edge.strength > 0 ? '#10b981' : '#ef4444',
    },
    data: { strength: edge.strength },
  }));

  return { nodes, edges };
};