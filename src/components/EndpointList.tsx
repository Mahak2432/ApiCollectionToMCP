import { useState } from 'react';
import type { Endpoint, MethodPermissions, HttpMethod } from '../types';
import EndpointCard from './EndpointCard';

interface Props {
  endpoints: Endpoint[];
  selectedId: string | null;
  permissions: MethodPermissions;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function EndpointList({
  endpoints,
  selectedId,
  permissions,
  onSelect,
  onAdd,
  onDelete,
  onDuplicate,
}: Props) {
  const [filter, setFilter] = useState('');

  const filtered = endpoints.filter(
    (ep) =>
      ep.path.toLowerCase().includes(filter.toLowerCase()) ||
      ep.toolName.toLowerCase().includes(filter.toLowerCase()) ||
      ep.description.toLowerCase().includes(filter.toLowerCase())
  );

  const groups = filtered.reduce((acc, ep) => {
    const g = ep.group || 'default';
    if (!acc[g]) acc[g] = [];
    acc[g].push(ep);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter endpoints..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
          <button
            onClick={onAdd}
            className="px-3 py-1.5 bg-forge-600 hover:bg-forge-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
          >
            + Add
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
          {filter && ` (${filtered.length} shown)`}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {Object.entries(groups).map(([group, eps]) => (
          <div key={group}>
            {Object.keys(groups).length > 1 && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-900/50">
                {group}
              </div>
            )}
            {eps.map((ep) => (
              <EndpointCard
                key={ep.id}
                endpoint={ep}
                isSelected={ep.id === selectedId}
                isAllowed={permissions[ep.method as keyof MethodPermissions]}
                onSelect={() => onSelect(ep.id)}
                onDelete={() => onDelete(ep.id)}
                onDuplicate={() => onDuplicate(ep.id)}
              />
            ))}
          </div>
        ))}

        {endpoints.length === 0 && (
          <div className="p-6 text-center text-gray-500 text-sm">
            <p>No endpoints yet</p>
            <p className="text-xs mt-1">Click "+ Add" or use Import</p>
          </div>
        )}
      </div>
    </div>
  );
}
