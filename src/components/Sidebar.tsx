import * as React from 'react';
import type { Node, Edge } from 'reactflow';
import DataSourceManager from './DataSourceManager';
import RevenueChart from './charts/RevenueChart';

interface SidebarProps {
  selectedNode: Node | null;
  onAddNode: (nodeType: string, data: any) => void;
  onDataLoaded: (nodes: Node[], edges: Edge[]) => void;
  onDeleteNode: () => void;
  onUpdateNode: (nodeId: string, updates: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  selectedNode, 
  onAddNode,
  onDataLoaded,
  onDeleteNode,
  onUpdateNode 
}) => {
  const [monetizationData, setMonetizationData] = React.useState<any>(null);
  const [editedLabel, setEditedLabel] = React.useState('');
  const [editedValue, setEditedValue] = React.useState<number | null>(null);
  const [editedRate, setEditedRate] = React.useState<number | null>(null);
  const [editedUnit, setEditedUnit] = React.useState('');

  React.useEffect(() => {
    if (selectedNode) {
      setEditedLabel(selectedNode.data.label || '');
      setEditedValue(selectedNode.data.value ?? null);
      setEditedRate(selectedNode.data.rate ?? null);
      setEditedUnit(selectedNode.data.unit || '');
    }
  }, [selectedNode]);

  const handleAddStock = () => {
    onAddNode('stock', { label: 'New Stock', value: 0, unit: 'units' });
  };

  const handleAddFlow = () => {
    onAddNode('flow', { label: 'New Flow', rate: 1.0, unit: 'units/time' });
  };

  const handleAddVariable = () => {
    onAddNode('variable', { label: 'New Variable', value: 0, expression: '' });
  };

  const handleMonetizationDataLoaded = (data: any) => {
    setMonetizationData(data);
  };

  return (
    <div className="w-80 border-r bg-white p-4 overflow-y-auto">
      <DataSourceManager 
        onDataLoaded={onDataLoaded}
        onMonetizationDataLoaded={handleMonetizationDataLoaded}
      />

      <h2 className="text-lg font-semibold mb-4">Add Elements</h2>
      <div className="space-y-2 mb-6">
        <button
          onClick={handleAddStock}
          className="w-full text-left px-3 py-2 rounded border bg-blue-50 hover:bg-blue-100"
        >
          📦 Stock (Reservoir)
        </button>
        <button
          onClick={handleAddFlow}
          className="w-full text-left px-3 py-2 rounded border bg-green-50 hover:bg-green-100"
        >
          🔄 Flow (Rate)
        </button>
        <button
          onClick={handleAddVariable}
          className="w-full text-left px-3 py-2 rounded border bg-purple-50 hover:bg-purple-100"
        >
          📊 Variable (Converter)
        </button>
      </div>

      {selectedNode && (
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Selected Node</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <div className="text-sm">{selectedNode.type}</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Label</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
              />
            </div>
            {selectedNode.data.value !== undefined && (
              <div>
                <label className="block text-sm font-medium">Value</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={editedValue ?? ''}
                  onChange={(e) => setEditedValue(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            )}
            {selectedNode.data.rate !== undefined && (
              <div>
                <label className="block text-sm font-medium">Rate</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={editedRate ?? ''}
                  onChange={(e) => setEditedRate(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            )}
            {selectedNode.data.unit && (
              <div>
                <label className="block text-sm font-medium">Unit</label>
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={editedUnit}
                  onChange={(e) => setEditedUnit(e.target.value)}
                />
              </div>
            )}
            <div className="flex space-x-2 mt-2">
              <button 
                onClick={() => selectedNode && onUpdateNode(selectedNode.id, {
                  label: editedLabel,
                  value: editedValue,
                  rate: editedRate,
                  unit: editedUnit,
                })}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update
              </button>
              <button 
                onClick={onDeleteNode}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {monetizationData && (
        <div className="border-t pt-4 mt-4">
          <h2 className="text-lg font-semibold mb-2">Monetization Insights</h2>
          <div className="space-y-3">
            {monetizationData.totalRevenue && (
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-xl font-bold text-green-600">
                  ${monetizationData.totalRevenue.toLocaleString()}/month
                </div>
              </div>
            )}
            {monetizationData.totalUsers && (
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Total Users</div>
                <div className="text-xl font-bold text-blue-600">
                  {monetizationData.totalUsers.toLocaleString()}
                </div>
              </div>
            )}
             {monetizationData.revenueShare && (
              <div>
                <div className="text-sm font-medium mb-2">Revenue Distribution</div>
                <RevenueChart 
                  data={monetizationData.revenueShare.slice(0, 8)} 
                  width={280} 
                  height={180}
                />
                <div className="space-y-1 mt-2">
                  {monetizationData.revenueShare.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm truncate mr-2">{item.stream}</span>
                      <span className="text-sm font-medium">{item.share.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t pt-4 mt-4">
        <h2 className="text-lg font-semibold mb-2">Simulation Controls</h2>
        <div className="space-y-2">
          <button className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            ▶ Run Simulation
          </button>
          <button className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            ⏸ Pause
          </button>
          <button className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;