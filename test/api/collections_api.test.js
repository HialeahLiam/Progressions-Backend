import supertest from 'supertest';
import app from '../../src/app';
import CollectionsDAO from '../../src/api/dao/collectionsDAO';

const api = supertest(app);

const { MongoClient } = require('mongodb');

describe('insert', () => {
  let connection;
  let db;
  const client = new MongoClient(globalThis.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  beforeAll(async () => {
    connection = await client.connect();
    db = await connection.db(globalThis.__MONGO_DB_NAME__);
    await CollectionsDAO.injectDB(connection);
  });

  afterAll(async () => {
    await connection.close();
  });

  test('public collections are returned as json', async () => {
    await api
      .get('/api/v1/collections')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });
});
