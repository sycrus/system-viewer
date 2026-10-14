import * as React from 'react';
import type { Node, Edge } from 'reactflow';
import DataSourceManager from './DataSourceManager';
import type { MonetizationData } from './DataSourceManager';
import { getDefaultNodeTypes } from '../utils/domains';

interface NodeData {
  label: string;
  value?: number;
  unit?: string;
  rate?: number;
  expression?: string;
  domainNodeTypeId?: string;
}

interface LeftSidebarProps {
  onDataLoaded: (nodes: Node[], edges: Edge[]) => void;
  onMonetizationDataLoaded: (data: MonetizationData) => void;
  onAddNode: (nodeType: string, data: NodeData) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentDomainId: string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  onDataLoaded,
  onMonetizationDataLoaded,
  onAddNode,
  collapsed,
  onToggleCollapse,
  currentDomainId,
}) => {
  const nodeTypes = getDefaultNodeTypes(currentDomainId);
  
  const handleAddNode = (nodeTypeId: string) => {
    const nodeType = nodeTypes.find(nt => nt.id === nodeTypeId);
    if (!nodeType) return;
    
    const defaultData: NodeData = { 
      label: `New ${nodeType.name}`,
      domainNodeTypeId: nodeType.id
    };
    
    // Set default values based on base type
    if (nodeType.baseType === 'stock' || nodeType.baseType === 'variable') {
      defaultData.value = 0;
    }
    if (nodeType.baseType === 'flow') {
      defaultData.rate = 1.0;
    }
    if (nodeType.defaultUnit) {
      defaultData.unit = nodeType.defaultUnit;
    }
    
    onAddNode(nodeType.baseType, defaultData);
  };

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-12' : 'w-80'}`}>
      <div className="flex items-center justify-between border-b bg-white p-2">
        {!collapsed && (
           <h3 className="font-medium text-gray-700">Data Sources & Tools</h3>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-gray-100"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          <DataSourceManager 
            onDataLoaded={onDataLoaded}
            onMonetizationDataLoaded={onMonetizationDataLoaded}
            currentDomainId={currentDomainId}
          />

           <h2 className="text-base font-medium mb-4 mt-6">Add Elements</h2>
           <div className="space-y-2 mb-6">
             {nodeTypes.map((nodeType) => {
               const colorClasses: Record<string, string> = {
                 blue: 'bg-blue-50 hover:bg-blue-100',
                 green: 'bg-green-50 hover:bg-green-100',
                 purple: 'bg-purple-50 hover:bg-purple-100',
                 red: 'bg-red-50 hover:bg-red-100',
                 orange: 'bg-orange-50 hover:bg-orange-100',
                 emerald: 'bg-emerald-50 hover:bg-emerald-100',
                 yellow: 'bg-yellow-50 hover:bg-yellow-100',
               };
               const iconMap: Record<string, string> = {
                 stock: '📦',
                 flow: '🔄',
                 variable: '📊',
                 revenue: '💰',
                 cost: '📉',
                 customer: '👥',
                 metric: '📈',
                 inventory: '📦',
                 supplier: '🚚',
                 distribution: '🏭',
                 demand: '🛒',
                 population: '👤',
                 resource: '🌿',
                 pollutant: '☣️',
                 process: '⚙️',
               };
               const icon = iconMap[nodeType.id] || '📄';
               return (
                 <button
                   key={nodeType.id}
                   onClick={() => handleAddNode(nodeType.id)}
                   className={`w-full text-left px-3 py-2 rounded border ${colorClasses[nodeType.color] || 'bg-gray-50 hover:bg-gray-100'}`}
                 >
                   {icon} {nodeType.name} ({nodeType.description})
                 </button>
               );
             })}
           </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;