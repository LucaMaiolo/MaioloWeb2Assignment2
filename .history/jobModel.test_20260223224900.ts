import { MongoMemoryServer } from 'mongodb-memory-server';
import { initialize, addJob, getJobByTitle, getAllJobs, updateJob, deleteJob } from './jobModelMongoDB.js';
import { InvalidInputError } from './InvalidInputError.js';
import { DatabaseError } from './DatabaseError.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await initialize(mongod.getUri()); // uses your new url param
});

afterAll(async () => {
    await mongod.stop();
});