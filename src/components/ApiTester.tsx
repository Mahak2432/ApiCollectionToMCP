import { useState } from 'react';
import type { Endpoint, AuthConfig, TestResult } from '../types';
import { testEndpoint } from '../api';

interface Props {
  endpoint: Endpoint;
  baseUrl: string;
  auth: AuthConfig;
  onSchemaDetected: (schema: string) => void;
  onTestResult: (result: TestResult) => void;
}

export default function ApiTester({ endpoint, baseUrl, auth, onSchemaDetected, onTestResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(endpoint.lastTestResult || null);

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await testEndpoint(baseUrl, endpoint, auth);
      setResult(res);
      onTestResult(res);
      if (res.body && !res.error) {
        try {
          const parsed = JSON.parse(res.body);
          const schema = inferSchemaFromValue(parsed);
          onSchemaDetected(JSON.stringify(schema, null, 2));
        } catch {}
      }
    } catch (err: any) {
      const errorResult: TestResult = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: '',
        duration: 0,
        timestamp: Date.now(),
        error: err.message,
      };
      setResult(errorResult);
      onTestResult(errorResult);
    }
    setLoading(false);
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <span className="text-xs font-semibold text-gray-300">API Tester</span>
        <button
          onClick={runTest}
          disabled={loading || !baseUrl}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            loading
              ? 'bg-gray-700 text-gray-500 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {loading ? 'Testing...' : 'Send Request'}
        </button>
      </div>

      {!baseUrl && (
        <div className="px-4 py-3 text-xs text-amber-400 bg-amber-500/10">
          Set a Base URL in the server config above to test endpoints
        </div>
      )}

      {result && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold ${
                result.error ? 'text-red-400' :
                result.status < 300 ? 'text-emerald-400' :
                result.status < 400 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {result.error ? 'ERROR' : result.status}
            </span>
            <span className="text-xs text-gray-400">{result.statusText}</span>
            {result.duration > 0 && (
              <span className="text-xs text-gray-500">{result.duration}ms</span>
            )}
          </div>

          {result.error && (
            <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded">
              {result.error}
            </div>
          )}

          {result.body && (
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Response Body</label>
              <pre className="mt-1 bg-gray-900 rounded p-3 text-xs text-gray-300 font-mono overflow-auto max-h-60 whitespace-pre-wrap">
                {formatJson(result.body)}
              </pre>
            </div>
          )}

          {Object.keys(result.headers).length > 0 && (
            <details className="text-xs">
              <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
                Response Headers ({Object.keys(result.headers).length})
              </summary>
              <div className="mt-1 space-y-0.5">
                {Object.entries(result.headers).map(([k, v]) => (
                  <div key={k} className="font-mono">
                    <span className="text-forge-400">{k}</span>
                    <span className="text-gray-600">: </span>
                    <span className="text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function inferSchemaFromValue(value: any): any {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferSchemaFromValue(value[0]) : {},
    };
  }
  if (typeof value === 'object') {
    const properties: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      properties[k] = inferSchemaFromValue(v);
    }
    return { type: 'object', properties };
  }
  return { type: typeof value };
}
