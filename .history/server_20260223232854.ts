import 'dotenv/config';

import { createServer, IncomingMessage, ServerResponse } from 'http';
import * as model from './jobModelMongoDB.js'
import { InvalidInputError } from './InvalidInputError.js';
import { DatabaseError } from './DatabaseError.js';



let initialized = model.initialize('jobboard_db', false);

const port = 1339;

createServer(async function (request: IncomingMessage, response: ServerResponse) : Promise<void> {
    await initialized;

    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.write(await handleCreateJob('Fix leaky faucet', 'Kitchen faucet drips.',
        'Montreal, QC', 80) + '\n');
    response.write(await handleCreateJob('Mow the lawn', 'Front and back yard.',
        'Laval, QC', 60) + '\n');
    response.write(await handleCreateJob('Walk the dog', 'Walk my dog for 30 minutes.', "Dorval, Qc",10)+ '\n');
    response.write(await handleCreateJob('', 'Bad input demo', 'Nowhere', -1) + '\n'); // expect failure

    //read
    response.write(await handleGetAllJobs());
    response.write(await handleGetJobByTitle("Mow the lawn"));
    
    //update
    response.write(await handleUpdateJob("Fix leaky faucet", 60, "completed"));

    //delete
    response.write(await handleDeleteJob("Walk the dog"));
    

    response.end('Hello World! This is a simple job board server.\n');
}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});


/**
 * Handles creating a new job by calling the model's addJob function.
 * Catches and logs InvalidInputError and DatabaseError separately.
 * @param title - The job title
 * @param description - The job description
 * @param location - The job location
 * @param budget - The job budget
 * @returns A string message indicating success or the type of failure
 */
async function handleCreateJob(title: string, description: string,
    location: string, budget: number): Promise<string>{
        try{
            const result = await model.addJob(title,description,location,budget);
            console.log(result);
            return "Successfully created job: " + result.title + "\n"
        }catch(err: unknown){
            if (err instanceof DatabaseError){
                console.error("Database error in addJob" +err.message)
                return "Database error"
            }
            else if (err instanceof InvalidInputError) {
                console.warn("Invalid input in addJob")
                return "Invalid input"
            }
           
            console.error("Unexpected error in addJob.")
            return "Unexpected error when creating job"
        }
    }


/**
 * Handles retrieving all jobs, with an optional status filter.
 * Catches and logs InvalidInputError and DatabaseError separately.
 * @param statusFilter - Optional status to filter results by
 * @returns A string message indicating how many jobs were found, or describing the error
 */
async function handleGetAllJobs(statusFilter?: string): Promise<string>{
    try{
        const jobList: model.Job[] = await model.getAllJobs(statusFilter);
        console.log(jobList);
        return `Successfully found all ${jobList.length} jobs! \n`
    }catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            console.warn('Invalid filter: ' + (err as Error).message);
            return `Bad status filter: ${statusFilter}\n`;
        } else if (err instanceof DatabaseError) {
            console.error('DB error in getAllJobs: ' + (err as Error).message);
            return 'Database error retrieving jobs\n';
        }
        return 'Unexpected error retrieving jobs\n';
    }
}


/**
 * Handles retrieving a single job by its title.
 * Catches and logs InvalidInputError and DatabaseError separately.
 * @param title - The title of the job to retrieve
 * @returns A string message indicating success or the type of failure
 */
async function handleGetJobByTitle(title: string): Promise<string>{
    try {
        const result = await model.getJobByTitle(title);
        return `Job found with name ${result.title} \n`
    }catch (err: unknown) {
        if (err instanceof InvalidInputError) {
          console.warn('Invalid title: ' + title);
          return `getJobByTItle failed — invalid tile: ${title}\n`;
        } else if (err instanceof DatabaseError) {
          console.error('DB error in getJobByTitle');
          return `getJobByTitle: no job found with id ${title}\n`;
        }

        return 'Unexpected error in getJobById\n';
    }
}

/**
 * Handles updating a job's budget and status by its title.
 * Catches and logs InvalidInputError and DatabaseError separately.
 * @param title - The title of the job to update
 * @param budget - The new budget value
 * @param status - The new status value
 * @returns A string message indicating success or the type of failure
 */
async function handleUpdateJob(title:string, budget: number, status: string): Promise<String>{
    try {
        await model.updateJob(title,budget,status);
        return `Job updated with name ${title}! \n`
    }catch (err: unknown) {
        if (err instanceof InvalidInputError) {
          console.warn('Invalid title: ' + title);
          return `failed — invalid tile: ${title}\n`;
        } else if (err instanceof DatabaseError) {
          console.error('DB error in getJobByTitle');
          return `no job found with id ${title}\n`;
        }
        return 'Unexpected error in getJobById\n';
    }
}

/**
 * Handles deleting a job by its title.
 * Catches and logs InvalidInputError and DatabaseError separately.
 * @param title - The title of the job to delete
 * @returns A string message indicating success or the type of failure
 */
async function handleDeleteJob(title:string):Promise<string> {
    try{
        await model.deleteJob(title);
        return `Succesfully deleted ${title}\n`
    }
    catch (err:unknown){
        if (err instanceof InvalidInputError){
            console.warn("Invalid name to delete")
            return `deleteJob failed, invalid title\n`
        }
        else if (err instanceof DatabaseError)
        {
            console.error("DB error in deleteJob")
            return `Job ${title} not found in db\n`
        }
        return "unexpected error in deleteJob"

    }
}