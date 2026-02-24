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

