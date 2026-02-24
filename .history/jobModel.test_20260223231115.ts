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
test('Finds an existing job', async () => {
    await model.addJob('Mow lawn', 'Front yard', 'Laval', 40);
    const job = await model.getJobByTitle('Mow lawn');
    expect(job.title).toBe('Mow lawn');
});

test('Throws DatabaseError for non-existent title', async () => {
        await expect(model.getJobByTitle('Ghost job'))
            .rejects.toThrow(DatabaseError);
    });

test('Throws InvalidInputError for empty title', async () => {
        await expect(model.getJobByTitle(''))
            .rejects.toThrow(InvalidInputError);
    });

