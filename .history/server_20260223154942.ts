import 'dotenv/config';

import { createServer, IncomingMessage, ServerResponse } from 'http';
import * as model from './jobModelMongoDB.js'
import { InvalidInputError } from './InvalidInputError.js';
import { DatabaseError } from './DatabaseError.js';


let initialized = model.initialize();

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
    response.write(await handelDeleteJob("Walk the dog"));
    

    response.end('Hello Aadi. Who did you fight?');
}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});


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
            }
            console.error("Unexpected error in addJob.")
            return "Unexpected error when creating job"
        }
    }

async function handleGetAllJobs(statusFilter?: string): Promise<string>{
    try{
        const jobList: model.Job[] = await model.getAllJobs(statusFilter);
        console.log(jobList);
        return `Successfully found all ${jobList.length} jobs!`
    }catch (err: unknown) {
        if (err instanceof InvalidInputError) {
          console.warn('Invalid filter: ' + (err as Error).message);
          return `Bad status filter: ${statusFilter}\n`;
        }
        console.error('Error in getAllJobs');
        return 'Error retrieving jobs\n';
    }     
}

async function handleGetJobByTitle(title: string): Promise<string>{
    try {
        const result = await model.getJobByTitle(title);
        return `Job found with name ${result.title}!`
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

async function handleUpdateJob(title:string, budget: number, status: string): Promise<String>{
    try {
        await model.updateJob(title,budget,status);
        return `Job updated with name ${title}!`
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

async function handelDeleteJob(title:string):Promise<string> {
    try{
        await model.deleteJob(title);
        return `Succesfully deleted ${title}`
    }
    catch (err:unknown){
        if (err instanceof InvalidInputError){
            console.warn("Invalid name to delete")
            return `deleteJob failed, invalid title`
        }
        else if (err instanceof DatabaseError)
        {
            console.error("DB error in deleteJob")
            return `Job ${title} not found in db`
        }
        return "unexpected error in deleteJob"

    }
}