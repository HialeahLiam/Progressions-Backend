import ProgressionsDAO from '../../src/api/dao/progressionsDAO';
import {
  clearCollections, closeDB, populateCollections, setupDB,
} from '../utils/testing';

let db;

beforeAll(async () => {
  db = await setupDB();
});

beforeEach(async () => {
  await clearCollections();
  await populateCollections();
});

afterAll(async () => {
  // await connection.close();
  await closeDB();
});

describe('insert', () => {
  it('should insert a doc into collection', async () => {
    const users = db.collection('users');

    const mockUser = { _id: 'some-user-id', name: 'John' };
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({ _id: 'some-user-id' });
    expect(insertedUser).toEqual(mockUser);
  });
});
