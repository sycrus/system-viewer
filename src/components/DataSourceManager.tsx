import React, { useState, useEffect } from 'react';
import { parseCSVData, calculateMonetizationMetrics, loadGameDevEcosystem, convertToFlowNodes } from '../utils/dataParser';
import type { Node, Edge } from 'reactflow';
import { getDataSources, getDomain, type DataSource } from '../utils/domains';

export interface MonetizationData {
  totalRevenue?: number;
  totalUsers?: number;
  revenueShare?: Array<{stream: string, share: number, revenue: number}>;
  platforms?: Array<{name: string, revenue: number, users: number}>;
  timePeriod?: string;
}

interface DataSourceManagerProps {
  onDataLoaded: (nodes: Node[], edges: Edge[]) => void;
  onMonetizationDataLoaded: (data: MonetizationData) => void;
  currentDomainId: string;
}

const DataSourceManager: React.FC<DataSourceManagerProps> = ({ 
  onDataLoaded, 
  onMonetizationDataLoaded,
  currentDomainId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [domainDataSources, setDomainDataSources] = useState(getDataSources(currentDomainId));

  useEffect(() => {
    setDomainDataSources(getDataSources(currentDomainId));
  }, [currentDomainId]);



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setActiveSource('csv-upload');
    
    try {
      const text = await file.text();
      const data = parseCSVData(text);
      const metrics = calculateMonetizationMetrics(data);
      
      onMonetizationDataLoaded(metrics);
      
      const nodes: Node[] = data.map((item, index) => ({
        id: `revenue_${index}`,
        type: 'stock',
        position: { x: 100 + index * 150, y: 100 },
        data: {
          label: item.revenue_stream,
          value: item.monthly_revenue,
          unit: 'USD/month',
          description: `Users: ${item.user_base}, Conversion: ${(item.conversion_rate * 100).toFixed(1)}%`,
        },
      }));

      const edges: Edge[] = data.map((_, index) => ({
        id: `flow_${index}`,
        source: `revenue_${index}`,
        target: 'player_base',
        label: 'generates',
        animated: true,
        style: { strokeWidth: 2 },
      }));

      onDataLoaded(nodes, edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setLoading(false);
    }
  };





  const handleDataSourceActivate = async (dataSource: DataSource) => {
    setLoading(true);
    setError(null);
    setActiveSource(dataSource.id);
    
    try {
      switch (dataSource.type) {
        case 'template': {
          if (dataSource.id === 'game-dev-ecosystem') {
            const ecosystem = await loadGameDevEcosystem();
            const { nodes, edges } = convertToFlowNodes(ecosystem);
            onDataLoaded(nodes, edges);
          } else if (dataSource.id === 'monetization-template') {
            const response = await fetch((dataSource.config as { filePath: string }).filePath);
            if (!response.ok) throw new Error('Failed to load template');
            const text = await response.text();
            const data = parseCSVData(text);
            const metrics = calculateMonetizationMetrics(data);
            onMonetizationDataLoaded(metrics);
            const nodes: Node[] = data.map((item, index) => ({
              id: `monetization_${index}`,
              type: 'stock',
              position: { x: 100 + index * 160, y: 500 },
              data: {
                label: item.revenue_stream,
                value: item.monthly_revenue,
                unit: 'USD/month',
                description: `CPC: $${item.cost_per_user.toFixed(2)}, Users: ${item.user_base.toLocaleString()}`,
              },
            }));
            onDataLoaded(nodes, []);
          }
          break;
        }
        case 'csv':
          // CSV upload is handled via file input, not button
          break;
        case 'api': {
          // For now, use mock API
          await new Promise(resolve => setTimeout(resolve, 1000));
          const mockData = {
            platforms: [
              { name: 'Steam', revenue: 45000, users: 7500 },
              { name: 'Epic Games', revenue: 28000, users: 4200 },
              { name: 'itch.io', revenue: 12000, users: 3100 },
              { name: 'Google Play', revenue: 35000, users: 12500 },
              { name: 'App Store', revenue: 42000, users: 11000 },
            ],
            timePeriod: 'Last 30 days',
            totalRevenue: 162000,
            totalUsers: 38300,
          };
          onMonetizationDataLoaded(mockData);
          const nodes: Node[] = mockData.platforms.map((platform, index) => ({
            id: `platform_${index}`,
            type: 'variable',
            position: { x: 100 + index * 180, y: 300 },
            data: {
              label: platform.name,
              value: platform.revenue,
              unit: 'USD/month',
              description: `${platform.users.toLocaleString()} users`,
            },
          }));
          const edges: Edge[] = mockData.platforms.map((platform, index) => ({
            id: `platform_flow_${index}`,
            source: `platform_${index}`,
            target: 'revenue_generation',
            label: 'contributes',
            animated: true,
            style: { strokeWidth: Math.sqrt(platform.revenue / 1000) },
          }));
          onDataLoaded(nodes, edges);
          break;
        }
        case 'mock':
          // Use mock data
          break;
        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data source');
    } finally {
      setLoading(false);
    }
  };

  const domain = getDomain(currentDomainId);
  
  const iconMap: Record<string, string> = {
    'game-dev-ecosystem': '🎮',
    'monetization-template': '💰',
    'steam-api': '🎮',
    'csv-upload': '📊',
    'mock-api': '🌐',
    'financial-template': '💰',
    'market-data': '📈',
  };
  
  const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string, border: string, text: string }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-600' },
      red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600' },
      emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-600' },
    };
    return map[color] || map.blue;
  };
  
  const domainColorClasses = getColorClasses(domain.color);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">{domain.name} Data Sources</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

       <div className="space-y-3">
        {domainDataSources.map((dataSource) => {
          const icon = iconMap[dataSource.id] || '📄';
          const isActive = activeSource === dataSource.id;
          const { bg, border, text } = domainColorClasses;
          
          if (dataSource.type === 'csv') {
            return (
              <label
                key={dataSource.id}
                className={`block w-full text-left px-4 py-3 rounded border cursor-pointer ${
                  isActive
                    ? `${bg} ${border}`
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="file"
                  accept={(dataSource.config as { accept?: string })?.accept || '.csv,.txt'}
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="hidden"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded ${bg.replace('-50', '-100')} flex items-center justify-center mr-3`}>
                      <span className={text}>{icon}</span>
                    </div>
                    <div>
                      <div className="font-medium">{dataSource.name}</div>
                       <div className="text-xs text-gray-600">{dataSource.description}</div>
                    </div>
                  </div>
                  {loading && isActive && (
                    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${text}`}></div>
                  )}
                </div>
              </label>
            );
          }
          
          return (
            <button
              key={dataSource.id}
              onClick={() => handleDataSourceActivate(dataSource)}
              disabled={loading}
              className={`w-full text-left px-4 py-3 rounded border flex items-center justify-between ${
                isActive
                  ? `${bg} ${border}`
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded ${bg.replace('-50', '-100')} flex items-center justify-center mr-3`}>
                  <span className={text}>{icon}</span>
                </div>
                <div>
                  <div className="font-medium">{dataSource.name}</div>
                   <div className="text-xs text-gray-600">{dataSource.description}</div>
                </div>
              </div>
              {loading && isActive && (
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${text}`}></div>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
         <div className="text-center text-gray-600 text-xs">
          Loading data... This may take a moment.
        </div>
      )}
    </div>
  );
};

export default DataSourceManager;