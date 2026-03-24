import app from './app.js';
import * as model from './jobModelMongoDB.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

const testRequest = supertest(app); // supertest binds app to a random port
let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  console.log('Mock DB started');
});

afterAll(async () => {
  await mongod.stop();
  console.log('Mock DB stopped');
});

beforeEach(async () => {
  const url = mongod.getUri();
  await model.initialize('jobboard_test', true, url); // fresh DB each test
});

afterEach(async () => {
  await model.close();
});


//add jobs 
test('SUCCESS 201: creates a job and returns it', async () => {
    const res = await testRequest.post('/jobs').send({
      title: 'Fix leaky faucet',
      description: 'Drips constantly.',
      location: 'Montreal',
      budget: 80
    });
    expect(res.status).toBe(201);
    expect(res.body.job.title).toBe('Fix leaky faucet');
    expect(res.body.job.status).toBe('open');
  });
  test('FAIL 400: empty title returns 400', async () => {
    const res = await testRequest.post('/jobs').send({
      title: '',
      description: 'Drips.',
      location: 'Montreal',
      budget: 80
    })}
    
