import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
} from 'reactflow';
import type {
  Node,
  Edge,
  Connection,
  NodeTypes,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';

import LeftSidebar from './LeftSidebar';
import RightPropertiesPanel from './RightPropertiesPanel';
import StockNode from './nodes/StockNode';
import FlowNode from './nodes/FlowNode';
import VariableNode from './nodes/VariableNode';
import type { MonetizationData } from './DataSourceManager';
import { optimizeLayout } from '../utils/graphLayout';
import { SystemDynamicsSimulator, type SimulationResult } from '../utils/simulation';
import { LLMService, type LLMSuggestion, type GraphAnalysis } from '../utils/llmService';
import { getDataSources, type DataSource } from '../utils/domains';
import { convertToFlowNodes, parseCSVData, calculateMonetizationMetrics, type MonetizationData as CSVMonetizationData } from '../utils/dataParser';


interface NodeData {
  label: string;
  value?: number;
  unit?: string;
  rate?: number;
  expression?: string;
  domainNodeTypeId?: string;
}

interface SavedGraph {
  nodes: Node[];
  edges: Edge[];
  version: string;
  savedAt: string;
  domainId: string;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

const LOCAL_STORAGE_KEY = 'systemViewer_graphData';
const GRAPH_VERSION = '1.0';

const nodeTypes: NodeTypes = {
  stock: StockNode,
  flow: FlowNode,
  variable: VariableNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'stock',
    position: { x: 250, y: 100 },
    data: { label: 'Population', value: 1000, unit: 'people' },
  },
  {
    id: '2',
    type: 'stock',
    position: { x: 550, y: 100 },
    data: { label: 'Resources', value: 5000, unit: 'units' },
  },
  {
    id: '3',
    type: 'flow',
    position: { x: 400, y: 250 },
    data: { label: 'Consumption', rate: 2.5, unit: 'units/person' },
  },
  {
    id: '4',
    type: 'variable',
    position: { x: 400, y: 400 },
    data: { label: 'Growth Rate', value: 0.03, expression: '0.03 * Population' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-3', source: '1', target: '3', animated: true, label: 'influences' },
  { id: 'e2-3', source: '2', target: '3', animated: true, label: 'depletes' },
  { id: 'e4-1', source: '4', target: '1', animated: false, label: 'drives' },
];

interface SystemsViewerProps {
  currentDomainId: string;
}

const SystemsViewer: React.FC<SystemsViewerProps> = ({ currentDomainId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [clipboard, setClipboard] = useState<{nodes: Node[], edges: Edge[]}>({ nodes: [], edges: [] });
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'success' | 'error'} | null>(null);
  const [history, setHistory] = useState<Array<{ nodes: Node[], edges: Edge[] }>>([]);
  const [isUndoing, setIsUndoing] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [monetizationData, setMonetizationData] = useState<MonetizationData | null>(null);
  const [simulator] = useState(() => new SystemDynamicsSimulator());
  const [_simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [llmService] = useState(() => new LLMService());
  const [llmApiKey, setLlmApiKey] = useState<string>('');
  const [llmSuggestions, setLlmSuggestions] = useState<LLMSuggestion[]>([]);
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [viewport, setViewportState] = useState({ x: 0, y: 0, zoom: 1 });
  const { setViewport: setReactFlowViewport } = useReactFlow();

  const envApiKeyRef = useRef<string>('');
  const envApiKeyExists = !!envApiKeyRef.current;

  // Load API key from environment or localStorage on mount
  useEffect(() => {
    // Check for environment variable first (highest priority)
    const envApiKey = import.meta.env?.VITE_DEEPSEEK_API_KEY;
    if (envApiKey && envApiKey.trim() !== '') {
      envApiKeyRef.current = envApiKey;

      setLlmApiKey(envApiKey);
      console.log('LLM API key loaded from environment variable');
    } else {
      // Fall back to localStorage
      const savedKey = localStorage.getItem('systemViewer_llmApiKey');
      if (savedKey) {
        setLlmApiKey(savedKey);
      }
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    // Don't save to localStorage if the key matches the environment variable
    if (llmApiKey === envApiKeyRef.current) {
      // This is the environment key, no need to save
      return;
    }
    
    if (llmApiKey) {
      localStorage.setItem('systemViewer_llmApiKey', llmApiKey);
    } else {
      localStorage.removeItem('systemViewer_llmApiKey');
    }
  }, [llmApiKey]);

  // Load saved graph on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: SavedGraph = JSON.parse(saved);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          if (parsed.viewport) {
            setReactFlowViewport(parsed.viewport);
            setViewportState(parsed.viewport);
          }
          console.log(`Loaded saved graph with ${parsed.nodes.length} nodes, ${parsed.edges.length} edges`);
        }
      } catch (error) {
        console.error('Failed to load saved graph:', error);
      }
    }
  }, [setNodes, setEdges, setReactFlowViewport, setViewportState]);

  // Auto-save graph when nodes or edges change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedGraph: SavedGraph = {
        nodes,
        edges,
        viewport,
        version: GRAPH_VERSION,
        savedAt: new Date().toISOString(),
        domainId: currentDomainId,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedGraph));
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [nodes, edges, viewport, currentDomainId]);

  const isUsingEnvKey = envApiKeyExists && llmApiKey === envApiKeyRef.current;

  const saveGraphToLocalStorage = useCallback(() => {
    const savedGraph: SavedGraph = {
      nodes,
      edges,
      viewport,
      version: GRAPH_VERSION,
      savedAt: new Date().toISOString(),
      domainId: currentDomainId,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedGraph));
    setNotification({
      message: 'Graph saved locally',
      type: 'success',
    });
    setTimeout(() => setNotification(null), 2000);
  }, [nodes, edges, viewport, currentDomainId]);

  const loadGraphFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      setNotification({
        message: 'No saved graph found',
        type: 'error',
      });
      setTimeout(() => setNotification(null), 2000);
      return;
    }
    try {
      const parsed: SavedGraph = JSON.parse(saved);
      if (parsed.nodes && parsed.edges) {
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        if (parsed.viewport) {
          setReactFlowViewport(parsed.viewport);
          setViewportState(parsed.viewport);
        }
        setNotification({
          message: `Graph loaded (${parsed.nodes.length} nodes, ${parsed.edges.length} edges)`,
          type: 'success',
        });
        setTimeout(() => setNotification(null), 2000);
      }
    } catch (error) {
      console.error('Failed to load saved graph:', error);
      setNotification({
        message: 'Failed to load saved graph',
        type: 'error',
      });
      setTimeout(() => setNotification(null), 2000);
    }
  }, [setNodes, setEdges, setReactFlowViewport, setViewportState]);

  const exportGraphToJSON = useCallback(() => {
    const savedGraph: SavedGraph = {
      nodes,
      edges,
      viewport,
      version: GRAPH_VERSION,
      savedAt: new Date().toISOString(),
      domainId: currentDomainId,
    };
    const dataStr = JSON.stringify(savedGraph, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `system_viewer_graph_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification({
      message: 'Graph exported as JSON',
      type: 'success',
    });
    setTimeout(() => setNotification(null), 2000);
  }, [nodes, edges, viewport, currentDomainId]);

  const importGraphFromJSON = useCallback((jsonString: string) => {
    try {
      const parsed: SavedGraph = JSON.parse(jsonString);
      if (parsed.nodes && parsed.edges) {
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        if (parsed.viewport) {
          setReactFlowViewport(parsed.viewport);
          setViewportState(parsed.viewport);
        }
        setNotification({
          message: `Graph imported (${parsed.nodes.length} nodes, ${parsed.edges.length} edges)`,
          type: 'success',
        });
        setTimeout(() => setNotification(null), 2000);
        return true;
      }
    } catch (error) {
      console.error('Failed to import graph:', error);
      setNotification({
        message: 'Failed to import graph: invalid JSON format',
        type: 'error',
      });
      setTimeout(() => setNotification(null), 2000);
    }
    return false;
  }, [setNodes, setEdges, setReactFlowViewport, setViewportState]);

  const saveHistory = useCallback(() => {
    setHistory((prev) => {
      const newHistory = [...prev, { nodes, edges }];
      if (newHistory.length > 16) {
        newHistory.shift();
      }
      return newHistory;
    });
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    
    setIsUndoing(true);
    const previousState = history[history.length - 1];
    setNodes(previousState.nodes);
    setEdges(previousState.edges);
    setHistory((prev) => prev.slice(0, -1));
    
    setNotification({
      message: 'Undo completed',
      type: 'info'
    });
    setTimeout(() => setNotification(null), 2000);
    
    setTimeout(() => setIsUndoing(false), 100);
  }, [history, setNodes, setEdges]);

  const selectAllNodes = useCallback(() => {
    setNodes((nds) => nds.map(node => ({ ...node, selected: true })));
    setSelectedNodes(nodes);
    setNotification({
      message: `Selected all ${nodes.length} nodes`,
      type: 'info'
    });
    setTimeout(() => setNotification(null), 2000);
  }, [nodes, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isUndoing) saveHistory();
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, isUndoing, saveHistory],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodes(params.nodes);
    if (params.nodes.length === 1) {
      setSelectedNode(params.nodes[0]);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const addNewNode = useCallback((nodeType: string, data: NodeData) => {
    if (!isUndoing) saveHistory();
    const newNode: Node = {
      id: `${Date.now()}`,
      type: nodeType,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, isUndoing, saveHistory]);

  const handleDataLoaded = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (!isUndoing) saveHistory();
    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  }, [setNodes, setEdges, isUndoing, saveHistory]);

  const handleMonetizationDataLoaded = useCallback((data: MonetizationData) => {
    setMonetizationData(data);
  }, []);

  const applyAutoLayout = useCallback(() => {
    if (!isUndoing) saveHistory();
    
    const canvasWidth = 800;
    const canvasHeight = 600;
    
    const updatedNodes = optimizeLayout(nodes, edges, {
      width: canvasWidth,
      height: canvasHeight,
      chargeStrength: -300,
      linkDistance: 150,
      iterations: 300,
    });
    
    setNodes(updatedNodes);
    
    setNotification({
      message: 'Layout optimized to reduce edge crossings',
      type: 'success'
    });
    setTimeout(() => setNotification(null), 2000);
  }, [nodes, edges, setNodes, isUndoing, saveHistory]);

  const runSimulation = useCallback(async () => {
    if (isUndoing) saveHistory();
    setIsSimulationRunning(true);
    setNotification({
      message: 'Starting simulation...',
      type: 'info'
    });
    try {
      await simulator.loadModel('/data/hares_and_foxes.xmile');
      const results = await simulator.runSimulation();
      setSimulationResults(results);
      
      // Update node values with simulation results
      const lastValues = new Map<string, number>();
      results.values.forEach((values, name) => {
        if (values.length > 0) {
          lastValues.set(name, values[values.length - 1]);
        }
      });

      setNodes((nds) => nds.map((node) => {
        // Try to match by node label (case-insensitive, spaces to underscores)
        const normalizedLabel = node.data.label.toLowerCase().replace(/\s+/g, '_');
        const matchedName = Array.from(lastValues.keys()).find(key => 
          key.toLowerCase() === normalizedLabel
        );
        if (matchedName) {
          const newValue = lastValues.get(matchedName)!;
          const updatedData = { ...node.data };
          if (node.type === 'stock' || node.type === 'variable') {
            updatedData.value = newValue;
          } else if (node.type === 'flow') {
            updatedData.rate = newValue;
          }
          return {
            ...node,
            data: updatedData,
          };
        }
        return node;
      }));

      setNotification({
        message: `Simulation completed with ${results.values.size} variables, updated matching nodes`,
        type: 'success'
      });
    } catch (error) {
      console.error('Simulation failed:', error);
      setNotification({
        message: `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsSimulationRunning(false);
      setTimeout(() => setNotification(null), 3000);
    }
  }, [simulator, isUndoing, saveHistory, setNodes]);

  const getLlmSuggestions = useCallback(async (prompt?: string) => {
    setIsLlmLoading(true);
    setLlmError(null);
    setLlmSuggestions([]);

    // Set API key if provided
    if (llmApiKey) {
      llmService.setApiKey(llmApiKey);
    }

    try {
      const analysis: GraphAnalysis = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'unknown',
          label: node.data.label || '',
          value: node.data.value,
          unit: node.data.unit,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label as string,
        })),
        domain: currentDomainId,
      };

      const domainSources = getDataSources(currentDomainId);
      const request = {
        analysis,
        prompt,
        context: {
          selectedNodeIds: selectedNodes.map(n => n.id),
          focusArea: selectedNodes.length > 0 ? 'selected nodes' : undefined,
        },
        availableDataSources: domainSources.map((ds: DataSource) => ({
          id: ds.id,
          name: ds.name,
          description: ds.description,
          type: ds.type,
        })),
      };

      let suggestions: LLMSuggestion[];
      if (!llmApiKey) {
        // Use mock suggestions when no API key is provided
        suggestions = await llmService.getMockSuggestions(request);
      } else {
        suggestions = await llmService.getSuggestions(request);
      }

      setLlmSuggestions(suggestions);
      setNotification({
        message: `Got ${suggestions.length} suggestions from LLM`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('LLM suggestion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLlmError(errorMessage);
      setNotification({
        message: `Failed to get LLM suggestions: ${errorMessage}`,
        type: 'error',
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLlmLoading(false);
    }
  }, [nodes, edges, currentDomainId, selectedNodes, llmService, llmApiKey]);



  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;
    if (!isUndoing) saveHistory();

    const nodeIds = selectedNodes.map(node => node.id);
    setNodes((nds) => nds.filter((node) => !nodeIds.includes(node.id)));
    setEdges((eds) => eds.filter(
      (edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
    ));
    setSelectedNodes([]);
    setSelectedNode(null);
  }, [selectedNodes, setNodes, setEdges, isUndoing, saveHistory]);

  const updateNode = useCallback((nodeId: string, updates: Partial<NodeData>) => {
    if (!isUndoing) saveHistory();
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updates,
          },
        };
      }
      return node;
    }));
  }, [setNodes, isUndoing, saveHistory]);

  const loadDataSource = useCallback(async (dataSourceName: string) => {
    const domainSources = getDataSources(currentDomainId);
    
    // Try to find matching data source
    const matchedSource = domainSources.find(source => 
      source.name.toLowerCase().includes(dataSourceName.toLowerCase()) ||
      source.description.toLowerCase().includes(dataSourceName.toLowerCase()) ||
      source.id.toLowerCase().includes(dataSourceName.toLowerCase())
    );

    if (!matchedSource) {
      setNotification({
        message: `Could not find data source: ${dataSourceName}`,
        type: 'error',
      });
      setTimeout(() => setNotification(null), 3000);
      return false;
    }

    setNotification({
      message: `Loading data source: ${matchedSource.name}`,
      type: 'info',
    });

    try {
      // Handle different data source types
      switch (matchedSource.type) {
        case 'template': {
          if (matchedSource.id === 'game-dev-ecosystem') {
            const response = await fetch('/data/gameDevEcosystem.json');
            if (!response.ok) throw new Error('Failed to load ecosystem data');
            const ecosystem = await response.json();
            const { nodes: templateNodes, edges: templateEdges } = convertToFlowNodes(ecosystem);
            handleDataLoaded(templateNodes, templateEdges);
          } else if (matchedSource.id === 'monetization-template') {
            const response = await fetch('/data/gameDevMonetization.csv');
            if (!response.ok) throw new Error('Failed to load monetization template');
            const text = await response.text();
            const data = parseCSVData(text);
            const metrics = calculateMonetizationMetrics(data);
            handleMonetizationDataLoaded(metrics);
            
            const monetizationNodes = data.map((item: CSVMonetizationData, index: number) => ({
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
            handleDataLoaded(monetizationNodes, []);
          }
          break;
        }
        case 'api': {
          // For now, use mock API data
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
          handleMonetizationDataLoaded(mockData);
          const apiNodes = mockData.platforms.map((platform, index) => ({
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
          const apiEdges = mockData.platforms.map((platform, index) => ({
            id: `platform_flow_${index}`,
            source: `platform_${index}`,
            target: 'revenue_generation',
            label: 'contributes',
            animated: true,
            style: { strokeWidth: Math.sqrt(platform.revenue / 1000) },
          }));
          handleDataLoaded(apiNodes, apiEdges);
          break;
        }
        default:
          throw new Error(`Unsupported data source type: ${matchedSource.type}`);
      }

      setNotification({
        message: `Successfully loaded: ${matchedSource.name}`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 3000);
      return true;
    } catch (error) {
      console.error('Failed to load data source:', error);
      setNotification({
        message: `Failed to load ${matchedSource.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
      setTimeout(() => setNotification(null), 3000);
      return false;
    }
  }, [currentDomainId, handleDataLoaded, handleMonetizationDataLoaded]);

   const applyLlmSuggestion = useCallback((suggestion: LLMSuggestion) => {
    if (!suggestion.action) return;

    if (!isUndoing) saveHistory();

    try {
      const { type, payload } = suggestion.action;

      switch (type) {
        case 'add_edge':
          setEdges(eds => addEdge({
            id: `edge_${Date.now()}`,
            source: payload.sourceNodeId,
            target: payload.targetNodeId,
            label: payload.label,
            animated: true,
          }, eds));
          setNotification({
            message: `Added connection: ${payload.sourceNodeId} → ${payload.targetNodeId}`,
            type: 'success',
          });
          setTimeout(() => setNotification(null), 3000);
          break;

        case 'add_node':
          addNewNode(payload.type, {
            label: payload.label,
            value: payload.value,
            unit: payload.unit,
          });
          setNotification({
            message: `Added node: ${payload.label}`,
            type: 'success',
          });
          setTimeout(() => setNotification(null), 3000);
          break;

        case 'load_datasource':
          // Actually load the suggested data source
          loadDataSource(payload.name);
          break;

        case 'update_value': {
          // Find node by label or id
          const nodeToUpdate = nodes.find(n => 
            n.id === payload.nodeId || n.data.label === payload.label
          );
          if (nodeToUpdate) {
            updateNode(nodeToUpdate.id, { value: payload.value });
            setNotification({
              message: `Updated ${nodeToUpdate.data.label} value to ${payload.value}`,
              type: 'success',
            });
            setTimeout(() => setNotification(null), 3000);
          }
          break;
        }
      }

      // Remove the applied suggestion
      setLlmSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      setNotification({
        message: `Failed to apply suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
      setTimeout(() => setNotification(null), 3000);
    }
  }, [isUndoing, saveHistory, setEdges, addNewNode, nodes, updateNode, loadDataSource]);

  const copySelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;
    
    // Get edges connecting selected nodes
    const selectedNodeIds = selectedNodes.map(node => node.id);
    const connectingEdges = edges.filter(
      edge => selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target)
    );
    
    setClipboard({
      nodes: selectedNodes,
      edges: connectingEdges,
    });
    
    setNotification({
      message: `Copied ${selectedNodes.length} node${selectedNodes.length !== 1 ? 's' : ''}`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 2000);
  }, [selectedNodes, edges]);

  const pasteNodes = useCallback(() => {
    if (clipboard.nodes.length === 0) return;
    if (!isUndoing) saveHistory();
    
    const offset = 20; // Offset for pasted nodes
    const newNodes = clipboard.nodes.map(node => ({
      ...node,
      id: `${node.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: node.position.x + offset,
        y: node.position.y + offset,
      },
    }));

    const newNodeIdsMap = new Map();
    clipboard.nodes.forEach((node, index) => {
      newNodeIdsMap.set(node.id, newNodes[index].id);
    });

    const newEdges = clipboard.edges.map(edge => ({
      ...edge,
      id: `${edge.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: newNodeIdsMap.get(edge.source) || edge.source,
      target: newNodeIdsMap.get(edge.target) || edge.target,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    
    setNotification({
      message: `Pasted ${newNodes.length} node${newNodes.length !== 1 ? 's' : ''}`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 2000);
  }, [clipboard, setNodes, setEdges, isUndoing, saveHistory]);

  const onMoveEnd = useCallback((_event: any, viewport: { x: number; y: number; zoom: number }) => {
    setViewportState(viewport);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      
      // Escape key blurs any focused element and returns focus to canvas
      if (event.key === 'Escape') {
        if (activeElement && activeElement !== document.body) {
          (activeElement as HTMLElement).blur();
          event.preventDefault();
        }
        return;
      }
      
      // Skip keyboard shortcuts when user is interacting with form elements
      const isFormElement = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.hasAttribute('contenteditable')
      );
      if (isFormElement) return;

      // Delete selected nodes
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodes.length > 0) {
        event.preventDefault();
        deleteSelectedNodes();
      }
      // Copy selected nodes (Ctrl+C or Cmd+C)
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        copySelectedNodes();
      }
      // Paste nodes (Ctrl+V or Cmd+V)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        pasteNodes();
      }
      // Select all nodes (Ctrl+A)
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        selectAllNodes();
      }
      // Undo last command (Ctrl+Z)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undo();
      }
      // Regular C and V keys (without modifier)
      if (!event.ctrlKey && !event.metaKey) {
        if (event.key === 'c') {
          event.preventDefault();
          copySelectedNodes();
        }
        if (event.key === 'v') {
          event.preventDefault();
          pasteNodes();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, deleteSelectedNodes, copySelectedNodes, pasteNodes, selectAllNodes, undo]);

  const toggleLeftSidebar = useCallback(() => {
    setLeftSidebarCollapsed(prev => !prev);
  }, []);

  const toggleRightPanel = useCallback(() => {
    setRightPanelCollapsed(prev => !prev);
  }, []);

  return (
    <div className="flex flex-1">
      {/* Left Sidebar - Data Sources & Tools */}
      <div className="border-r bg-white">
        <LeftSidebar 
          onDataLoaded={handleDataLoaded}
          onMonetizationDataLoaded={handleMonetizationDataLoaded}
          onAddNode={addNewNode}
          collapsed={leftSidebarCollapsed}
          onToggleCollapse={toggleLeftSidebar}
          currentDomainId={currentDomainId}
        />
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onSelectionChange={onSelectionChange}
          onMoveEnd={onMoveEnd}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable
          nodesConnectable
          elementsSelectable
          selectionOnDrag
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Right Properties Panel */}
      <div className="border-l bg-white">
        <RightPropertiesPanel 
          selectedNode={selectedNode}
          selectedNodes={selectedNodes}
          onDeleteNode={deleteSelectedNodes}
          onUpdateNode={updateNode}
          monetizationData={monetizationData}
          collapsed={rightPanelCollapsed}
          onToggleCollapse={toggleRightPanel}
          onSaveGraph={saveGraphToLocalStorage}
          onLoadGraph={loadGraphFromLocalStorage}
          onExportGraph={exportGraphToJSON}
          onImportGraph={importGraphFromJSON}
          onAutoLayout={applyAutoLayout}
          onRunSimulation={runSimulation}
          simulationRunning={isSimulationRunning}
          simulationResults={_simulationResults}
          llmApiKey={llmApiKey}
          onLlmApiKeyChange={setLlmApiKey}
          isEnvApiKey={isUsingEnvKey}
          llmSuggestions={llmSuggestions}
          isLlmLoading={isLlmLoading}
          llmError={llmError}
          onGetLlmSuggestions={getLlmSuggestions}
          onApplyLlmSuggestion={applyLlmSuggestion}
        />
      </div>

      {/* Notification Overlay */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="font-medium">{notification.message}</div>
        </div>
      )}
    </div>
  );
};

export default SystemsViewer;