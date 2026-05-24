import { suggestToolName, suggestDescription } from '../analyzer.js';

interface Endpoint {
  id: string;
  method: string;
  path: string;
  toolName: string;
  description: string;
  group: string;
  headers: Record<string, string>;
  queryParams: { name: string; type: string; required: boolean; description: string }[];
  pathParams: { name: string; type: string; required: boolean; description: string }[];
  bodySchema: string;
  responseSchema: string;
  enabled: boolean;
  examples: { request?: string; response?: string };
}

export function parseCurl(command: string): { endpoint: Endpoint } {
  const cleaned = command
    .replace(/\\\n/g, ' ')
    .replace(/\\\r\n/g, ' ')
    .trim();

  let method = 'GET';
  let url = '';
  const headers: Record<string, string> = {};
  let body = '';

  const tokens = tokenize(cleaned);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === 'curl') continue;

    if (token === '-X' || token === '--request') {
      method = tokens[++i]?.toUpperCase() || 'GET';
      continue;
    }

    if (token === '-H' || token === '--header') {
      const headerStr = tokens[++i] || '';
      const colonIdx = headerStr.indexOf(':');
      if (colonIdx > 0) {
        const key = headerStr.substring(0, colonIdx).trim();
        const value = headerStr.substring(colonIdx + 1).trim();
        headers[key] = value;
      }
      continue;
    }

    if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
      body = tokens[++i] || '';
      if (method === 'GET') method = 'POST';
      continue;
    }

    if (token === '-u' || token === '--user') {
      const creds = tokens[++i] || '';
      const encoded = Buffer.from(creds).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
      continue;
    }

    if (!token.startsWith('-') && !url) {
      url = token.replace(/^['"]|['"]$/g, '');
    }
  }

  let path = '/';
  const queryParams: Endpoint['queryParams'] = [];

  try {
    const parsed = new URL(url);
    path = parsed.pathname;
    parsed.searchParams.forEach((value, name) => {
      queryParams.push({ name, type: 'string', required: false, description: '' });
    });
  } catch {
    path = url || '/';
  }

  let bodySchema = '';
  if (body) {
    try {
      const parsed = JSON.parse(body);
      bodySchema = JSON.stringify(inferSchemaFromExample(parsed), null, 2);
    } catch {
      bodySchema = '';
    }
  }

  return {
    endpoint: {
      id: crypto.randomUUID(),
      method,
      path,
      toolName: suggestToolName(method, path),
      description: suggestDescription(method, path),
      group: 'default',
      headers,
      queryParams,
      pathParams: [],
      bodySchema,
      responseSchema: '',
      enabled: true,
      examples: {
        request: body || undefined,
      },
    },
  };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote: string | null = null;
  let escaped = false;

  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inQuote = char;
      continue;
    }

    if (char === ' ' || char === '\t') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

function inferSchemaFromExample(value: any): any {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    return { type: 'array', items: value.length > 0 ? inferSchemaFromExample(value[0]) : {} };
  }
  if (typeof value === 'object') {
    const properties: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      properties[k] = inferSchemaFromExample(v);
    }
    return { type: 'object', properties };
  }
  return { type: typeof value };
}
