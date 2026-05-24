interface Props {
  name: string;
  description: string;
  version: string;
  baseUrl: string;
  onChange: (updates: { name?: string; description?: string; version?: string; baseUrl?: string }) => void;
}

export default function ServerConfig({ name, description, version, baseUrl, onChange }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Server Config</h2>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Server name"
          className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
        />
        <input
          type="text"
          value={version}
          onChange={(e) => onChange({ version: e.target.value })}
          placeholder="Version"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
        />
      </div>
      <input
        type="text"
        value={description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Server description"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
      />
      <div>
        <label className="block text-xs text-gray-400 mb-1">Base URL</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => onChange({ baseUrl: e.target.value })}
          placeholder="https://api.example.com/v1"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500 font-mono"
        />
      </div>
    </div>
  );
}
