import { Router } from 'express';
import type { Request, Response } from 'express';

export const proxyRouter = Router();

interface AuthConfig {
  type: 'none' | 'bearer' | 'api-key' | 'basic' | 'custom-header';
  token?: string;
  apiKeyName?: string;
  apiKeyLocation?: 'header' | 'query';
  username?: string;
  password?: string;
  headerName?: string;
  headerValue?: string;
}

interface EndpointDef {
  method: string;
  path: string;
  headers: Record<string, string>;
  queryParams: { name: string; default?: string }[];
  bodySchema?: string;
}

function buildAuthHeaders(auth: AuthConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  switch (auth.type) {
    case 'bearer':
      if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
      break;
    case 'api-key':
      if (auth.apiKeyLocation === 'header' && auth.apiKeyName && auth.token) {
        headers[auth.apiKeyName] = auth.token;
      }
      break;
    case 'basic':
      if (auth.username) {
        const encoded = Buffer.from(`${auth.username}:${auth.password || ''}`).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      }
      break;
    case 'custom-header':
      if (auth.headerName && auth.headerValue) {
        headers[auth.headerName] = auth.headerValue;
      }
      break;
  }
  return headers;
}

function buildUrl(baseUrl: string, endpoint: EndpointDef, auth: AuthConfig): string {
  let url = `${baseUrl.replace(/\/$/, '')}${endpoint.path}`;
  const params = new URLSearchParams();

  if (auth.type === 'api-key' && auth.apiKeyLocation === 'query' && auth.apiKeyName && auth.token) {
    params.set(auth.apiKeyName, auth.token);
  }

  const paramStr = params.toString();
  if (paramStr) url += `?${paramStr}`;
  return url;
}

proxyRouter.post('/test', async (req: Request, res: Response) => {
  const { baseUrl, endpoint, auth } = req.body as {
    baseUrl: string;
    endpoint: EndpointDef;
    auth: AuthConfig;
  };

  const start = Date.now();
  try {
    const url = buildUrl(baseUrl, endpoint, auth);
    const headers: Record<string, string> = {
      ...buildAuthHeaders(auth),
      ...endpoint.headers,
    };

    const fetchOptions: RequestInit = {
      method: endpoint.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.bodySchema) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const response = await fetch(url, fetchOptions);
    const body = await response.text();
    const duration = Date.now() - start;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      duration,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.json({
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: '',
      duration: Date.now() - start,
      timestamp: Date.now(),
      error: err.message,
    });
  }
});

proxyRouter.post('/analyze', async (req: Request, res: Response) => {
  const { baseUrl, endpoints, auth } = req.body as {
    baseUrl: string;
    endpoints: EndpointDef[];
    auth: AuthConfig;
  };

  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      const start = Date.now();
      try {
        const url = buildUrl(baseUrl, endpoint, auth);
        const headers = { ...buildAuthHeaders(auth), ...endpoint.headers };
        const response = await fetch(url, { method: endpoint.method, headers });
        const body = await response.text();

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body,
          duration: Date.now() - start,
          timestamp: Date.now(),
        };
      } catch (err: any) {
        return {
          status: 0,
          statusText: 'Network Error',
          headers: {},
          body: '',
          duration: Date.now() - start,
          timestamp: Date.now(),
          error: err.message,
        };
      }
    })
  );

  res.json(results);
});
