
import { ReactFlowProvider } from 'reactflow';
import './App.css';
import SystemsViewer from './components/SystemsViewer';

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Systems Thinking Viewer</h1>
        <p className="text-gray-600">Visualize stocks and flows, weights and probabilities across multiple data sources</p>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <ReactFlowProvider>
          <SystemsViewer />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default App;
