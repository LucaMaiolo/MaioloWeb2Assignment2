import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();
const routeRoot = '/';

router.all('*splat', handleError); // must be loaded last in app.ts
/**
 * Catch-all handler for any unrecognized URL.
 * Returns 404 with a helpful message.
 */
function handleError(request: Request, response: Response): void {
  response.status(404);
  response.send('404 — Invalid URL. Try /jobs');
}

export { router, routeRoot };