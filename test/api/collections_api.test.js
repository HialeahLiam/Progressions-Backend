import supertest from 'supertest';
import app from '../../src/app';
import CollectionsDAO from '../../src/api/dao/collectionsDAO';
import ProgressionsDAO from '../../src/api/dao/progressionsDAO';
import { collections as sampleCollections, progressions as sampleProgressions } from '../sampleDB';

const api = supertest(app);

const { MongoClient } = require('mongodb');

let connection;
let db;

beforeAll(async () => {
  const client = new MongoClient(globalThis.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  connection = await client.connect();
  db = await connection.db(globalThis.__MONGO_DB_NAME__);
  await CollectionsDAO.injectDB(connection);
  await ProgressionsDAO.injectDB(connection);
});

beforeEach(async () => {
  //   Delete database entries
  await db.collection('collections').deleteMany();
  await db.collection('progressions').deleteMany();

  await db.collection('collections').insertMany(sampleCollections);
  await db.collection('progressions').insertMany(sampleProgressions);
});

afterAll(async () => {
  await connection.close();
});

describe('getting public collections', () => {
  test('public collections are returned as json', async () => {
    await api
      .get('/api/v1/collections')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('collections shouldn\'t belong to any user', async () => {
    const response = await api.get('/api/v1/collections');
    const { collections } = response.body;
    const privateCollections = collections.filter((c) => c.owner_id);
    expect(privateCollections.length).toBe(0);
  });

  test('collections should contain all descendent collections and progressions', async () => {
    const response = await api.get('/api/v1/collections');
    // console.log(response.body.collections[1].entries[0]);
    const { collections } = response.body;

    const macDemarco = collections.map(({ title, entries }) => ({ title, entries })).find((c) => c.title === 'Mac Demarco');
    macDemarco.entries = macDemarco.entries.map(({ title, entries }) => ({ title, entries }));
    const myKindOfWoman = macDemarco.entries.find((entry) => entry.title === 'My Kind of Woman');
    myKindOfWoman.entries = myKindOfWoman.entries.map(({ title }) => ({ title }));
    const expected = {
      title: 'Mac Demarco',
      entries: [
        {
          title: 'My Kind of Woman',
          entries: [
            {
              title: 'My Kind of Woman - Verse',
            },
            {
              title: 'My Kind of Woman - Chorus',
            },
          ],
        },
        {
          title: 'Freaking Out The Neighborhood',
          entries: [],
        },
      ],
    };

    expect(macDemarco).toEqual(expected);
  });
});
