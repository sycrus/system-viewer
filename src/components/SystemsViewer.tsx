import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import type {
  Node,
  Edge,
  Connection,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import StockNode from './nodes/StockNode';
import FlowNode from './nodes/FlowNode';
import VariableNode from './nodes/VariableNode';

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

const SystemsViewer: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNewNode = useCallback((nodeType: string, data: any) => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type: nodeType,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const handleDataLoaded = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  }, [setNodes, setEdges]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
    ));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const updateNode = useCallback((nodeId: string, updates: any) => {
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
  }, [setNodes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNode) {
        event.preventDefault();
        deleteSelectedNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteSelectedNode]);

  return (
    <div className="flex flex-1">
      <Sidebar 
        selectedNode={selectedNode} 
        onAddNode={addNewNode}
        onDataLoaded={handleDataLoaded}
        onDeleteNode={deleteSelectedNode}
        onUpdateNode={updateNode}
      />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
};

export default SystemsViewer;