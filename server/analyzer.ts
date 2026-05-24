export function inferSchemaFromValue(value: any): any {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferSchemaFromValue(value[0]) : {},
    };
  }
  if (typeof value === 'object') {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const [k, v] of Object.entries(value)) {
      properties[k] = inferSchemaFromValue(v);
      if (v !== null && v !== undefined) required.push(k);
    }
    return { type: 'object', properties, required };
  }
  return { type: typeof value };
}

export function suggestToolName(method: string, path: string): string {
  const cleaned = path
    .replace(/^\//, '')
    .replace(/\{[^}]+\}/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${method.toLowerCase()}_${cleaned || 'root'}`;
}

export function suggestDescription(method: string, path: string): string {
  const resource = path
    .replace(/^\//, '')
    .replace(/\{[^}]+\}/g, '')
    .replace(/\//g, ' ')
    .replace(/[_-]/g, ' ')
    .trim();

  const actions: Record<string, string> = {
    GET: 'Retrieve',
    POST: 'Create',
    PUT: 'Replace',
    PATCH: 'Update',
    DELETE: 'Delete',
    HEAD: 'Check',
    OPTIONS: 'Get options for',
  };

  return `${actions[method] || method} ${resource}`;
}
