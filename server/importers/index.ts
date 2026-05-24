import { Router } from 'express';
import type { Request, Response } from 'express';
import { parseOpenApi } from './openapi.js';
import { parsePostman } from './postman.js';
import { parseCurl } from './curl.js';

export const importRouter = Router();

importRouter.post('/openapi', (req: Request, res: Response) => {
  try {
    const { spec } = req.body;
    const result = parseOpenApi(spec);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

importRouter.post('/postman', (req: Request, res: Response) => {
  try {
    const { collection } = req.body;
    const result = parsePostman(collection);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

importRouter.post('/curl', (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    const result = parseCurl(command);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
