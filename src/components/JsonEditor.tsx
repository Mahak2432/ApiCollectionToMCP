import { useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function JsonEditor({ label, value, onChange, placeholder, rows = 6 }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    onChange(text);
    if (!text.trim()) {
      setError(null);
      return;
    }
    try {
      JSON.parse(text);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleFormat = () => {
    if (!value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch {
      // keep as-is
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
        <button
          onClick={handleFormat}
          className="text-xs text-forge-400 hover:text-forge-300 transition-colors"
        >
          Format
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || '{\n  "key": "value"\n}'}
        rows={rows}
        className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 font-mono focus:outline-none resize-y ${
          error ? 'border-red-500/50' : 'border-gray-700 focus:border-forge-500'
        }`}
        spellCheck={false}
      />
      {error && (
        <p className="text-[10px] text-red-400">{error}</p>
      )}
    </div>
  );
}
