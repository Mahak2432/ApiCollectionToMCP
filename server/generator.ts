import { Router } from 'express';
import type { Request, Response } from 'express';
import archiver from 'archiver';

export const generatorRouter = Router();

interface McpProject {
  name: string;
  description: string;
  version: string;
  baseUrl: string;
  auth: {
    type: string;
    token?: string;
    apiKeyName?: string;
    apiKeyLocation?: string;
    username?: string;
    password?: string;
    headerName?: string;
    headerValue?: string;
  };
  endpoints: {
    id: string;
    method: string;
    path: string;
    toolName: string;
    description: string;
    group?: string;
    headers: Record<string, string>;
    queryParams: { name: string; type: string; required: boolean; description: string; default?: string }[];
    pathParams: { name: string; type: string; required: boolean; description: string }[];
    bodySchema: string;
    responseSchema: string;
    enabled: boolean;
    rateLimit?: { maxRequests: number; windowSeconds: number };
  }[];
  permissions: Record<string, boolean>;
}

function generateMcpCode(project: McpProject): string {
  const activeEndpoints = project.endpoints.filter(
    (ep) => ep.enabled && project.permissions[ep.method]
  );

  const authSetup = generateAuthCode(project.auth);
  const toolDefs = activeEndpoints.map((ep) => generateToolDef(ep)).join('\n\n');
  const toolHandlers = activeEndpoints.map((ep) => generateToolHandler(ep)).join('\n\n');
  const hasRateLimiting = activeEndpoints.some((ep) => ep.rateLimit?.maxRequests);

  return `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = process.env.API_BASE_URL || "${project.baseUrl}";
${authSetup}
${hasRateLimiting ? generateRateLimitCode() : ''}
${generateAuthHeaderFunction(project.auth)}

const server = new Server(
  { name: "${project.name}", version: "${project.version}" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
${toolDefs}
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
${toolHandlers}
      default:
        throw new Error(\`Unknown tool: \${name}\`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: \`Error: \${error.message}\` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${project.name} MCP server running on stdio");
}

main().catch(console.error);
`;
}

function generateAuthCode(auth: McpProject['auth']): string {
  switch (auth.type) {
    case 'bearer':
      return `const AUTH_TOKEN = process.env.API_AUTH_TOKEN || "";`;
    case 'api-key':
      return `const API_KEY = process.env.API_AUTH_TOKEN || "";\nconst API_KEY_NAME = "${auth.apiKeyName || 'X-API-Key'}";\nconst API_KEY_LOCATION = "${auth.apiKeyLocation || 'header'}";`;
    case 'basic':
      return `const AUTH_USERNAME = process.env.API_AUTH_USERNAME || "";\nconst AUTH_PASSWORD = process.env.API_AUTH_PASSWORD || "";`;
    case 'custom-header':
      return `const AUTH_HEADER_NAME = "${auth.headerName || ''}";\nconst AUTH_HEADER_VALUE = process.env.API_AUTH_TOKEN || "";`;
    default:
      return '';
  }
}

function generateAuthHeaderFunction(auth: McpProject['auth']): string {
  let authHeader = '';
  switch (auth.type) {
    case 'bearer':
      authHeader = `if (AUTH_TOKEN) headers["Authorization"] = \`Bearer \${AUTH_TOKEN}\`;`;
      break;
    case 'api-key':
      authHeader = `if (API_KEY_LOCATION === "header") headers[API_KEY_NAME] = API_KEY;`;
      break;
    case 'basic':
      authHeader = `if (AUTH_USERNAME) headers["Authorization"] = \`Basic \${Buffer.from(\`\${AUTH_USERNAME}:\${AUTH_PASSWORD}\`).toString("base64")}\`;`;
      break;
    case 'custom-header':
      authHeader = `if (AUTH_HEADER_VALUE) headers[AUTH_HEADER_NAME] = AUTH_HEADER_VALUE;`;
      break;
  }

  return `
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  ${authHeader}
  return headers;
}

function buildUrl(path: string, queryParams?: Record<string, string>): string {
  let url = \`\${BASE_URL}\${path}\`;
  const params = new URLSearchParams();
  ${auth.type === 'api-key' ? `if (API_KEY_LOCATION === "query") params.set(API_KEY_NAME, API_KEY);` : ''}
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== "") params.set(key, value);
    }
  }
  const paramStr = params.toString();
  if (paramStr) url += \`?\${paramStr}\`;
  return url;
}`;
}

function generateRateLimitCode(): string {
  return `
const rateLimitState = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(toolName: string, maxRequests: number, windowSeconds: number): void {
  const now = Date.now();
  const state = rateLimitState.get(toolName);
  if (!state || now > state.resetTime) {
    rateLimitState.set(toolName, { count: 1, resetTime: now + windowSeconds * 1000 });
    return;
  }
  if (state.count >= maxRequests) {
    throw new Error(\`Rate limit exceeded for \${toolName}. Try again in \${Math.ceil((state.resetTime - now) / 1000)}s\`);
  }
  state.count++;
}`;
}

function generateToolDef(ep: McpProject['endpoints'][0]): string {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const p of ep.queryParams) {
    properties[p.name] = { type: p.type, description: p.description };
    if (p.default) properties[p.name].default = p.default;
    if (p.required) required.push(p.name);
  }

  for (const p of ep.pathParams) {
    properties[p.name] = { type: p.type, description: p.description || `Path parameter: ${p.name}` };
    if (p.required) required.push(p.name);
  }

  if (['POST', 'PUT', 'PATCH'].includes(ep.method) && ep.bodySchema) {
    try {
      const schema = JSON.parse(ep.bodySchema);
      if (schema.properties) {
        Object.assign(properties, schema.properties);
        if (schema.required) required.push(...schema.required);
      } else {
        properties['body'] = { type: 'string', description: 'Request body as JSON string' };
      }
    } catch {
      properties['body'] = { type: 'string', description: 'Request body as JSON string' };
    }
  }

  const inputSchema: any = {
    type: 'object',
    properties,
  };
  if (required.length > 0) inputSchema.required = required;

  return `      {
        name: "${ep.toolName}",
        description: ${JSON.stringify(ep.description || `${ep.method} ${ep.path}`)},
        inputSchema: ${JSON.stringify(inputSchema, null, 8).split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n')},
      },`;
}

function generateToolHandler(ep: McpProject['endpoints'][0]): string {
  const pathParamNames = ep.pathParams.map((p) => p.name);
  const queryParamNames = ep.queryParams.map((p) => p.name);

  let pathExpr = `"${ep.path}"`;
  if (pathParamNames.length > 0) {
    pathExpr = '`' + ep.path.replace(/\{(\w+)\}/g, (_, name) => `\${args.${name}}`) + '`';
  }

  const queryObj = queryParamNames.length > 0
    ? `{ ${queryParamNames.map((n) => `${n}: args.${n} as string`).join(', ')} }`
    : 'undefined';

  const rateLimitCheck = ep.rateLimit?.maxRequests
    ? `\n        checkRateLimit("${ep.toolName}", ${ep.rateLimit.maxRequests}, ${ep.rateLimit.windowSeconds});`
    : '';

  let bodyExpr = '';
  if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
    let bodyProps: string[] = [];
    try {
      const schema = JSON.parse(ep.bodySchema || '{}');
      if (schema.properties) {
        bodyProps = Object.keys(schema.properties);
      }
    } catch {}

    if (bodyProps.length > 0) {
      bodyExpr = `\n          body: JSON.stringify({ ${bodyProps.map((p) => `${p}: args.${p}`).join(', ')} }),`;
    } else {
      bodyExpr = `\n          body: typeof args.body === "string" ? args.body : JSON.stringify(args.body),`;
    }
  }

  const headerEntries = Object.entries(ep.headers)
    .map(([k, v]) => `"${k}": "${v}"`)
    .join(', ');
  const extraHeaders = headerEntries ? `, ${headerEntries}` : '';
  const contentType = ['POST', 'PUT', 'PATCH'].includes(ep.method) ? `, "Content-Type": "application/json"` : '';

  return `      case "${ep.toolName}": {${rateLimitCheck}
        const url = buildUrl(${pathExpr}, ${queryObj});
        const response = await fetch(url, {
          method: "${ep.method}",
          headers: { ...getAuthHeaders()${contentType}${extraHeaders} },${bodyExpr}
        });
        const data = await response.text();
        return { content: [{ type: "text", text: data }] };
      }`;
}

function generatePackageJson(project: McpProject): string {
  return JSON.stringify(
    {
      name: project.name,
      version: project.version,
      description: project.description,
      type: 'module',
      scripts: {
        start: 'tsx src/index.ts',
        build: 'tsc',
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.0.0',
      },
      devDependencies: {
        tsx: '^4.19.0',
        typescript: '^5.5.0',
      },
    },
    null,
    2
  );
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        strict: true,
        outDir: 'dist',
        skipLibCheck: true,
      },
      include: ['src'],
    },
    null,
    2
  );
}

function generateReadme(project: McpProject): string {
  const activeEndpoints = project.endpoints.filter(
    (ep) => ep.enabled && project.permissions[ep.method]
  );

  const toolList = activeEndpoints
    .map((ep) => `- **${ep.toolName}** — \`${ep.method} ${ep.path}\` — ${ep.description || 'No description'}`)
    .join('\n');

  return `# ${project.name}

${project.description}

Generated by [MCP Forge](https://github.com/mcp-forge).

## Setup

\`\`\`bash
npm install
cp .env.example .env
# Edit .env with your credentials
\`\`\`

## Run

\`\`\`bash
npx tsx src/index.ts
\`\`\`

## Available Tools

${toolList}

## Claude Desktop Configuration

Add this to your \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "${project.name}": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "env": {
        "API_BASE_URL": "${project.baseUrl}"
      }
    }
  }
}
\`\`\`
`;
}

function generateEnvExample(project: McpProject): string {
  const lines = [`API_BASE_URL=${project.baseUrl || 'https://api.example.com'}`];
  switch (project.auth.type) {
    case 'bearer':
    case 'api-key':
    case 'custom-header':
      lines.push('API_AUTH_TOKEN=your-token-here');
      break;
    case 'basic':
      lines.push('API_AUTH_USERNAME=your-username');
      lines.push('API_AUTH_PASSWORD=your-password');
      break;
  }
  return lines.join('\n') + '\n';
}

generatorRouter.post('/preview', (req: Request, res: Response) => {
  const project = req.body as McpProject;
  const code = generateMcpCode(project);
  res.json({ code });
});

generatorRouter.post('/download', (req: Request, res: Response) => {
  const project = req.body as McpProject;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${project.name}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  const prefix = project.name + '/';
  archive.append(generatePackageJson(project), { name: prefix + 'package.json' });
  archive.append(generateTsConfig(), { name: prefix + 'tsconfig.json' });
  archive.append(generateEnvExample(project), { name: prefix + '.env.example' });
  archive.append(generateReadme(project), { name: prefix + 'README.md' });
  archive.append(generateMcpCode(project), { name: prefix + 'src/index.ts' });

  archive.finalize();
});
