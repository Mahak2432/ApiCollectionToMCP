import { useState, useEffect } from 'react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/github-dark.css';
import type { McpProject } from '../types';
import { generateMcpServer } from '../api';

hljs.registerLanguage('typescript', typescript);

interface Props {
  project: McpProject;
}

export default function CodePreview({ project }: Props) {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateMcpServer(project);
      setCode(result);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (project.endpoints.length > 0) {
      generate();
    }
  }, []);

  const highlightedCode = code
    ? hljs.highlight(code, { language: 'typescript' }).value
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-300">Code Preview</h3>
          <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded font-mono">
            src/index.ts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!code}
            className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors disabled:opacity-50"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={generate}
            disabled={loading || project.endpoints.length === 0}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              loading
                ? 'bg-gray-700 text-gray-500'
                : 'bg-forge-600 hover:bg-forge-700 text-white'
            }`}
          >
            {loading ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {error && (
          <div className="m-4 text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {project.endpoints.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Add endpoints to see the generated code
          </div>
        )}

        {code && (
          <pre className="p-4 text-xs leading-relaxed">
            <code
              className="language-typescript"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        )}
      </div>
    </div>
  );
}
