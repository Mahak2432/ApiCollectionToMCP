import type { AuthConfig } from '../types';

interface Props {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

const AUTH_TYPES = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api-key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'custom-header', label: 'Custom Header' },
] as const;

export default function AuthConfigPanel({ auth, onChange }: Props) {
  const update = (partial: Partial<AuthConfig>) => onChange({ ...auth, ...partial });

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Authentication</h2>
      <select
        value={auth.type}
        onChange={(e) => update({ type: e.target.value as AuthConfig['type'] })}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-forge-500"
      >
        {AUTH_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {auth.type === 'bearer' && (
        <input
          type="password"
          value={auth.token}
          onChange={(e) => update({ token: e.target.value })}
          placeholder="Enter Bearer token"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500 font-mono"
        />
      )}

      {auth.type === 'api-key' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={auth.apiKeyName}
              onChange={(e) => update({ apiKeyName: e.target.value })}
              placeholder="Key name (e.g. X-API-Key)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
            />
            <select
              value={auth.apiKeyLocation}
              onChange={(e) => update({ apiKeyLocation: e.target.value as 'header' | 'query' })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-forge-500"
            >
              <option value="header">Header</option>
              <option value="query">Query</option>
            </select>
          </div>
          <input
            type="password"
            value={auth.token}
            onChange={(e) => update({ token: e.target.value })}
            placeholder="API key value"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500 font-mono"
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={auth.username}
            onChange={(e) => update({ username: e.target.value })}
            placeholder="Username"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
          <input
            type="password"
            value={auth.password}
            onChange={(e) => update({ password: e.target.value })}
            placeholder="Password"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
        </div>
      )}

      {auth.type === 'custom-header' && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={auth.headerName}
            onChange={(e) => update({ headerName: e.target.value })}
            placeholder="Header name"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
          <input
            type="password"
            value={auth.headerValue}
            onChange={(e) => update({ headerValue: e.target.value })}
            placeholder="Header value"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
        </div>
      )}
    </div>
  );
}
