import express from 'express';
import cors from 'cors';
import { proxyRouter } from './proxy.js';
import { generatorRouter } from './generator.js';
import { importRouter } from './importers/index.js';

const app = express();
const PORT = 3999;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/proxy', proxyRouter);
app.use('/api/generate', generatorRouter);
app.use('/api/import', importRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`MCP Forge server running on http://localhost:${PORT}`);
});
