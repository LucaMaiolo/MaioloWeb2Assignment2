import { InvalidInputError } from './InvalidInputError.js';

const VALID_STATUSES = ['open', 'in-progress', 'completed'] as const;

/**
 * Validates all required job fields.
 * @throws InvalidInputError if any field is empty or budget <= 0
 */
function isValidJob(title: string, description: string, location: string, budget: number) :boolean{
    
    if(!title || title.trim().length === 0)
        throw new InvalidInputError("Title is empty");

    if (!description || description.trim().length === 0)
        throw new InvalidInputError("Description is empty")

    if (!location || description.trim().length === 0)
        throw new InvalidInputError("Location is empty")

    if (typeof budget !== 'number' || isNaN(budget) || budget <= 0)
        throw new InvalidInputError('Budget must be a positive number');

    return true;     
}

/**
 * Validates a status value.
 * @throws InvalidInputError if status is not open | in-progress | completed
 */
function isValidStatus(status: string): status is JobStatus {
    if (!VALID_STATUSES.includes(status as JobStatus))
      throw new InvalidInputError('Invalid status: ' + status);
    return true;
  }
  


export type JobStatus = typeof VALID_STATUSES[number];
export { isValidJob, isValidStatus, VALID_STATUSES };

