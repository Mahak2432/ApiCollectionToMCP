import { useState } from 'react';
import type { McpProject, Endpoint, TestResult } from '../types';
import { METHOD_COLORS } from '../types';
import { analyzeEndpoints } from '../api';

interface Props {
  project: McpProject;
  onUpdateEndpoint: (endpoint: Endpoint) => void;
}

interface AnalysisState {
  results: Map<string, TestResult>;
  loading: boolean;
  error?: string;
}

export default function AnalysisPanel({ project, onUpdateEndpoint }: Props) {
  const [state, setState] = useState<AnalysisState>({
    results: new Map(),
    loading: false,
  });

  const runAnalysis = async () => {
    if (!project.baseUrl) return;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const enabledEndpoints = project.endpoints.filter(
        (ep) => ep.enabled && project.permissions[ep.method]
      );
      const results = await analyzeEndpoints(project.baseUrl, enabledEndpoints, project.auth);

      const resultMap = new Map<string, TestResult>();
      enabledEndpoints.forEach((ep, i) => {
        if (results[i]) {
          resultMap.set(ep.id, results[i]);
          onUpdateEndpoint({ ...ep, lastTestResult: results[i] });
        }
      });

      setState({ results: resultMap, loading: false });
    } catch (err: any) {
      setState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const enabledEndpoints = project.endpoints.filter(
    (ep) => ep.enabled && project.permissions[ep.method]
  );
  const successCount = Array.from(state.results.values()).filter(
    (r) => r.status >= 200 && r.status < 300
  ).length;
  const errorCount = Array.from(state.results.values()).filter(
    (r) => r.error || r.status >= 400
  ).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">API Analysis</h2>
          <p className="text-sm text-gray-400">
            Test all enabled endpoints and auto-detect response schemas
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={state.loading || !project.baseUrl || enabledEndpoints.length === 0}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            state.loading
              ? 'bg-gray-700 text-gray-500 cursor-wait'
              : 'bg-forge-600 hover:bg-forge-700 text-white'
          }`}
        >
          {state.loading ? 'Analyzing...' : `Analyze ${enabledEndpoints.length} Endpoints`}
        </button>
      </div>

      {!project.baseUrl && (
        <div className="text-sm text-amber-400 bg-amber-500/10 px-4 py-3 rounded-lg">
          Set a Base URL in the server config to run analysis
        </div>
      )}

      {state.error && (
        <div className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      {state.results.size > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{state.results.size}</div>
            <div className="text-xs text-gray-400">Tested</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{successCount}</div>
            <div className="text-xs text-gray-400">Passed</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{errorCount}</div>
            <div className="text-xs text-gray-400">Failed</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {enabledEndpoints.map((ep) => {
          const result = state.results.get(ep.id);
          return (
            <div
              key={ep.id}
              className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-800"
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${METHOD_COLORS[ep.method]}`}>
                {ep.method}
              </span>
              <span className="text-sm font-mono text-gray-300 flex-1 truncate">{ep.path}</span>
              {result ? (
                <>
                  <span
                    className={`text-sm font-bold ${
                      result.error ? 'text-red-400' :
                      result.status < 300 ? 'text-emerald-400' :
                      result.status < 400 ? 'text-amber-400' : 'text-red-400'
                    }`}
                  >
                    {result.error ? 'ERR' : result.status}
                  </span>
                  {result.duration > 0 && (
                    <span className="text-xs text-gray-500">{result.duration}ms</span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-600">Not tested</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
