# ApiCollectionToMCP

<p align="center">
  <strong>Transform any REST API into an MCP (Model Context Protocol) Server — instantly.</strong>
</p>

<p align="center">
  Import from cURL, OpenAPI, or Postman → Test → Generate → Download a ready-to-run MCP server.
</p>

---

## ✨ What It Does

**ApiCollectionToMCP** is a full-stack web application that converts REST API definitions into fully functional [MCP servers](https://modelcontextprotocol.io/) compatible with Claude and other AI models. No manual coding required.

| Step | Action |
|------|--------|
| **1. Import** | Paste a cURL command, upload an OpenAPI spec, or import a Postman collection |
| **2. Configure** | Edit endpoints, set authentication, configure permissions & rate limits |
| **3. Test** | Validate endpoints live against the real API |
| **4. Generate** | Get a complete TypeScript MCP server project |
| **5. Download** | Download as a ZIP — ready to `npm install && npm start` |

---

## 🚀 Features

- **Multi-format Import**
  - cURL commands (with auth detection)
  - OpenAPI 3.x & 2.0 (JSON/YAML)
  - Postman Collection exports (nested folders supported)

- **Smart Analysis**
  - Auto-infers request/response schemas from examples
  - Generates descriptive tool names (`GET /users/{id}` → `get_users_by_id`)
  - Suggests human-readable descriptions for each tool

- **Live API Testing**
  - Test individual endpoints with real requests
  - Batch-analyze all endpoints at once
  - View response times, status codes, and payloads

- **Flexible Authentication**
  - Bearer Token
  - API Key (header or query parameter)
  - Basic Auth
  - Custom Headers

- **MCP Server Generation**
  - Complete TypeScript project with MCP SDK
  - Proper tool definitions with JSON Schema validation
  - Built-in rate limiting
  - Environment variable support for secrets
  - Stdio transport (ready for Claude Desktop)

- **Permission Controls**
  - Enable/disable tools per HTTP method
  - Fine-grained access control for generated servers

---

## 🖥️ Screenshots

The application provides a three-tab workflow:

1. **Endpoints** — Manage, search, and edit your API endpoints
2. **Analysis** — Batch test and auto-detect schemas
3. **Generate** — Preview code and download your MCP server

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, TailwindCSS |
| Backend | Express, TypeScript |
| Build | Vite 5 |
| Code Gen | MCP SDK, Archiver (ZIP) |
| Parsing | js-yaml, custom cURL/Postman parsers |

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/Mahak2432/ApiCollectionToMCP.git
cd ApiCollectionToMCP
npm install
```

### Development

Start the full-stack dev environment (frontend + backend):

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3999`

### Production Build

```bash
npm run build
npm start
```

---

## 📖 Usage

### Import from cURL

```bash
curl -X GET "https://api.example.com/users" -H "Authorization: Bearer token123"
```

Paste this into the import modal → the app extracts method, URL, headers, and auth automatically.

### Import from OpenAPI

Upload or paste any OpenAPI 3.x or Swagger 2.0 spec (JSON or YAML). All paths, parameters, and schemas are extracted.

### Import from Postman

Export your Postman collection as JSON and import it. Folder structures become endpoint groups.

### Generated Output

The downloaded ZIP contains a complete MCP server:

```
my-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts      # MCP server with all tools
├── .env.example       # Environment variables template
└── README.md          # Usage instructions
```

Run it:

```bash
cd my-mcp-server
npm install
npm start
```

Add to Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-api": {
      "command": "node",
      "args": ["path/to/my-mcp-server/dist/index.js"]
    }
  }
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                       │
│  (Endpoint Editor, API Tester, Code Preview)         │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP (Vite proxy)
┌───────────────────────▼─────────────────────────────┐
│                 Express Backend                       │
├─────────────┬──────────────┬────────────────────────┤
│  Importers  │   Proxy      │     Generator          │
│  ─ cURL     │   ─ Test     │     ─ Code Gen         │
│  ─ OpenAPI  │   ─ Analyze  │     ─ ZIP Download     │
│  ─ Postman  │              │                        │
└─────────────┴──────────────┴────────────────────────┘
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source. See the repository for license details.

---

<p align="center">
  Built with ❤️ to bridge REST APIs and AI-powered tools via MCP.
</p>
