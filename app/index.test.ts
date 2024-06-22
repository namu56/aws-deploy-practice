import request from 'supertest';
import { LIST_KEY, RedisClient, createApp } from './app';
import { App } from 'supertest/types';
import * as redis from 'redis';

let app: App;
let client: RedisClient;

const TEST_REDIS_URL = 'redis://:test_env@localhost:6380';

beforeAll(async () => {
  client = redis.createClient({ url: TEST_REDIS_URL });
  await client.connect();
  app = await createApp(client);
});

beforeEach(async () => {
  await client.flushDb();
});

afterAll(async () => {
  await client.flushDb();
  await client.quit();
});

describe('POST /message', () => {
  it('responds with a success message', async () => {
    const response = await request(app).post('/messages').send({
      message: 'testing with redis',
    });
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Message added to list');
  });
});

describe('GET /messages', () => {
  it('responds with all messages', async () => {
    await client.lPush(LIST_KEY, ['msg1', 'msg2']);
    const response = await request(app).get('/messages');
    expect(response.statusCode).toBe(200);

    const messages = await client.lRange(LIST_KEY, 0, -1);
    expect(response.body).toEqual(messages);
  });
});
