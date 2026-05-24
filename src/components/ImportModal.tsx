import { useState } from 'react';
import type { Endpoint } from '../types';
import { importOpenApi, importPostman, importCurl } from '../api';

interface Props {
  onImport: (endpoints: Endpoint[], baseUrl?: string) => void;
  onClose: () => void;
}

type ImportType = 'openapi' | 'postman' | 'curl';

export default function ImportModal({ onImport, onClose }: Props) {
  const [type, setType] = useState<ImportType>('openapi');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      switch (type) {
        case 'openapi': {
          const result = await importOpenApi(input);
          onImport(result.endpoints, result.baseUrl);
          break;
        }
        case 'postman': {
          const result = await importPostman(input);
          onImport(result.endpoints);
          break;
        }
        case 'curl': {
          const result = await importCurl(input);
          onImport([result.endpoint]);
          break;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
    }
    setLoading(false);
  };

  const placeholders: Record<ImportType, string> = {
    openapi: 'Paste your OpenAPI/Swagger JSON or YAML spec here...',
    postman: 'Paste your Postman Collection JSON export here...',
    curl: 'curl -X GET https://api.example.com/users -H "Authorization: Bearer token"',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Import Endpoints</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&#x2715;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Import type tabs */}
          <div className="flex gap-2">
            {([
              ['openapi', 'OpenAPI / Swagger'],
              ['postman', 'Postman Collection'],
              ['curl', 'cURL Command'],
            ] as [ImportType, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => { setType(t); setError(null); }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  type === t
                    ? 'bg-forge-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400">
            {type === 'openapi' && 'Paste an OpenAPI 3.x or Swagger 2.x specification (JSON or YAML). All endpoints will be imported with their parameters and schemas.'}
            {type === 'postman' && 'Paste a Postman Collection v2.1 JSON export. Each request in the collection becomes an endpoint.'}
            {type === 'curl' && 'Paste a cURL command. The method, URL, headers, and body will be parsed into an endpoint definition.'}
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholders[type]}
            rows={type === 'curl' ? 4 : 14}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-forge-500 resize-y"
            spellCheck={false}
          />

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !input.trim()}
            className={`px-6 py-2 text-sm rounded-lg transition-colors ${
              loading
                ? 'bg-gray-700 text-gray-500 cursor-wait'
                : 'bg-forge-600 hover:bg-forge-700 text-white'
            }`}
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
