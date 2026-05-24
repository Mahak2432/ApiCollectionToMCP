import { useState } from 'react';
import type { McpProject } from '../types';
import { downloadMcpServer } from '../api';

interface Props {
  project: McpProject;
}

export default function DownloadPanel({ project }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadMcpServer(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
    setDownloading(false);
  };

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        [project.name]: {
          command: 'npx',
          args: ['tsx', 'src/index.ts'],
          env: {
            API_BASE_URL: project.baseUrl || 'https://api.example.com',
            ...(project.auth.type !== 'none' ? { API_AUTH_TOKEN: '<your-token-here>' } : {}),
          },
        },
      },
    },
    null,
    2
  );

  const envContent = [
    `API_BASE_URL=${project.baseUrl || 'https://api.example.com'}`,
    project.auth.type === 'bearer' ? `API_AUTH_TOKEN=${project.auth.token || '<your-token>'}` : '',
    project.auth.type === 'api-key' ? `API_AUTH_TOKEN=${project.auth.token || '<your-api-key>'}` : '',
    project.auth.type === 'basic' ? `API_AUTH_USERNAME=${project.auth.username || '<username>'}\nAPI_AUTH_PASSWORD=${project.auth.password || '<password>'}` : '',
    project.auth.type === 'custom-header' ? `API_AUTH_TOKEN=${project.auth.headerValue || '<your-value>'}` : '',
  ].filter(Boolean).join('\n');

  const enabledEndpoints = project.endpoints.filter(
    (ep) => ep.enabled && project.permissions[ep.method]
  );

  const copyText = async (text: string, setCopied: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <div>
        <h3 className="text-lg font-semibold text-white">Download & Deploy</h3>
        <p className="text-sm text-gray-400 mt-1">
          Get your generated MCP server as a ready-to-run project
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{enabledEndpoints.length}</div>
          <div className="text-xs text-gray-400">Active Tools</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">
            {project.endpoints.length - enabledEndpoints.length}
          </div>
          <div className="text-xs text-gray-400">Excluded</div>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading || enabledEndpoints.length === 0}
        className={`w-full py-3 text-sm font-semibold rounded-lg transition-colors ${
          downloading
            ? 'bg-gray-700 text-gray-500 cursor-wait'
            : enabledEndpoints.length === 0
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-forge-600 to-purple-600 hover:from-forge-700 hover:to-purple-700 text-white'
        }`}
      >
        {downloading ? 'Preparing ZIP...' : `Download ${project.name}.zip`}
      </button>

      {/* What's included */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase">Included in ZIP</h4>
        <ul className="text-xs text-gray-300 space-y-1 font-mono">
          <li>package.json</li>
          <li>tsconfig.json</li>
          <li>.env.example</li>
          <li>README.md</li>
          <li>src/index.ts</li>
        </ul>
      </div>

      {/* Claude Desktop Config */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-gray-400 uppercase">Claude Desktop Config</h4>
          <button
            onClick={() => copyText(claudeConfig, setCopiedConfig)}
            className="text-xs text-forge-400 hover:text-forge-300"
          >
            {copiedConfig ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 font-mono overflow-auto max-h-48">
          {claudeConfig}
        </pre>
      </div>

      {/* .env content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-gray-400 uppercase">.env File</h4>
          <button
            onClick={() => copyText(envContent, setCopiedEnv)}
            className="text-xs text-forge-400 hover:text-forge-300"
          >
            {copiedEnv ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 font-mono overflow-auto">
          {envContent}
        </pre>
      </div>

      {/* Quick start */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase">Quick Start</h4>
        <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
          <li>Unzip the downloaded file</li>
          <li>Run <code className="text-forge-400">npm install</code></li>
          <li>Copy <code className="text-forge-400">.env.example</code> to <code className="text-forge-400">.env</code> and fill in your credentials</li>
          <li>Run <code className="text-forge-400">npx tsx src/index.ts</code> to start the server</li>
          <li>Add the config snippet to your Claude Desktop settings</li>
        </ol>
      </div>
    </div>
  );
}
