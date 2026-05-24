import { useState } from 'react';
import type { Endpoint, AuthConfig, HttpMethod } from '../types';
import { HTTP_METHODS, METHOD_COLORS, generateToolName } from '../types';
import ParamsEditor from './ParamsEditor';
import JsonEditor from './JsonEditor';
import ApiTester from './ApiTester';

interface Props {
  endpoint: Endpoint;
  baseUrl: string;
  auth: AuthConfig;
  onChange: (endpoint: Endpoint) => void;
}

export default function EndpointEditor({ endpoint, baseUrl, auth, onChange }: Props) {
  const [showTester, setShowTester] = useState(false);

  const update = (partial: Partial<Endpoint>) => {
    const updated = { ...endpoint, ...partial };
    if (partial.method || partial.path) {
      if (!endpoint.toolName || endpoint.toolName === generateToolName(endpoint.method, endpoint.path)) {
        updated.toolName = generateToolName(updated.method, updated.path);
      }
    }
    onChange(updated);
  };

  const headersArray = Object.entries(endpoint.headers);
  const setHeaders = (entries: [string, string][]) => {
    update({ headers: Object.fromEntries(entries) });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Method + Path */}
      <div className="flex gap-2">
        <select
          value={endpoint.method}
          onChange={(e) => update({ method: e.target.value as HttpMethod })}
          className={`w-28 border rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none ${METHOD_COLORS[endpoint.method]} bg-gray-800`}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={endpoint.path}
          onChange={(e) => update({ path: e.target.value })}
          placeholder="/users/{id}/posts"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-forge-500"
        />
        <button
          onClick={() => setShowTester(!showTester)}
          className={`px-4 py-2.5 text-sm rounded-lg transition-colors ${
            showTester
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'
          }`}
        >
          Test
        </button>
      </div>

      {/* Tool name + Description */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Tool Name (MCP)</label>
          <input
            type="text"
            value={endpoint.toolName}
            onChange={(e) => update({ toolName: e.target.value })}
            placeholder="Auto-generated from path"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Group / Category</label>
          <input
            type="text"
            value={endpoint.group}
            onChange={(e) => update({ group: e.target.value })}
            placeholder="default"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea
          value={endpoint.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="What does this endpoint do? This becomes the MCP tool description."
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-forge-500 resize-none"
        />
      </div>

      {/* Toggle + Rate Limit */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={endpoint.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="rounded border-gray-600 bg-gray-800 text-forge-500 focus:ring-forge-500"
          />
          Include in generated MCP
        </label>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-gray-500">Rate limit:</label>
          <input
            type="number"
            value={endpoint.rateLimit?.maxRequests || ''}
            onChange={(e) =>
              update({
                rateLimit: {
                  maxRequests: parseInt(e.target.value) || 0,
                  windowSeconds: endpoint.rateLimit?.windowSeconds || 60,
                },
              })
            }
            placeholder="max"
            className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
          <span className="text-xs text-gray-500">per</span>
          <input
            type="number"
            value={endpoint.rateLimit?.windowSeconds || ''}
            onChange={(e) =>
              update({
                rateLimit: {
                  maxRequests: endpoint.rateLimit?.maxRequests || 10,
                  windowSeconds: parseInt(e.target.value) || 60,
                },
              })
            }
            placeholder="sec"
            className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
          />
          <span className="text-xs text-gray-500">s</span>
        </div>
      </div>

      {/* Headers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Headers</label>
          <button
            onClick={() => setHeaders([...headersArray, ['', '']])}
            className="text-xs text-forge-400 hover:text-forge-300"
          >
            + Add
          </button>
        </div>
        {headersArray.map(([key, val], i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={key}
              onChange={(e) => {
                const next = [...headersArray];
                next[i] = [e.target.value, val];
                setHeaders(next);
              }}
              placeholder="Header name"
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
            />
            <input
              type="text"
              value={val}
              onChange={(e) => {
                const next = [...headersArray];
                next[i] = [key, e.target.value];
                setHeaders(next);
              }}
              placeholder="Value"
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-forge-500"
            />
            <button
              onClick={() => setHeaders(headersArray.filter((_, j) => j !== i))}
              className="text-gray-500 hover:text-red-400 text-xs px-2"
            >
              &#x2715;
            </button>
          </div>
        ))}
      </div>

      {/* Query Params */}
      <ParamsEditor
        label="Query Parameters"
        params={endpoint.queryParams}
        onChange={(queryParams) => update({ queryParams })}
      />

      {/* Path Params */}
      <ParamsEditor
        label="Path Parameters"
        params={endpoint.pathParams}
        onChange={(pathParams) => update({ pathParams })}
      />

      {/* Body Schema */}
      {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
        <JsonEditor
          label="Request Body Schema (JSON)"
          value={endpoint.bodySchema}
          onChange={(bodySchema) => update({ bodySchema })}
          placeholder='{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" }\n  }\n}'
        />
      )}

      {/* Response Schema */}
      <JsonEditor
        label="Response Schema (JSON)"
        value={endpoint.responseSchema}
        onChange={(responseSchema) => update({ responseSchema })}
        placeholder="Auto-detected after testing, or define manually"
        rows={4}
      />

      {/* Examples */}
      <div className="grid grid-cols-2 gap-3">
        <JsonEditor
          label="Example Request"
          value={endpoint.examples.request || ''}
          onChange={(request) => update({ examples: { ...endpoint.examples, request } })}
          rows={4}
          placeholder='{ "name": "John" }'
        />
        <JsonEditor
          label="Example Response"
          value={endpoint.examples.response || ''}
          onChange={(response) => update({ examples: { ...endpoint.examples, response } })}
          rows={4}
          placeholder='{ "id": 1, "name": "John" }'
        />
      </div>

      {/* API Tester */}
      {showTester && (
        <ApiTester
          endpoint={endpoint}
          baseUrl={baseUrl}
          auth={auth}
          onSchemaDetected={(schema) => update({ responseSchema: schema })}
          onTestResult={(lastTestResult) => update({ lastTestResult })}
        />
      )}
    </div>
  );
}
