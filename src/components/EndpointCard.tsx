import type { Endpoint, MethodPermissions } from '../types';
import { METHOD_COLORS } from '../types';

interface Props {
  endpoint: Endpoint;
  isSelected: boolean;
  isAllowed: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function EndpointCard({
  endpoint,
  isSelected,
  isAllowed,
  onSelect,
  onDelete,
  onDuplicate,
}: Props) {
  return (
    <div
      onClick={onSelect}
      className={`group px-3 py-2.5 cursor-pointer border-l-2 transition-all ${
        isSelected
          ? 'bg-gray-800 border-forge-500'
          : 'border-transparent hover:bg-gray-800/50 hover:border-gray-600'
      } ${!isAllowed ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${METHOD_COLORS[endpoint.method]}`}
        >
          {endpoint.method}
        </span>
        <span className="text-sm font-mono text-gray-300 truncate flex-1">
          {endpoint.path || '/...'}
        </span>
        {!endpoint.enabled && (
          <span className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">OFF</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500 truncate">
          {endpoint.toolName || endpoint.description || 'Untitled'}
        </span>
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="text-gray-500 hover:text-gray-300 text-xs px-1"
            title="Duplicate"
          >
            &#x2398;
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-gray-500 hover:text-red-400 text-xs px-1"
            title="Delete"
          >
            &#x2715;
          </button>
        </div>
      </div>
      {!isAllowed && (
        <div className="text-[10px] text-amber-500 mt-1">
          {endpoint.method} not allowed in permissions
        </div>
      )}
    </div>
  );
}
