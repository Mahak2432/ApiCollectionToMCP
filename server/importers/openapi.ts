import yaml from 'js-yaml';
import { suggestToolName, suggestDescription } from '../analyzer.js';

interface Endpoint {
  id: string;
  method: string;
  path: string;
  toolName: string;
  description: string;
  group: string;
  headers: Record<string, string>;
  queryParams: { name: string; type: string; required: boolean; description: string; default?: string }[];
  pathParams: { name: string; type: string; required: boolean; description: string }[];
  bodySchema: string;
  responseSchema: string;
  enabled: boolean;
  examples: { request?: string; response?: string };
}

export function parseOpenApi(specInput: string): { endpoints: Endpoint[]; baseUrl?: string } {
  let spec: any;
  try {
    spec = JSON.parse(specInput);
  } catch {
    spec = yaml.load(specInput);
  }

  if (!spec || typeof spec !== 'object') {
    throw new Error('Invalid OpenAPI spec');
  }

  let baseUrl: string | undefined;
  if (spec.servers && spec.servers[0]?.url) {
    baseUrl = spec.servers[0].url;
  } else if (spec.host) {
    const scheme = spec.schemes?.[0] || 'https';
    baseUrl = `${scheme}://${spec.host}${spec.basePath || ''}`;
  }

  const endpoints: Endpoint[] = [];
  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths) as [string, any][]) {
    for (const [method, operation] of Object.entries(methods) as [string, any][]) {
      if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].indexOf(method) === -1) continue;

      const httpMethod = method.toUpperCase();
      const params = [...(methods.parameters || []), ...(operation.parameters || [])];
      const queryParams = params
        .filter((p: any) => p.in === 'query')
        .map((p: any) => ({
          name: p.name,
          type: mapSchemaType(p.schema?.type || p.type || 'string'),
          required: p.required || false,
          description: p.description || '',
          default: p.schema?.default?.toString() || p.default?.toString(),
        }));

      const pathParams = params
        .filter((p: any) => p.in === 'path')
        .map((p: any) => ({
          name: p.name,
          type: mapSchemaType(p.schema?.type || p.type || 'string'),
          required: true,
          description: p.description || '',
        }));

      let bodySchema = '';
      if (operation.requestBody?.content) {
        const jsonContent = operation.requestBody.content['application/json'];
        if (jsonContent?.schema) {
          bodySchema = JSON.stringify(resolveSchema(jsonContent.schema, spec), null, 2);
        }
      } else {
        const bodyParam = params.find((p: any) => p.in === 'body');
        if (bodyParam?.schema) {
          bodySchema = JSON.stringify(resolveSchema(bodyParam.schema, spec), null, 2);
        }
      }

      let responseSchema = '';
      const successResponse = operation.responses?.['200'] || operation.responses?.['201'];
      if (successResponse?.content?.['application/json']?.schema) {
        responseSchema = JSON.stringify(
          resolveSchema(successResponse.content['application/json'].schema, spec),
          null,
          2
        );
      } else if (successResponse?.schema) {
        responseSchema = JSON.stringify(resolveSchema(successResponse.schema, spec), null, 2);
      }

      const tag = operation.tags?.[0] || 'default';

      endpoints.push({
        id: crypto.randomUUID(),
        method: httpMethod,
        path,
        toolName: operation.operationId || suggestToolName(httpMethod, path),
        description: operation.summary || operation.description || suggestDescription(httpMethod, path),
        group: tag,
        headers: {},
        queryParams,
        pathParams,
        bodySchema,
        responseSchema,
        enabled: true,
        examples: {},
      });
    }
  }

  return { endpoints, baseUrl };
}

function resolveSchema(schema: any, spec: any, depth = 0): any {
  if (depth > 10) return schema;

  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/', '').split('/');
    let resolved = spec;
    for (const part of refPath) {
      resolved = resolved?.[part];
    }
    return resolved ? resolveSchema(resolved, spec, depth + 1) : schema;
  }

  if (schema.type === 'object' && schema.properties) {
    const props: Record<string, any> = {};
    for (const [key, val] of Object.entries(schema.properties)) {
      props[key] = resolveSchema(val, spec, depth + 1);
    }
    return { ...schema, properties: props };
  }

  if (schema.type === 'array' && schema.items) {
    return { ...schema, items: resolveSchema(schema.items, spec, depth + 1) };
  }

  return schema;
}

function mapSchemaType(type: string): 'string' | 'number' | 'boolean' {
  if (type === 'integer' || type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  return 'string';
}
