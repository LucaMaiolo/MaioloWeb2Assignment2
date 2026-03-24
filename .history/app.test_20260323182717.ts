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
    });
    expect(res.status).toBe(400);
  });
  test('FAIL 400: negative budget returns 400', async () => {
    const res = await testRequest.post('/jobs').send({
      title: 'Fix faucet',
      description: 'Drips.',
      location: 'Montreal',
      budget: -10
    });
    expect(res.status).toBe(400);
  });


//get all jobs
test('SUCCESS 200: returns all jobs', async () => {
    await model.addJob('Fix faucet', 'Drips.', 'Montreal', 80);
    await model.addJob('Mow lawn', 'Front yard.', 'Laval', 60);
    const res = await testRequest.get('/jobs');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });
  test('SUCCESS 200: filters by status', async () => {
    await model.addJob('Fix faucet', 'Drips.', 'Montreal', 80);
    const res = await testRequest.get('/jobs?status=open');
    expect(res.status).toBe(200);
    expect(res.body.jobs.every((j: any) => j.status === 'open')).toBe(true);
  });
  test('FAIL 400: invalid status filter returns 400', async () => {
    const res = await testRequest.get('/jobs?status=pending');
    expect(res.status).toBe(400);
  });


//get one job
test('SUCCESS 200: finds job by title', async () => {
    await model.addJob('Fix faucet', 'Drips.', 'Montreal', 80);
    const res = await testRequest.get('/jobs/Fix faucet');
    expect(res.status).toBe(200);
    expect(res.body.job.title).toBe('Fix faucet');
  });
  test('FAIL 404: job not found returns 404', async () => {
    const res = await testRequest.get('/jobs/nonexistent job');
    expect(res.status).toBe(404);
  });
  test('FAIL 400: empty title returns 400', async () => {
    const res = await testRequest.get('/jobs/ ');
    expect(res.status).toBe(400);
  });


//update jobs
test('SUCCESS 200: updates job budget and status', async () => {
    await model.addJob('Fix faucet', 'Drips.', 'Montreal', 80);
    const res = await testRequest.put('/jobs/Fix faucet').send({
      budget: 120,
      status: 'in-progress'
    });
    expect(res.status).toBe(200);
  });
  test('FAIL 404: updating nonexistent job returns 404', async () => {
    const res = await testRequest.put('/jobs/ghost job').send({
      budget: 50, status: 'open'
    });
    expect(res.status).toBe(404);
  });
  test('FAIL 400: invalid status value returns 400', async () => {
    await model.addJob('Fix faucet', 'Drips.', 'Montreal', 80);
    const res = await testRequest.put('/jobs/Fix faucet').send({
      budget: 80, status: 'deleted'
    });
    expect(res.status).toBe(400);
  });


//delete jobs
  test('SUCCESS 200: deletes existing job', async () => {
    await model.addJob('Mow lawn', 'Front yard.', 'Laval', 60);
    const res = await testRequest.delete('/jobs/Mow lawn');
    expect(res.status).toBe(200);
  });
  test('FAIL 404: deleting nonexistent job returns 404', async () => {
    const res = await testRequest.delete('/jobs/ghost job');
    expect(res.status).toBe(404);
  });


// 500 error test
test('FAIL 500: returns 500 when DB is unavailable', async () => {
    await model.close(); // force DB to be unavailable
    const res = await testRequest.post('/jobs').send({
      title: 'Test job',
      description: 'Test.',
      location: 'Montreal',
      budget: 50
    });
    expect(res.status).toBe(500);
  });
