import CollectionsDAO from '../../src/api/dao/collectionsDAO';
import { collections as sampleCollections, progressions as sampleProgressions } from '../sampleDB';

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
});

beforeEach(async () => {
  //   Delete database entries
  await db.collection('collections').deleteMany();
  await db.collection('progressions').deleteMany();

  await db.collection('collections').insertMany(sampleCollections);
  await db.collection('progressions').insertMany(sampleProgressions);
  console.log('In memory collections:', await db.collection('collections').find().toArray());
});

afterAll(async () => {
  await connection.close();
});

describe('getEntries()', () => {
  test('Collection with progressions', async () => {
    const { _id } = await db.collection('collections').findOne({ title: 'My Kind of Woman' });
    console.log('Parent id', _id.toString());
    const entries = await CollectionsDAO.getEntries(_id.toString());
    const titles = entries.map((prog) => prog.title);
    expect(titles).toBe(['My Kind of Woman - Verse', 'My Kind of Woman - Chorus']);
  });
});
