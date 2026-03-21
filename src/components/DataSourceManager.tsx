import React, { useState } from 'react';
import { parseCSVData, calculateMonetizationMetrics, loadGameDevEcosystem, convertToFlowNodes } from '../utils/dataParser';
import type { Node, Edge } from 'reactflow';

interface DataSourceManagerProps {
  onDataLoaded: (nodes: Node[], edges: Edge[]) => void;
  onMonetizationDataLoaded: (data: any) => void;
}

const DataSourceManager: React.FC<DataSourceManagerProps> = ({ 
  onDataLoaded, 
  onMonetizationDataLoaded 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  const handleLoadGameDevEcosystem = async () => {
    setLoading(true);
    setError(null);
    setActiveSource('game-dev-ecosystem');
    
    try {
      const ecosystem = await loadGameDevEcosystem();
      const { nodes, edges } = convertToFlowNodes(ecosystem);
      onDataLoaded(nodes, edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game dev ecosystem');
    } finally {
      setLoading(false);
    }
  };

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

  const handleMockAPICall = async () => {
    setLoading(true);
    setError(null);
    setActiveSource('mock-api');
    
    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mock API call failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMonetizationTemplate = async () => {
    setLoading(true);
    setError(null);
    setActiveSource('monetization-template');
    
    try {
      const response = await fetch('/data/gameDevMonetization.csv');
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

      const edges: Edge[] = [];
      onDataLoaded(nodes, edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-700">Game Dev Data Sources</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleLoadGameDevEcosystem}
          disabled={loading}
          className={`w-full text-left px-4 py-3 rounded border flex items-center justify-between ${
            activeSource === 'game-dev-ecosystem'
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center mr-3">
              <span className="text-blue-600">🎮</span>
            </div>
            <div>
              <div className="font-medium">Game Dev Ecosystem</div>
              <div className="text-sm text-gray-600">Complete indie game dev model with stocks & flows</div>
            </div>
          </div>
          {loading && activeSource === 'game-dev-ecosystem' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </button>

        <label className={`block w-full text-left px-4 py-3 rounded border cursor-pointer ${
          activeSource === 'csv-upload'
            ? 'bg-green-50 border-green-300'
            : 'bg-white border-gray-300 hover:bg-gray-50'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center mr-3">
                <span className="text-green-600">📊</span>
              </div>
              <div>
                <div className="font-medium">Upload CSV Data</div>
                <div className="text-sm text-gray-600">Monetization, sales, or user metrics</div>
              </div>
            </div>
            {loading && activeSource === 'csv-upload' && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            )}
          </div>
        </label>

        <button
          onClick={handleLoadMonetizationTemplate}
          disabled={loading}
          className={`w-full text-left px-4 py-3 rounded border flex items-center justify-between ${
            activeSource === 'monetization-template'
              ? 'bg-purple-50 border-purple-300'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center mr-3">
              <span className="text-purple-600">💰</span>
            </div>
            <div>
              <div className="font-medium">Monetization Template</div>
              <div className="text-sm text-gray-600">Pre-built revenue stream analysis</div>
            </div>
          </div>
          {loading && activeSource === 'monetization-template' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          )}
        </button>

        <button
          onClick={handleMockAPICall}
          disabled={loading}
          className={`w-full text-left px-4 py-3 rounded border flex items-center justify-between ${
            activeSource === 'mock-api'
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center mr-3">
              <span className="text-yellow-600">🌐</span>
            </div>
            <div>
              <div className="font-medium">Platform Analytics API</div>
              <div className="text-sm text-gray-600">Mock sales data from game platforms</div>
            </div>
          </div>
          {loading && activeSource === 'mock-api' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
          )}
        </button>
      </div>

      {loading && (
        <div className="text-center text-gray-600 text-sm">
          Loading data... This may take a moment.
        </div>
      )}
    </div>
  );
};

export default DataSourceManager;