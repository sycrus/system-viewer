import * as React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

const FlowNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-green-100 border-2 min-w-[120px] text-center ${
      selected ? 'border-green-600 shadow-xl' : 'border-green-400'
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="font-bold text-green-800">{data.label}</div>
       <div className="text-lg font-mono my-1">{data.rate} / time</div>
       <div className="text-xs text-gray-600">{data.unit}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

export default FlowNode;