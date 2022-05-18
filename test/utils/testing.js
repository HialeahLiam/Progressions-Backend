import CollectionsDAO from '../../src/api/dao/collectionsDAO';
import ProgressionsDAO from '../../src/api/dao/progressionsDAO';
import { collections as sampleCollections, progressions as sampleProgressions } from '../sampleDB';

const { MongoClient } = require('mongodb');

let connection;
let db;

const setupDB = async () => {
  const client = new MongoClient(globalThis.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  connection = await client.connect();
  db = await connection.db(globalThis.__MONGO_DB_NAME__);
  await CollectionsDAO.injectDB(connection);
  await ProgressionsDAO.injectDB(connection);
  return db;
};

const clearCollections = async () => {
  await db.collection('collections').deleteMany();
  await db.collection('progressions').deleteMany();
};

const populateCollections = async () => {
  await db.collection('collections').insertMany(sampleCollections);
  await db.collection('progressions').insertMany(sampleProgressions);
};

const closeDB = async () => {
  await connection.close();
};

export {
  setupDB,
  populateCollections,
  clearCollections,
  closeDB,
};
