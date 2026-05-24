import type { Endpoint, AuthConfig, TestResult, McpProject } from './types';

const BASE = '/api';

export async function testEndpoint(
  baseUrl: string,
  endpoint: Endpoint,
  auth: AuthConfig
): Promise<TestResult> {
  const res = await fetch(`${BASE}/proxy/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl, endpoint, auth }),
  });
  return res.json();
}

export async function analyzeEndpoints(
  baseUrl: string,
  endpoints: Endpoint[],
  auth: AuthConfig
): Promise<TestResult[]> {
  const res = await fetch(`${BASE}/proxy/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl, endpoints, auth }),
  });
  return res.json();
}

export async function generateMcpServer(project: McpProject): Promise<string> {
  const res = await fetch(`${BASE}/generate/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  const data = await res.json();
  return data.code;
}

export async function downloadMcpServer(project: McpProject): Promise<Blob> {
  const res = await fetch(`${BASE}/generate/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  return res.blob();
}

export async function importOpenApi(spec: string): Promise<{ endpoints: Endpoint[]; baseUrl?: string }> {
  const res = await fetch(`${BASE}/import/openapi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec }),
  });
  return res.json();
}

export async function importPostman(collection: string): Promise<{ endpoints: Endpoint[] }> {
  const res = await fetch(`${BASE}/import/postman`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection }),
  });
  return res.json();
}

export async function importCurl(command: string): Promise<{ endpoint: Endpoint }> {
  const res = await fetch(`${BASE}/import/curl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  });
  return res.json();
}
