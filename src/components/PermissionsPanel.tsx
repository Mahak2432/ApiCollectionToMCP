import type { MethodPermissions, HttpMethod } from '../types';
import { HTTP_METHODS, METHOD_COLORS } from '../types';

interface Props {
  permissions: MethodPermissions;
  onChange: (permissions: MethodPermissions) => void;
  endpointCounts: Record<string, number>;
}

const METHOD_DESCRIPTIONS: Record<HttpMethod, string> = {
  GET: 'Read data (safe)',
  POST: 'Create resources',
  PUT: 'Replace resources',
  PATCH: 'Update fields',
  DELETE: 'Remove resources',
  HEAD: 'Check headers only',
  OPTIONS: 'Check capabilities',
};

const RISK_LEVELS: Record<HttpMethod, string> = {
  GET: 'text-emerald-400',
  POST: 'text-amber-400',
  PUT: 'text-amber-400',
  PATCH: 'text-amber-400',
  DELETE: 'text-red-400',
  HEAD: 'text-emerald-400',
  OPTIONS: 'text-gray-400',
};

export default function PermissionsPanel({ permissions, onChange, endpointCounts }: Props) {
  const toggle = (method: HttpMethod) => {
    onChange({ ...permissions, [method]: !permissions[method] });
  };

  const enabledCount = HTTP_METHODS.filter((m) => permissions[m]).length;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          AI Permissions
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Control which HTTP methods the AI can use
        </p>
      </div>

      <div className="space-y-1">
        {HTTP_METHODS.map((method) => (
          <button
            key={method}
            onClick={() => toggle(method)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
              permissions[method]
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-gray-900/30 border border-transparent hover:border-gray-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                permissions[method]
                  ? 'bg-forge-500 border-forge-500'
                  : 'border-gray-600'
              }`}
            >
              {permissions[method] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${RISK_LEVELS[method]}`}>{method}</span>
                {endpointCounts[method] > 0 && (
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                    {endpointCounts[method]}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">{METHOD_DESCRIPTIONS[method]}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          {enabledCount} of {HTTP_METHODS.length} methods enabled
        </p>
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => onChange({
              GET: true, POST: true, PUT: true, PATCH: true,
              DELETE: true, HEAD: true, OPTIONS: true,
            })}
            className="text-[10px] text-forge-400 hover:text-forge-300"
          >
            Enable all
          </button>
          <span className="text-gray-700">|</span>
          <button
            onClick={() => onChange({
              GET: true, POST: false, PUT: false, PATCH: false,
              DELETE: false, HEAD: false, OPTIONS: false,
            })}
            className="text-[10px] text-forge-400 hover:text-forge-300"
          >
            Read only
          </button>
          <span className="text-gray-700">|</span>
          <button
            onClick={() => onChange({
              GET: false, POST: false, PUT: false, PATCH: false,
              DELETE: false, HEAD: false, OPTIONS: false,
            })}
            className="text-[10px] text-forge-400 hover:text-forge-300"
          >
            Disable all
          </button>
        </div>
      </div>
    </div>
  );
}
