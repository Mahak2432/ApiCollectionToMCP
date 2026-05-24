export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PATCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  HEAD: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  OPTIONS: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export interface ParamDef {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
  default?: string;
}

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  toolName: string;
  description: string;
  group: string;
  headers: Record<string, string>;
  queryParams: ParamDef[];
  pathParams: ParamDef[];
  bodySchema: string;
  responseSchema: string;
  enabled: boolean;
  examples: {
    request?: string;
    response?: string;
  };
  rateLimit?: {
    maxRequests: number;
    windowSeconds: number;
  };
  lastTestResult?: TestResult;
}

export interface TestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  timestamp: number;
  error?: string;
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'api-key' | 'basic' | 'custom-header';
  token: string;
  apiKeyName: string;
  apiKeyLocation: 'header' | 'query';
  username: string;
  password: string;
  headerName: string;
  headerValue: string;
}

export interface MethodPermissions {
  GET: boolean;
  POST: boolean;
  PUT: boolean;
  PATCH: boolean;
  DELETE: boolean;
  HEAD: boolean;
  OPTIONS: boolean;
}

export interface McpProject {
  name: string;
  description: string;
  version: string;
  baseUrl: string;
  auth: AuthConfig;
  endpoints: Endpoint[];
  permissions: MethodPermissions;
}

export interface AnalysisResult {
  endpointId: string;
  status: 'success' | 'error' | 'pending';
  testResult?: TestResult;
  detectedSchema?: string;
  suggestions?: string[];
}

export const DEFAULT_AUTH: AuthConfig = {
  type: 'none',
  token: '',
  apiKeyName: 'X-API-Key',
  apiKeyLocation: 'header',
  username: '',
  password: '',
  headerName: '',
  headerValue: '',
};

export const DEFAULT_PERMISSIONS: MethodPermissions = {
  GET: true,
  POST: true,
  PUT: false,
  PATCH: false,
  DELETE: false,
  HEAD: false,
  OPTIONS: false,
};

export function createEndpoint(partial?: Partial<Endpoint>): Endpoint {
  const id = crypto.randomUUID();
  return {
    id,
    method: 'GET',
    path: '',
    toolName: '',
    description: '',
    group: 'default',
    headers: {},
    queryParams: [],
    pathParams: [],
    bodySchema: '',
    responseSchema: '',
    enabled: true,
    examples: {},
    ...partial,
  };
}

export function generateToolName(method: HttpMethod, path: string): string {
  const cleaned = path
    .replace(/^\//, '')
    .replace(/\{[^}]+\}/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const prefix = method.toLowerCase();
  return `${prefix}_${cleaned || 'root'}`;
}
