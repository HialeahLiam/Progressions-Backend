import { hash } from 'bcrypt';
import supertest from 'supertest';
import app from '../../src/app';
import {
  setupDB,
  populateCollections,
  clearCollections,
  closeDB,
} from '../utils/testing';

const api = supertest(app);
let db;

beforeAll(async () => {
  db = await setupDB();
});

beforeEach(async () => {
  await clearCollections();
  await populateCollections();
});

afterAll(async () => {
  await closeDB();
});

describe('when there is intially one user in db', () => {
  beforeEach(async () => {
    db.collection('users').deleteMany();

    const passwordHash = await hash('password', 10);
    db.collection('users').insertOne({
      username: 'Kurt Morrissey',
      email: 'kurtm@gmail.com',
      password: passwordHash,
    });
  });

  test('creation succeeds with fresh username', async () => {
    const usersAtStart = await db.collection('users').find().toArray();

    const newUser = {
      username: 'Paul Lennon',
      email: 'paull@gmail.com',
      password: 'password',
    };

    await api
      .post('/api/v1/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await db.collection('users').find().toArray();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });
});
