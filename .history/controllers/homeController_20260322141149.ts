import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();
const routeRoot = '/';

router.get('/', showHome);
/**
 * Returns a welcome message for the home page.
 */
function showHome(request: Request, response: Response): void {
  response.status(200);
  response.send('Welcome to the Job Board API. Use /jobs to access job listings.');
}

export { router, routeRoot };
