
import { ReactFlowProvider } from 'reactflow';
import { useState } from 'react';
import './App.css';
import SystemsViewer from './components/SystemsViewer';
import { getAllDomains } from './utils/domains';

function App() {
  const [currentDomainId, setCurrentDomainId] = useState('game-development');
  const domains = getAllDomains();
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Systems Thinking Viewer</h1>
             <p className="text-xs text-gray-600">Visualize stocks and flows, weights and probabilities across multiple data sources</p>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-xs text-gray-700">Domain:</div>
            <select 
              value={currentDomainId}
              onChange={(e) => setCurrentDomainId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.icon} {domain.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <ReactFlowProvider>
          <SystemsViewer currentDomainId={currentDomainId} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default App;
