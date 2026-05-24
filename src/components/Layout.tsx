import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forge-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            MF
          </div>
          <h1 className="text-lg font-semibold text-white">MCP Forge</h1>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">v1.0</span>
        <div className="flex-1" />
        <span className="text-xs text-gray-500">API to MCP Server Generator</span>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
