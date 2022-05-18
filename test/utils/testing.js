import CollectionsDAO from '../../src/api/dao/collectionsDAO';
import ProgressionsDAO from '../../src/api/dao/progressionsDAO';
import UsersDAO from '../../src/api/dao/usersDAO';
import { collections as sampleCollections, progressions as sampleProgressions, users } from '../sampleDB';

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
  await UsersDAO.injectDB(connection);
  return db;
};

const clearCollections = async () => {
  await db.collection('collections').deleteMany();
  await db.collection('progressions').deleteMany();
  await db.collection('users').deleteMany();
};

const populateCollections = async () => {
  await db.collection('collections').insertMany(sampleCollections);
  await db.collection('progressions').insertMany(sampleProgressions);
  await db.collection('users').insertMany(users);
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
