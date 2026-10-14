import * as React from 'react';
import type { Node } from 'reactflow';
import RevenueChart from './charts/RevenueChart';
import type { MonetizationData } from './DataSourceManager';
import type { SimulationResult } from '../utils/simulation';
import type { LLMSuggestion } from '../utils/llmService';

interface NodeData {
  label: string;
  value?: number;
  unit?: string;
  rate?: number;
  expression?: string;
}

interface RightPropertiesPanelProps {
  selectedNode: Node | null;
  selectedNodes: Node[];
  onDeleteNode: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<NodeData>) => void;
  monetizationData: MonetizationData | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAutoLayout?: () => void;
  onRunSimulation?: () => void;
  simulationRunning?: boolean;
  simulationResults?: SimulationResult | null;
  llmApiKey?: string;
  onLlmApiKeyChange?: (key: string) => void;
  isEnvApiKey?: boolean;
  llmSuggestions?: LLMSuggestion[];
  isLlmLoading?: boolean;
  llmError?: string | null;
  onGetLlmSuggestions?: (prompt?: string) => void;
  onApplyLlmSuggestion?: (suggestion: LLMSuggestion) => void;
  onSaveGraph?: () => void;
  onLoadGraph?: () => void;
  onExportGraph?: () => void;
  onImportGraph?: (jsonString: string) => void;
}

const RightPropertiesPanel: React.FC<RightPropertiesPanelProps> = ({ 
  selectedNode, 
  selectedNodes,
  onDeleteNode,
  onUpdateNode,
  monetizationData,
  collapsed,
  onToggleCollapse,
  onAutoLayout,
  onRunSimulation,
  simulationRunning,
  simulationResults,
  llmApiKey = '',
  onLlmApiKeyChange,
  isEnvApiKey = false,
  llmSuggestions = [],
  isLlmLoading = false,
  llmError = null,
  onGetLlmSuggestions,
  onApplyLlmSuggestion,
  onSaveGraph,
  onLoadGraph,
  onExportGraph,
  onImportGraph,
}) => {
  const [editedLabel, setEditedLabel] = React.useState('');
  const [editedValue, setEditedValue] = React.useState<number | undefined>(undefined);
  const [editedRate, setEditedRate] = React.useState<number | undefined>(undefined);
  const [editedUnit, setEditedUnit] = React.useState('');
  const [llmCustomPrompt, setLlmCustomPrompt] = React.useState('');
  const [showLlmSection, setShowLlmSection] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onImportGraph?.(content);
    };
    reader.readAsText(file);
    // Reset file input to allow selecting same file again
    event.target.value = '';
  };

  React.useEffect(() => {
    if (selectedNode) {
      setEditedLabel(selectedNode.data.label || '');
      setEditedValue(selectedNode.data.value ?? undefined);
      setEditedRate(selectedNode.data.rate ?? undefined);
      setEditedUnit(selectedNode.data.unit || '');
    }
  }, [selectedNode]);

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-12' : 'w-80'}`}>
      <div className="flex items-center justify-between border-b bg-white p-2">
        {!collapsed && (
           <h3 className="font-medium text-gray-700">Properties & Insights</h3>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-gray-100"
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '←' : '→'}
        </button>
      </div>
      
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          {selectedNodes.length > 0 ? (
            <div>
               <h2 className="text-base font-medium mb-2">
                 {selectedNodes.length === 1 ? 'Selected Node' : `Selected Nodes (${selectedNodes.length})`}
               </h2>
              
              {selectedNodes.length === 1 && selectedNode ? (
                <div className="space-y-2">
                  <div>
                     <label className="block text-xs font-medium">Type</label>
                     <div className="text-xs">{selectedNode.type}</div>
                  </div>
                  <div>
                     <label className="block text-xs font-medium">Label</label>
                    <input
                       className="w-full border rounded px-2 py-1 text-xs"
                      value={editedLabel}
                      onChange={(e) => setEditedLabel(e.target.value)}
                    />
                  </div>
                  {selectedNode.data.value !== undefined && (
                    <div>
                       <label className="block text-xs font-medium">Value</label>
                       <input
                         type="number"
                         className="w-full border rounded px-2 py-1 text-xs"
                         value={editedValue ?? ''}
                         onChange={(e) => setEditedValue(e.target.value ? Number(e.target.value) : undefined)}
                       />
                    </div>
                  )}
                  {selectedNode.data.rate !== undefined && (
                    <div>
                       <label className="block text-xs font-medium">Rate</label>
                       <input
                         type="number"
                         className="w-full border rounded px-2 py-1 text-xs"
                         value={editedRate ?? ''}
                         onChange={(e) => setEditedRate(e.target.value ? Number(e.target.value) : undefined)}
                       />
                    </div>
                  )}
                  {selectedNode.data.unit && (
                    <div>
                       <label className="block text-xs font-medium">Unit</label>
                       <input
                         className="w-full border rounded px-2 py-1 text-xs"
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
              ) : (
                <div className="space-y-3">
                   <div className="text-xs text-gray-600">
                     {selectedNodes.length} nodes selected
                   </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={onDeleteNode}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete All
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 pt-2">
                    Keyboard shortcuts: 
                    <div className="mt-1 space-y-1">
                      <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Ctrl+A</kbd> Select all nodes</div>
                      <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Ctrl+C</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 rounded border">C</kbd> Copy</div>
                      <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Ctrl+V</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 rounded border">V</kbd> Paste</div>
                      <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Ctrl+Z</kbd> Undo (up to 16 commands)</div>
                      <div>• <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Delete</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Backspace</kbd> Delete selected</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No nodes selected. Click on a node to view properties.
            </div>
          )}

          {monetizationData && (
            <div className="border-t pt-4 mt-4">
               <h2 className="text-base font-medium mb-2">Monetization Insights</h2>
              <div className="space-y-3">
                {monetizationData.totalRevenue && (
                  <div className="bg-gray-50 p-3 rounded">
                     <div className="text-xs text-gray-600">Total Revenue</div>
                     <div className="text-lg font-bold text-green-600">
                       ${monetizationData.totalRevenue.toLocaleString()}/month
                     </div>
                  </div>
                )}
                {monetizationData.totalUsers && (
                  <div className="bg-gray-50 p-3 rounded">
                     <div className="text-xs text-gray-600">Total Users</div>
                     <div className="text-lg font-bold text-blue-600">
                       {monetizationData.totalUsers.toLocaleString()}
                     </div>
                  </div>
                )}
                {monetizationData.revenueShare && (
                  <div>
                     <div className="text-xs font-medium mb-2">Revenue Distribution</div>
                    <RevenueChart 
                      data={monetizationData.revenueShare.slice(0, 8)} 
                      width={280} 
                      height={180}
                    />
                    <div className="space-y-1 mt-2">
                      {monetizationData.revenueShare.slice(0, 5).map((item: { stream: string; share: number; revenue: number }, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                           <span className="text-xs truncate mr-2">{item.stream}</span>
                           <span className="text-xs font-medium">{item.share.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <h2 className="text-base font-medium mb-2">Graph Persistence</h2>
            <div className="space-y-2">
              <button 
                onClick={onSaveGraph}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                💾 Save to Browser
              </button>
              <button 
                onClick={onLoadGraph}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                📂 Load from Browser
              </button>
              <button 
                onClick={onExportGraph}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                📤 Export as JSON
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                📥 Import from JSON
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
              <h2 className="text-base font-medium mb-2">Simulation Controls</h2>
            <div className="space-y-2">
              {onAutoLayout && (
                <button 
                  onClick={onAutoLayout}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  🌀 Auto Layout
                </button>
              )}
              <button 
                onClick={onRunSimulation || undefined}
                disabled={simulationRunning}
                className={`w-full px-3 py-2 rounded ${simulationRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                {simulationRunning ? '⏳ Running...' : '▶ Run Simulation'}
              </button>
              <button className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                ⏸ Pause
              </button>
              <button className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                🔄 Reset
              </button>
            </div>
          </div>
          
          {simulationResults && (
            <div className="border-t pt-4 mt-4">
               <h2 className="text-base font-medium mb-2">Simulation Results</h2>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {Array.from(simulationResults.values.entries()).slice(0, 10).map(([name, values]) => (
                   <div key={name} className="flex justify-between items-center text-xs">
                    <span className="truncate">{name}</span>
                    <span className="font-mono">{values.length > 0 ? values[values.length - 1].toFixed(2) : 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-medium">AI Suggestions</h2>
              <button
                onClick={() => setShowLlmSection(!showLlmSection)}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                {showLlmSection ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showLlmSection && (
              <div className="space-y-3">
                {/* API Key Input */}
                {isEnvApiKey ? (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="text-xs font-medium text-blue-800">API Key Loaded from Environment</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Using Deepseek API key from environment variable. The key is hidden for security.
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium mb-1">Deepseek API Key</label>
                    <input
                      type="password"
                      value={llmApiKey}
                      onChange={(e) => onLlmApiKeyChange?.(e.target.value)}
                      placeholder="Enter API key for real suggestions"
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {llmApiKey ? '✓ API key provided' : 'Leave empty for mock suggestions'}
                    </div>
                  </div>
                )}

                {/* Custom Prompt */}
                <div>
                  <label className="block text-xs font-medium mb-1">Custom Prompt (Optional)</label>
                  <textarea
                    value={llmCustomPrompt}
                    onChange={(e) => setLlmCustomPrompt(e.target.value)}
                    placeholder="Ask for specific improvements..."
                    rows={2}
                    className="w-full border rounded px-2 py-1 text-xs resize-none"
                  />
                </div>

                {/* Get Suggestions Button */}
                <button
                  onClick={() => onGetLlmSuggestions?.(llmCustomPrompt || undefined)}
                  disabled={isLlmLoading}
                  className={`w-full px-3 py-2 rounded ${
                    isLlmLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                  } text-white`}
                >
                  {isLlmLoading ? '⏳ Analyzing...' : '🤖 Get AI Suggestions'}
                </button>

                {/* Error Display */}
                {llmError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    Error: {llmError}
                  </div>
                )}

                {/* Suggestions List */}
                {llmSuggestions.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <div className="text-xs font-medium">Suggestions ({llmSuggestions.length})</div>
                    {llmSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="border rounded p-2 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-xs">{suggestion.title}</div>
                            <div className="text-xs text-gray-600 mt-1">{suggestion.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                          {suggestion.action && onApplyLlmSuggestion && (
                            <button
                              onClick={() => onApplyLlmSuggestion?.(suggestion)}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RightPropertiesPanel;