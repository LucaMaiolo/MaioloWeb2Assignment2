import * as model from './jobModelMongoDB.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import { InvalidInputError } from './InvalidInputError.js';
import { DatabaseError } from './DatabaseError.js';

let mongod: MongoMemoryServer;

const jobData: model.Job[] = [
    { title: "Fix leaky faucet", description: "Kitchen faucet drips.", location: "Montreal, QC", budget: 80, status: "open", postedAt: new Date() },
    { title: "Mow the lawn", description: "Front and back yard.", location: "Laval, QC", budget: 60, status: "open", postedAt: new Date() },
    { title: "Walk the dog", description: "Walk my dog for 30 minutes.", location: "Dorval, QC", budget: 10, status: "open", postedAt: new Date() },
    { title: "Paint the fence", description: "White paint needed.", location: "Brossard, QC", budget: 120, status: "open", postedAt: new Date() },
    { title: "Clean the gutters", description: "Two-storey house.", location: "Longueuil, QC", budget: 90, status: "open", postedAt: new Date() },
    { title: "Assemble furniture", description: "IKEA bed frame and desk.", location: "Montreal, QC", budget: 50, status: "open", postedAt: new Date() },
];

const generateJobData = () => jobData.splice(Math.floor(Math.random() * jobData.length), 1)[0];


const dbName = "jobboard_db_test";
jest.setTimeout(10000);

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    console.log("Mock Database started");
});

afterAll(async () => {
    await mongod.stop(); 
    console.log("Mock Database stopped");
});

beforeEach(async () => {
    try {
        const url: string = mongod.getUri();
        await model.initialize(dbName, true, url);
    } catch (err: unknown) {
        if (err instanceof Error) console.log(err.message);
        else console.log("Unknown error during beforeEach in unit tests");
    }
});

afterEach(async () => {
    await model.close();
});


//Adding
test('Can add job to DB', async () => {
    const newJob = generateJobData();
    if (!newJob) throw new Error("No more job data available");

    await model.addJob(newJob.title, newJob.description, newJob.location, newJob.budget);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0]!.title.toLowerCase() == newJob.title.toLowerCase()).toBe(true);
    expect(results[0]!.status).toBe('open');
});



test('addJob throws InvalidInputError for empty title', async () => {
    const newJob = generateJobData();
    if (!newJob) throw new Error("No more job data available");

    await expect(model.addJob('', newJob.description, newJob.location, newJob.budget))
        .rejects.toThrow(InvalidInputError);
});

test('addJob throws InvalidInputError for negative budget', async () => {
    const newJob = generateJobData();
    if (!newJob) throw new Error("No more job data available");

    await expect(model.addJob(newJob.title, newJob.description, newJob.location, -99))
        .rejects.toThrow(InvalidInputError);
});
test('addJob throws InvalidInputError for empty description', async () => {
    const newJob = generateJobData();
    if (!newJob) throw new Error("No more job data available");

    await expect(model.addJob(newJob.title, '', newJob.location, newJob.budget))
        .rejects.toThrow(InvalidInputError);
});



//Finding 
test('Can get job by title', async () => {
    const newJob = generateJobData();
    if (!newJob) throw new Error("No more job data available");

    await model.addJob(newJob.title, newJob.description, newJob.location, newJob.budget);
    const result = await model.getJobByTitle(newJob.title);

    expect(result.title.toLowerCase() == newJob.title.toLowerCase()).toBe(true);
});

test('getJobByTitle throws DatabaseError for non-existent title', async () => {
    await expect(model.getJobByTitle('This job does not exist'))
        .rejects.toThrow(DatabaseError);
});

test('getJobByTitle throws InvalidInputError for empty title', async () => {
    await expect(model.getJobByTitle(''))
        .rejects.toThrow(InvalidInputError);
});

//Finding All

test('Can get all jobs', async () => {
    const job1 = generateJobData();
    const job2 = generateJobData();
    if (!job1 || !job2) throw new Error("No more job data available");

    await model.addJob(job1.title, job1.description, job1.location, job1.budget);
    await model.addJob(job2.title, job2.description, job2.location, job2.budget);

    const results = await model.getAllJobs();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
});

test('getAllJobs throws InvalidInputError for bad status', async () => {
    await expect(model.getAllJobs('banana'))
        .rejects.toThrow(InvalidInputError);
});

//update jobs
test('Can update a job', async () => {
    const newJob = generateJobData();
    if (!newJob) throw new Error("No more job data available");

    await model.addJob(newJob.title, newJob.description, newJob.location, newJob.budget);
    const result = await model.updateJob(newJob.title, 999, 'completed');

    expect(result).toBe(true);

    const updated = await model.getJobByTitle(newJob.title);
    expect(updated.budget).toBe(999);
    expect(updated.status).toBe('completed');
});

test('updateJob throws DatabaseError for non-existent job', async () => {
    await expect(model.updateJob('Nonexistent job', 10, 'open'))
        .rejects.toThrow(DatabaseError);
});

//delete 
test('Can delete a job', async () => {
    const newJob = generateJobData();
    if (!newJob) throw new Error("No more job data available");

    await model.addJob(newJob.title, newJob.description, newJob.location, newJob.budget);
    const result = await model.deleteJob(newJob.title);

    expect(result).toBe(true);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(results.length).toBe(0);
});

test('deleteJob throws DatabaseError for non-existent job', async () => {
    await expect(model.deleteJob('This job does not exist'))
        .rejects.toThrow(DatabaseError);
});
