import express from 'express';
import type { Request, Response } from 'express';
import * as model from '../jobModelMongoDB.js';
import { InvalidInputError } from '../InvalidInputError.js';
import { DatabaseError } from '../DatabaseError.js';

const router = express.Router();
const routeRoot = '/jobs';



router.post('/', addJob);
/**
 * Creates a new job from JSON body: { title, description, location, budget }
 * Returns 201 on success, 400 for invalid input, 500 for DB errors.
 */
async function addJob(request: Request, response: Response): Promise<void> {
  try {
    const { title, description, location, budget } = request.body;
    const result: model.Job = await model.addJob(title, description, location, budget);
    response.status(201).json({ message: 'Job created', job: result });
  } catch (error: unknown) {
    if (error instanceof InvalidInputError) {
      response.status(400).json({ error: error.message });
    } else if (error instanceof DatabaseError) {
      response.status(500).json({ error: error.message });
    } else {
      response.status(500).json({ error: 'Unexpected error' });
    }
  }
}


router.get('/', getAllJobs);
/**
 * Returns all jobs. Optional query param: ?status=open|in-progress|completed
 * Returns 200 with array, 400 for bad status filter, 500 for DB errors.
 */
async function getAllJobs(request: Request, response: Response): Promise<void> {
  try {
    const statusFilter = request.query.status as string | undefined;
    const jobs: model.Job[] = await model.getAllJobs(statusFilter);
    response.status(200).json({ count: jobs.length, jobs });
  } catch (error: unknown) {
    if (error instanceof InvalidInputError) {
      response.status(400).json({ error: error.message });
    } else {
      response.status(500).json({ error: 'Unexpected error' });
    }
  }
}


router.get('/:title', getJob);
/**
 * Returns a single job matching the given title (URL param).
 * Returns 200 on success, 400 for bad title, 404 if not found.
 */
async function getJob(request: Request, response: Response): Promise<void> {
  try {
    const title = request.params.title as string;
    
    const job: model.Job = await model.getJobByTitle(title);
    response.status(200).json({ job });
  } catch (error: unknown) {
    if (error instanceof InvalidInputError) {
      response.status(400).json({ error: error.message });
    } else if (error instanceof DatabaseError) {
      response.status(404).json({ error: error.message });
    } else {
      response.status(500).json({ error: 'Unexpected error' });
    }
  }
}


router.put('/:title', updateJob);
/**
 * Updates budget and status of a job by title (URL param).
 * Body: { budget: number, status: string }
 * Returns 200 on success, 400 for bad input, 404 if not found.
 */
async function updateJob(request: Request, response: Response): Promise<void> {
  try {
    const title = request.params.title;
    const { budget, status } = request.body;
    if (typeof title !== 'string') {
        response.status(400).json({ error: 'Invalid title' });
        return;
    }
    await model.updateJob(title, budget, status);
    response.status(200).json({ message: `Job '${title}' updated` });
  } catch (error: unknown) {
    if (error instanceof InvalidInputError) {
      response.status(400).json({ error: error.message });
    } else if (error instanceof DatabaseError) {
      response.status(404).json({ error: error.message });
    } else {
      response.status(500).json({ error: 'Unexpected error' });
    }
  }
}

router.delete('/:title', deleteJob);
/**
 * Deletes a job by title (URL param).
 * Returns 200 on success, 400 for bad title, 404 if not found.
 */
async function deleteJob(request: Request, response: Response): Promise<void> {
  try {
    const title = request.params.title;
    if (typeof title !== 'string') {
        response.status(400).json({ error: 'Invalid title' });
        return;
    }
    await model.deleteJob(title);
    response.status(200).json({ message: `Job '${title}' deleted` });
  } catch (error: unknown) {
    if (error instanceof InvalidInputError) {
      response.status(400).json({ error: error.message });
    } else if (error instanceof DatabaseError) {
      response.status(404).json({ error: error.message });
    } else {
      response.status(500).json({ error: 'Unexpected error' });
    }
  }
}

export { router, routeRoot };

