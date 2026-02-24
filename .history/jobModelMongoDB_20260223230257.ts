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


/**
 * Initializes the MongoDB connection and sets up the jobs collection.
 * @param url - URL to mongoDB database
 * @throws DatabaseError if the connection fails
 */
async function initialize(dbName: string = 'jobboard_db', resetFlag: boolean = false, url?: string): Promise<void> {
  try {
      const uri = url ?? `${process.env.URL_PRE}${process.env.MONGODB_PWD}${process.env.URL_POST}`;
      client = new MongoClient(uri);
      await client.connect();
      console.log("Connected to MongoDb");
      const db = client.db(dbName);

      jobsCollection = db.collection<Job>("jobs");

      let collectionCursor = db.listCollections({ name: "jobs" });
      let collectionArray = await collectionCursor.toArray();

      if (resetFlag && collectionArray.length > 0) {
          await db.collection("jobs").drop(); // wipe it for clean test state
          collectionArray = []; // so it gets recreated below
      }

      if (collectionArray.length == 0) {
          const collation = { locale: "en", strength: 1 };
          await db.createCollection("jobs", { collation: collation });
      }

      jobsCollection = db.collection("jobs");

  } catch (err: unknown) {
      if (err instanceof MongoError) {
          console.error("MongoDB connection failed:", err.message);
      } else if (err instanceof Error) {
          console.error("Unexpected error:", err);
          throw new DatabaseError(err.message);
      } else {
          const msg = "Unknown error in initialize. Should not happen.";
          console.error(msg);
          throw new DatabaseError(msg);
      }
  }
}

/**
 * Closes the MongoDB client connection.
 * Should be called after each test to free resources.
 * @throws DatabaseError if closing the connection fails
 */
async function close(): Promise<void> {
  try {
      await client.close();
      console.log("MongoDb connection closed");
  } catch (err: unknown) {
      if (err instanceof Error)
          console.log(err.message);
      else
          console.log("Unknown error while closing connection");
  }
}

/**
 * Inserts a new job into the database with a default status of 'open'.
 * @param title - The job title (must be non-empty)
 * @param description - A description of the job (must be non-empty)
 * @param location - The location of the job (must be non-empty)
 * @param budget - The budget for the job (must be a positive number)
 * @returns The newly created Job object
 * @throws InvalidInputError if any field fails validation
 * @throws DatabaseError if the insert operation fails
 */
async function addJob(title:string,description:string,location:string,budget:number): Promise<Job>{
    if(!jobsCollection) throw new DatabaseError("Db not started");
    isValidJob(title,description,location,budget)
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
        if (err instanceof InvalidInputError) {
          console.warn("");
          throw err
        };
        console.error('Error inserting job:', err); //TODO: more detailed logging
        throw new DatabaseError('Error inserting job');
      }    
      
}

/**
 * Retrieves a single job from the database by its title.
 * @param title - The title of the job to search for (must be non-empty)
 * @returns The matching Job object
 * @throws InvalidInputError if the title is empty
 * @throws DatabaseError if no job is found or the query fails
 */
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
        if (err instanceof DatabaseError || err instanceof InvalidInputError) throw err; //seperate errors and log
        throw new DatabaseError('Error finding job');
      }
}
/**
 * Retrieves all jobs from the database, with an optional status filter.
 * @param statusFilter - Optional status to filter by ('open', 'in-progress', or 'completed')
 * @returns An array of Job objects matching the filter, or all jobs if no filter is provided
 * @throws InvalidInputError if the status filter is not a valid status
 * @throws DatabaseError if the query fails or the DB is not initialized
 */
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
/**
 * Updates the budget and status of an existing job identified by title.
 * @param title - The title of the job to update (must be non-empty)
 * @param budget - The new budget value (must be a positive number)
 * @param status - The new status ('open', 'in-progress', or 'completed')
 * @returns True if the update was successful
 * @throws InvalidInputError if the title is empty, budget is invalid, or status is invalid
 * @throws DatabaseError if no job with the given title is found or the update fails
 */
 
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

/**
 * Deletes a job from the database by its title.
 * @param title - The title of the job to delete (must be non-empty)
 * @returns True if the deletion was successful
 * @throws InvalidInputError if the title is empty
 * @throws DatabaseError if no job with the given title is found or the deletion fails
 */
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

export {initialize, addJob, getJobByTitle,getAllJobs,deleteJob,updateJob, close};
export type { Job }