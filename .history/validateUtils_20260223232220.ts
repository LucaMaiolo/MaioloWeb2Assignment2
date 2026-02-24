import { InvalidInputError } from './InvalidInputError.js';

const VALID_STATUSES = ['open', 'in-progress', 'completed'] as const;

/**
 * Validates all required fields for a job entry.
 * Checks that title, description, and location are non-empty strings,
 * and that budget is a positive number.
 * @param title - The job title to validate
 * @param description - The job description to validate
 * @param location - The job location to validate
 * @param budget - The job budget to validate
 * @returns True if all fields are valid
 * @throws InvalidInputError if any field is empty or budget is not a positive number
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
 * Validates that a given string is one of the accepted job statuses.
 * Valid statuses are: 'open', 'in-progress', 'completed'.
 * @param status - The status string to validate
 * @returns True if the status is valid, narrowing the type to JobStatus
 * @throws InvalidInputError if the status is not a recognized value
 */
function isValidStatus(status: string): status is JobStatus {
    if (!VALID_STATUSES.includes(status as JobStatus))
      throw new InvalidInputError('Invalid status: ' + status);
    return true;
  }
  


export type JobStatus = typeof VALID_STATUSES[number];
export { isValidJob, isValidStatus, VALID_STATUSES };

