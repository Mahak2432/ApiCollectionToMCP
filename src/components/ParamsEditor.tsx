import type { ParamDef } from '../types';

interface Props {
  label: string;
  params: ParamDef[];
  onChange: (params: ParamDef[]) => void;
}

export default function ParamsEditor({ label, params, onChange }: Props) {
  const addParam = () => {
    onChange([...params, { name: '', type: 'string', required: false, description: '' }]);
  };

  const updateParam = (index: number, updates: Partial<ParamDef>) => {
    onChange(params.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  const removeParam = (index: number) => {
    onChange(params.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
        <button
          onClick={addParam}
          className="text-xs text-forge-400 hover:text-forge-300 transition-colors"
        >
          + Add
        </button>
      </div>
      {params.length === 0 && (
        <p className="text-xs text-gray-600 italic">No parameters</p>
      )}
      {params.map((param, i) => (
        <div key={i} className="grid grid-cols-12 gap-1.5 items-start">
          <input
            type="text"
            value={param.name}
            onChange={(e) => updateParam(i, { name: e.target.value })}
            placeholder="Name"
            className="col-span-3 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
          <select
            value={param.type}
            onChange={(e) => updateParam(i, { type: e.target.value as ParamDef['type'] })}
            className="col-span-2 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-forge-500"
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
          </select>
          <input
            type="text"
            value={param.description}
            onChange={(e) => updateParam(i, { description: e.target.value })}
            placeholder="Description"
            className="col-span-4 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
          <label className="col-span-2 flex items-center gap-1 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={param.required}
              onChange={(e) => updateParam(i, { required: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-forge-500 focus:ring-forge-500"
            />
            Req
          </label>
          <button
            onClick={() => removeParam(i)}
            className="col-span-1 text-gray-500 hover:text-red-400 text-xs py-1.5 transition-colors"
          >
            &#x2715;
          </button>
        </div>
      ))}
    </div>
  );
}
