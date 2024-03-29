import { hash } from 'bcrypt';
import CollectionsDAO from '../../src/api/dao/collectionsDAO';
import ProgressionsDAO from '../../src/api/dao/progressionsDAO';
import UsersDAO from '../../src/api/dao/usersDAO';
import { collections as sampleCollections, progressions as sampleProgressions, users } from '../sampleDB';

const { MongoClient } = require('mongodb');

let connection;
let db;

const setupDB = async () => {
  console.log(1);
  const client = new MongoClient(globalThis.__MONGO_URI__, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(2)
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
  /**
   * Adding password hash to all user entries. Had to do it this way
   * because hash() is asynchronous and I couldn't find a way to use it
   * inside sampleDB
   */
  const usersWithPassword = await Promise.all(users.map(async (u) => ({
    ...u,
    password: await hash('password', 10),
  })));
  await db.collection('users').insertMany(usersWithPassword);
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
