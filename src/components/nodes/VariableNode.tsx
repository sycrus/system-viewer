import * as React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

const VariableNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-purple-100 border-2 min-w-[120px] text-center ${
      selected ? 'border-purple-600 shadow-xl' : 'border-purple-400'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="font-bold text-purple-800">{data.label}</div>
      <div className="text-lg font-mono my-1">{data.value}</div>
      {data.expression && (
        <div className="text-xs text-gray-600 mt-1">{data.expression}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default VariableNode;