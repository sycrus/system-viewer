import * as d3 from 'd3';
import type { Node, Edge } from 'reactflow';

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  radius: number;
  originalNode: Node;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  strength: number;
}

/**
 * Options for force-directed layout
 */
export interface LayoutOptions {
  /** Width of the canvas area */
  width?: number;
  /** Height of the canvas area */
  height?: number;
  /** Strength of the charge force (negative for repulsion) */
  chargeStrength?: number;
  /** Link distance between connected nodes */
  linkDistance?: number;
  /** Center force strength */
  centerStrength?: number;
  /** Number of iterations to run the simulation */
  iterations?: number;
}

/**
 * Default layout options
 */
const defaultOptions: LayoutOptions = {
  width: 800,
  height: 600,
  chargeStrength: -300,
  linkDistance: 150,
  centerStrength: 0.1,
  iterations: 300,
};

/**
 * Apply force-directed layout to nodes using D3 force simulation
 * Returns new nodes with updated positions
 */
export const applyForceLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] => {
  const { width, height, chargeStrength, linkDistance, centerStrength, iterations } = {
    ...defaultOptions,
    ...options,
  };

  // Create a copy of nodes to avoid mutating the original
  const nodeCopy = nodes.map(node => ({
    ...node,
    // Ensure position exists
    position: node.position || { x: Math.random() * width!, y: Math.random() * height! },
  }));

  // Create a map of node IDs to their index
  const nodeIndex = new Map<string, number>();
  nodeCopy.forEach((node, i) => nodeIndex.set(node.id, i));

  // Filter edges to only include those where both source and target exist
  const validEdges = edges.filter(
    edge => nodeIndex.has(edge.source) && nodeIndex.has(edge.target)
  );

  // Create D3 simulation data structures
  const simulationNodes: SimulationNode[] = nodeCopy.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    // Add some properties for better layout
    radius: getNodeRadius(node.type || 'default'),
    // Keep reference to original node
    originalNode: node,
  }));

  const simulationLinks: SimulationLink[] = validEdges.map(edge => ({
    source: nodeIndex.get(edge.source)!,
    target: nodeIndex.get(edge.target)!,
    strength: edge.data?.strength || 1,
  }));

  // Create force simulation
  const simulation = d3.forceSimulation<SimulationNode>(simulationNodes)
    .force('charge', d3.forceManyBody().strength(chargeStrength!))
    .force('link', d3.forceLink<SimulationNode, SimulationLink>(simulationLinks)
      .distance(linkDistance!)
      .strength((d) => d.strength))
    .force('center', d3.forceCenter(width! / 2, height! / 2).strength(centerStrength!))
    .force('collision', d3.forceCollide<SimulationNode>().radius((d) => d.radius + 10))
    .stop();

  // Run simulation for fixed number of iterations
  for (let i = 0; i < iterations!; i++) {
    simulation.tick();
  }

  // Update node positions with simulation results
  const updatedNodes = nodeCopy.map((node, index) => {
    const simNode = simulationNodes[index];
    return {
      ...node,
      position: {
        x: Math.max(0, Math.min(width!, simNode.x!)),
        y: Math.max(0, Math.min(height!, simNode.y!)),
      },
    };
  });

  return updatedNodes;
};

/**
 * Apply a simple grid layout to nodes
 */
export const applyGridLayout = (
  nodes: Node[],
  options: { width?: number; height?: number; padding?: number } = {}
): Node[] => {
  const { width = 800, height = 600, padding = 100 } = options;
  
  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  
  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      ...node,
      position: {
        x: col * cellWidth + padding / 2,
        y: row * cellHeight + padding / 2,
      },
    };
  });
};

/**
 * Apply a circular layout to nodes
 */
export const applyCircularLayout = (
  nodes: Node[],
  options: { centerX?: number; centerY?: number; radius?: number } = {}
): Node[] => {
  const { centerX = 400, centerY = 300, radius = 200 } = options;
  
  const angleStep = (2 * Math.PI) / nodes.length;
  
  return nodes.map((node, index) => {
    const angle = index * angleStep;
    
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });
};

/**
 * Get approximate radius based on node type (for collision detection)
 */
const getNodeRadius = (nodeType: string): number => {
  switch (nodeType) {
    case 'stock':
      return 40;
    case 'flow':
      return 30;
    case 'variable':
      return 35;
    default:
      return 30;
  }
};

/**
 * Check if nodes are overlapping or edges are crossing
 * Returns a score where lower is better (less overlap/crossing)
 */
export const getLayoutQualityScore = (
  nodes: Node[],
  edges: Edge[]
): number => {
  let score = 0;
  
  // Penalize node overlaps
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].position.x - nodes[j].position.x;
      const dy = nodes[i].position.y - nodes[j].position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = 60; // Minimum desired distance between nodes
      
      if (distance < minDistance) {
        score += (minDistance - distance) * 10;
      }
    }
  }
  
  // Penalize long edges (encourage compact layout)
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      const dx = sourceNode.position.x - targetNode.position.x;
      const dy = sourceNode.position.y - targetNode.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Ideal edge length is around 150px
      const idealLength = 150;
      score += Math.abs(distance - idealLength) * 0.1;
    }
  });
  
  return score;
};

/**
 * Apply hierarchical layout based on input/output relationships
 * Nodes are placed so that outputs flow to inputs in appropriate directions
 */
export const applyHierarchicalLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] => {
  const { width = 800, height = 600 } = { ...defaultOptions, ...options };
  
  // Create a copy of nodes
  const nodeCopy = nodes.map(node => ({
    ...node,
    position: node.position || { x: Math.random() * width, y: Math.random() * height },
  }));
  
  // Build adjacency lists
  const outgoingEdges = new Map<string, Edge[]>();
  const incomingEdges = new Map<string, Edge[]>();
  const nodeMap = new Map<string, Node>();
  
  nodeCopy.forEach(node => nodeMap.set(node.id, node));
  edges.forEach(edge => {
    // Outgoing from source
    if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, []);
    outgoingEdges.get(edge.source)!.push(edge);
    
    // Incoming to target
    if (!incomingEdges.has(edge.target)) incomingEdges.set(edge.target, []);
    incomingEdges.get(edge.target)!.push(edge);
  });
  
  // Find nodes without incoming edges (sources)
  const sourceNodes = nodeCopy.filter(node => 
    !incomingEdges.has(node.id) || incomingEdges.get(node.id)!.length === 0
  );
  
  // Find nodes without outgoing edges (sinks) - unused but kept for future reference
  // const sinkNodes = nodeCopy.filter(node =>
  //   !outgoingEdges.has(node.id) || outgoingEdges.get(node.id)!.length === 0
  // );
  
  // Assign ranks using BFS from sources
  const ranks = new Map<string, number>();
  const visited = new Set<string>();
  
  // Initialize sources with rank 0
  sourceNodes.forEach(node => {
    ranks.set(node.id, 0);
    visited.add(node.id);
  });
  
  // If no sources found (cycle), start from all nodes
  if (sourceNodes.length === 0) {
    nodeCopy.forEach(node => {
      ranks.set(node.id, 0);
    });
  }
  
  // Perform topological sort-ish ranking
  let changed = true;
  const maxIterations = nodeCopy.length * 2;
  let iteration = 0;
  
  while (changed && iteration < maxIterations) {
    changed = false;
    iteration++;
    
    edges.forEach(edge => {
      const sourceRank = ranks.get(edge.source) || 0;
      const targetRank = ranks.get(edge.target) || 0;
      
      // Source should have lower rank than target (earlier in flow)
      if (sourceRank >= targetRank) {
        ranks.set(edge.target, sourceRank + 1);
        changed = true;
      }
    });
  }
  
  // Determine orientation for each node based on type
  const getNodeOrientation = (node: Node): 'vertical' | 'horizontal' => {
    // Stock and Variable nodes have vertical flow (top to bottom)
    if (node.type === 'stock' || node.type === 'variable') {
      return 'vertical';
    }
    // Flow nodes have horizontal flow (left to right)
    if (node.type === 'flow') {
      return 'horizontal';
    }
    // Default to vertical
    return 'vertical';
  };
  
  // Group nodes by rank
  const nodesByRank = new Map<number, Node[]>();
  nodeCopy.forEach(node => {
    const rank = ranks.get(node.id) || 0;
    if (!nodesByRank.has(rank)) nodesByRank.set(rank, []);
    nodesByRank.get(rank)!.push(node);
  });
  
  // Calculate maximum rank to normalize
  const maxRank = Math.max(...Array.from(nodesByRank.keys()));
  
  // Position nodes based on rank and orientation
  const updatedNodes = nodeCopy.map(node => {
    const rank = ranks.get(node.id) || 0;
    const orientation = getNodeOrientation(node);
    
    // Get nodes in same rank
    const sameRankNodes = nodesByRank.get(rank) || [];
    const indexInRank = sameRankNodes.findIndex(n => n.id === node.id);
    
    if (orientation === 'vertical') {
      // Vertical layout: rank determines Y position, index in rank determines X
      const rankHeight = height / (maxRank + 2);
      const y = (rank + 1) * rankHeight;
      
      const rankWidth = width * 0.8;
      const xSpacing = rankWidth / (sameRankNodes.length + 1);
      const x = (indexInRank + 1) * xSpacing + (width - rankWidth) / 2;
      
      return {
        ...node,
        position: { x, y },
      };
    } else {
      // Horizontal layout: rank determines X position, index in rank determines Y
      const rankWidth = width / (maxRank + 2);
      const x = (rank + 1) * rankWidth;
      
      const rankHeight = height * 0.8;
      const ySpacing = rankHeight / (sameRankNodes.length + 1);
      const y = (indexInRank + 1) * ySpacing + (height - rankHeight) / 2;
      
      return {
        ...node,
        position: { x, y },
      };
    }
  });
  
  // Apply a light force layout to untangle within ranks
  return applyForceLayout(updatedNodes, edges, {
    ...options,
    chargeStrength: -100, // Weaker repulsion since we have hierarchical structure
    linkDistance: 120,
    iterations: 100,
  });
};

/**
 * Apply directional force layout with biases based on node types
 */
export const applyDirectionalLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] => {
  const { width, height, chargeStrength, linkDistance, centerStrength, iterations } = {
    ...defaultOptions,
    ...options,
  };

  // Create a copy of nodes to avoid mutating the original
  const nodeCopy = nodes.map(node => ({
    ...node,
    // Ensure position exists
    position: node.position || { x: Math.random() * width!, y: Math.random() * height! },
  }));

  // Create a map of node IDs to their index
  const nodeIndex = new Map<string, number>();
  nodeCopy.forEach((node, i) => nodeIndex.set(node.id, i));

  // Filter edges to only include those where both source and target exist
  const validEdges = edges.filter(
    edge => nodeIndex.has(edge.source) && nodeIndex.has(edge.target)
  );

  // Create D3 simulation data structures
  const simulationNodes: SimulationNode[] = nodeCopy.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    // Add some properties for better layout
    radius: getNodeRadius(node.type || 'default'),
    // Keep reference to original node
    originalNode: node,
  }));

  const simulationLinks: SimulationLink[] = validEdges.map(edge => ({
    source: nodeIndex.get(edge.source)!,
    target: nodeIndex.get(edge.target)!,
    strength: edge.data?.strength || 1,
  }));

  // Create force simulation with directional bias
  const simulation = d3.forceSimulation<SimulationNode>(simulationNodes)
    .force('charge', d3.forceManyBody().strength(chargeStrength!))
    .force('link', d3.forceLink<SimulationNode, SimulationLink>(simulationLinks)
      .distance(linkDistance!)
      .strength((d) => d.strength))
    .force('center', d3.forceCenter(width! / 2, height! / 2).strength(centerStrength!))
    .force('collision', d3.forceCollide<SimulationNode>().radius((d) => d.radius + 10))
    .force('direction', () => {
      // Custom directional force based on node types
      simulationNodes.forEach((node) => {
        if (!node.x || !node.y) return;
        
        let dx = 0;
        let dy = 0;
        const nodeType = node.originalNode.type;
        
        // Apply directional bias based on outgoing edges
        const outgoing = validEdges.filter(edge => edge.source === node.id);
        outgoing.forEach(edge => {
          const targetIdx = nodeIndex.get(edge.target);
          if (targetIdx === undefined) return;
          
          const target = simulationNodes[targetIdx];
          if (!target.x || !target.y) return;
          
          // Determine desired direction based on node types
          if (nodeType === 'flow') {
            // Flow nodes: source should be left of target
            const desiredDX = target.x! - node.x! - 100; // Want source.x < target.x
            dx += desiredDX * 0.01;
          } else {
            // Stock and Variable nodes: source should be above target
            const desiredDY = target.y! - node.y! - 100; // Want source.y < target.y
            dy += desiredDY * 0.01;
          }
        });
        
        // Apply directional bias based on incoming edges
        const incoming = validEdges.filter(edge => edge.target === node.id);
        incoming.forEach(edge => {
          const sourceIdx = nodeIndex.get(edge.source);
          if (sourceIdx === undefined) return;
          
          const source = simulationNodes[sourceIdx];
          if (!source.x || !source.y) return;
          
          const sourceType = source.originalNode.type;
          
          if (sourceType === 'flow') {
            // Coming from flow node: should be to the right of source
            const desiredDX = source.x! - node.x! + 100; // Want node.x > source.x
            dx += desiredDX * 0.01;
          } else {
            // Coming from stock/variable: should be below source
            const desiredDY = source.y! - node.y! + 100; // Want node.y > source.y
            dy += desiredDY * 0.01;
          }
        });
        
        // Apply the force
        node.x! += dx;
        node.y! += dy;
      });
    })
    .stop();

  // Run simulation for fixed number of iterations
  for (let i = 0; i < iterations!; i++) {
    simulation.tick();
  }

  // Update node positions with simulation results
  const updatedNodes = nodeCopy.map((node, index) => {
    const simNode = simulationNodes[index];
    return {
      ...node,
      position: {
        x: Math.max(0, Math.min(width!, simNode.x!)),
        y: Math.max(0, Math.min(height!, simNode.y!)),
      },
    };
  });

  return updatedNodes;
};

/**
 * Optimize layout by trying multiple algorithms and picking the best
 */
export const optimizeLayout = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] => {
  const layouts = [
    { name: 'hierarchical', apply: () => applyHierarchicalLayout(nodes, edges, options) },
    { name: 'directional', apply: () => applyDirectionalLayout(nodes, edges, options) },
    { name: 'force', apply: () => applyForceLayout(nodes, edges, options) },
    { name: 'grid', apply: () => applyGridLayout(nodes, { 
      width: options.width, 
      height: options.height,
      padding: 100 
    }) },
    { name: 'circular', apply: () => applyCircularLayout(nodes, { 
      centerX: options.width ? options.width / 2 : 400,
      centerY: options.height ? options.height / 2 : 300,
      radius: Math.min(options.width || 800, options.height || 600) * 0.25
    }) },
  ];
  
  let bestNodes = nodes;
  let bestScore = getLayoutQualityScore(nodes, edges);
  
  for (const layout of layouts) {
    try {
      const newNodes = layout.apply();
      const newScore = getLayoutQualityScore(newNodes, edges);
      
      if (newScore < bestScore) {
        bestNodes = newNodes;
        bestScore = newScore;
      }
    } catch (error) {
      console.warn(`Layout ${layout.name} failed:`, error);
    }
  }
  
  return bestNodes;
};