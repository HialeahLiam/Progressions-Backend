import ProgressionsDAO from '../src/api/dao/progressionsDAO';

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
    await ProgressionsDAO.injectDB(connection);
  });

  afterAll(async () => {
    await connection.close();
  });

  it('should insert a doc into collection', async () => {
    const users = db.collection('users');

    const mockUser = { _id: 'some-user-id', name: 'John' };
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({ _id: 'some-user-id' });
    expect(insertedUser).toEqual(mockUser);
  });
});
