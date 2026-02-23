import { MongoClient, MongoError, Collection, ObjectId } from 'mongodb';
import { isValidJob, isValidStatus } from './validateUtils.js';
import { InvalidInputError } from './InvalidInputError.js';
import { DatabaseError } from './DatabaseError.js';

interface Job {
    title: string;
    description: string;
    location: string;
    budget: number;
    status: string;
    postedAt: Date;  
}

const dbName: string = 'jobboard_db'
let client: MongoClient;
let jobsCollection: Collection<Job> | undefined;

async function initialize(): Promise<void>{

    try{
        const url = `${process.env.URL_PRE}${process.env.MONGODB_PWD}${process.env.URL_POST}`;
        client = new MongoClient(url); // store connected client for use while the app is running
        await client.connect(); 
        console.log("Connected to MongoDb");
        const db = client.db(dbName);
        jobsCollection = db.collection("jobs")
      }catch (err) {
        if (err instanceof MongoError) {
            console.error("MongoDB connection failed:", err.message);
          } else {
            console.error("Unexpected error:", err);
          }
        }
}


async function addJob(title:string,description:string,location:string,budget:number): Promise<Job>{
    isValidJob(title,description,location,budget)
    if(!jobsCollection) throw new DatabaseError("Db not started");
    try{
        const newJob: Job = {
            title,
            description,
            location,
            budget,
            status: 'open',
            postedAt: new Date()
        }
        const result = await jobsCollection.insertOne(newJob);
        console.log('[model] createJob: inserted _id ' + result.insertedId);
        return newJob;    
    }catch (err: unknown) {
        if (err instanceof InvalidInputError) throw err;
        throw new DatabaseError('Error inserting job');
      }    
      
}

async function getJobByTitle(title:string): Promise<Job>{
    if (!title)
        throw new InvalidInputError("No title given")
    if (!jobsCollection)
        throw new DatabaseError("Database error")
    try{
        const result = await jobsCollection.findOne<Job>({ title: title });
        if (!result) throw new DatabaseError('No job found with title: ' + title);
        return result;
    }catch (err: unknown) {
        if (err instanceof DatabaseError || err instanceof InvalidInputError) throw err;
        throw new DatabaseError('Error finding job');
      }
}

async function getAllJobs(statusFilter?:string):Promise<Job[]> {
    if (statusFilter !== undefined) isValidStatus(statusFilter);
    if (!jobsCollection) throw new DatabaseError('DB not initialized');
    try {
        const query = statusFilter ? { status: statusFilter } : {};
        const cursor = await jobsCollection.find<Job>(query);
        const results = await cursor.toArray();
        console.log('[model] getAllJobs: ' + results.length + ' results');
        return results;
      } catch (err: unknown) {
        if (err instanceof InvalidInputError || err instanceof DatabaseError) throw err;
        throw new DatabaseError('Error retrieving jobs');
      }
    
}

async function updateJob(title:string, budget: number, status: string):Promise<boolean> {
    if (!title || title.trim().length === 0)
        throw new InvalidInputError('Title is empty');
      isValidJob(title, 'placeholder', 'placeholder', budget);
      isValidStatus(status);
      if (!jobsCollection) throw new DatabaseError('DB not initialized');
      try {
        const job = await jobsCollection.updateOne({ title: title }, { $set: { budget, status } });
        if (job.matchedCount === 0) throw new DatabaseError('No job found with title: ' + title);
        console.log('[model] updateJob: updated ' + title);
        return true;
      }
      catch(err: unknown) {
        if (err instanceof DatabaseError || err instanceof InvalidInputError) throw err;
        throw new DatabaseError('Error updating job');
      }
}

async function deleteJob(title:string):Promise<boolean> {
    if (!title)
        throw new InvalidInputError("No title given")
    if (!jobsCollection)
        throw new DatabaseError("No database made :(")

    try{
        const r = await jobsCollection.deleteOne({ title: title });
        if (r.deletedCount === 0) throw new DatabaseError('No job found with title: ' + title);
        console.log('[model] deleteJob: deleted ' + title);
        return true
    }catch (err: unknown) {
        if (err instanceof DatabaseError || err instanceof InvalidInputError) throw err;
        throw new DatabaseError('Error deleting job');
      }
}

export {initialize, addJob, getJobByTitle,getAllJobs,deleteJob,updateJob};
export type { Job };