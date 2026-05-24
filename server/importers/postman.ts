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

export function parsePostman(collectionInput: string): { endpoints: Endpoint[] } {
  let collection: any;
  try {
    collection = typeof collectionInput === 'string' ? JSON.parse(collectionInput) : collectionInput;
  } catch {
    throw new Error('Invalid Postman collection JSON');
  }

  if (!collection.item) {
    throw new Error('Invalid Postman collection: missing "item" field');
  }

  const endpoints: Endpoint[] = [];
  extractItems(collection.item, endpoints, '');
  return { endpoints };
}

function extractItems(items: any[], endpoints: Endpoint[], group: string) {
  for (const item of items) {
    if (item.item) {
      extractItems(item.item, endpoints, item.name || group);
      continue;
    }

    if (!item.request) continue;

    const request = item.request;
    const method = (typeof request.method === 'string' ? request.method : 'GET').toUpperCase();

    let path = '/';
    if (request.url) {
      if (typeof request.url === 'string') {
        try {
          path = new URL(request.url).pathname;
        } catch {
          path = request.url;
        }
      } else if (request.url.path) {
        path = '/' + (Array.isArray(request.url.path) ? request.url.path.join('/') : request.url.path);
      }
    }

    path = path.replace(/:(\w+)/g, '{$1}');

    const headers: Record<string, string> = {};
    if (request.header && Array.isArray(request.header)) {
      for (const h of request.header) {
        if (h.key && h.value && !h.disabled) {
          headers[h.key] = h.value;
        }
      }
    }

    const queryParams: Endpoint['queryParams'] = [];
    if (request.url?.query && Array.isArray(request.url.query)) {
      for (const q of request.url.query) {
        if (q.key) {
          queryParams.push({
            name: q.key,
            type: 'string',
            required: false,
            description: q.description || '',
          });
        }
      }
    }

    const pathParams: Endpoint['pathParams'] = [];
    if (request.url?.variable && Array.isArray(request.url.variable)) {
      for (const v of request.url.variable) {
        if (v.key) {
          pathParams.push({
            name: v.key,
            type: 'string',
            required: true,
            description: v.description || '',
          });
        }
      }
    }

    let bodySchema = '';
    if (request.body?.mode === 'raw' && request.body.raw) {
      try {
        const parsed = JSON.parse(request.body.raw);
        bodySchema = JSON.stringify(inferSchemaFromExample(parsed), null, 2);
      } catch {
        bodySchema = '';
      }
    }

    let responseExample = '';
    if (item.response && item.response[0]?.body) {
      responseExample = item.response[0].body;
    }

    endpoints.push({
      id: crypto.randomUUID(),
      method,
      path,
      toolName: suggestToolName(method, path),
      description: item.name || request.description || suggestDescription(method, path),
      group: group || 'default',
      headers,
      queryParams,
      pathParams,
      bodySchema,
      responseSchema: '',
      enabled: true,
      examples: {
        request: request.body?.raw || undefined,
        response: responseExample || undefined,
      },
    });
  }
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
