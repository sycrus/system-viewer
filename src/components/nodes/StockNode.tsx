import * as React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

const StockNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-blue-100 border-2 min-w-[120px] text-center ${
      selected ? 'border-blue-600 shadow-xl' : 'border-blue-400'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="font-bold text-blue-800">{data.label}</div>
      <div className="text-2xl font-mono my-1">{data.value}</div>
      <div className="text-sm text-gray-600">{data.unit}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default StockNode;