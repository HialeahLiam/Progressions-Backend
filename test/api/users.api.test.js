import { hash } from 'bcrypt';
import supertest from 'supertest';
import { User } from '../../src/api/controllers/users.controller';
import app from '../../src/app';
import {
  setupDB,
  populateCollections,
  clearCollections,
  closeDB,
} from '../utils/testing';

const api = supertest(app);
let db;
let loggedInUserToken;
let loggedInUserId;

let otherUserId;

beforeAll(async () => {
  db = await setupDB();
});

beforeEach(async () => {
  await clearCollections();
  await populateCollections();

  const response = await api
    .post('/api/v1/users/login')
    .send({ email: 'liamidrovo@gmail.com', password: 'password' })
    .expect(200);
  loggedInUserToken = response.body.auth_token;
  loggedInUserId = response.body.info._id;

  const result = await db.collection('users').findOne({ username: 'Eryck Mercado' });
  otherUserId = result._id.toString();
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
      .post('/api/v1/users/register')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await db.collection('users').find().toArray();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test('single user logs in successfully', async () => {
    await api
      .post('/api/v1/users/login')
      .send({ email: 'kurtm@gmail.com', password: 'password' })
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('login with invalid email', async () => {
    const response = await api
      .post('/api/v1/users/login')
      .send({ email: 'kurt@gmail.com', password: 'password' })
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toEqual(expect.objectContaining({
      error: 'Account with that email not found.',
    }));
  });

  test('login with invalid password', async () => {
    const response = await api
      .post('/api/v1/users/login')
      .send({ email: 'kurtm@gmail.com', password: 'passord' })
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toEqual(expect.objectContaining({
      error: 'Incorrect password.',
    }));
  });
});

describe('getting user collections', () => {
  test('logged in user can retrieve their collections', async () => {
    const response = await api
      .get(`/api/v1/users/${loggedInUserId}/collections`)
      .auth(loggedInUserToken, { type: 'bearer' })
      .expect(200);

    const { collections } = response.body;
    expect(collections).toHaveLength(1);
    expect(collections).toContainEqual(expect.objectContaining({
      title: 'The Strokes',
      entries: [
        expect.objectContaining({
          title: 'Trying Your Luck',
          entries: [
            expect.objectContaining(
              { title: 'Trying Your Luck - Verse' },
            )],
        }),
        expect.objectContaining({ title: 'Last Nite' }),
      ],
    }));
  });
  test('should not be able to retrieve collections of other user', async () => {
    await api
      .get(`/api/v1/users/${otherUserId}/collections`)
      .auth(loggedInUserToken, { type: 'bearer' })
      .expect(404);
  });

  test('should not retrieve private collections if not logged in', async () => {
    await api
      .get(`/api/v1/users/${loggedInUserId}/collections`)
      .expect(401);
  });
});

describe('user creating top level collection', () => {
  const newCollection = {
    title: 'Paul Simon',
  };

  test('user should create collection in their library if logged in', async () => {
    await api
      .post(`/api/v1/users/${loggedInUserId}/collections`)
      .send({ collection: newCollection })
      .auth(loggedInUserToken, { type: 'bearer' })
      .expect(201);
  });

  test('user should not create collection in other user\'s library', async () => {
    await api
      .post(`/api/v1/users/${otherUserId}/collections`)
      .send({ collection: newCollection })
      .auth(loggedInUserToken, { type: 'bearer' })
      .expect(404);
  });

  test('cannot create collection in any library if not logged in', async () => {
    await api
      .post(`/api/v1/users/${loggedInUserId}/collections`)
      .send({ collection: newCollection })
      .expect(401);
  });

  test('collection should have title', async () => {
    await api
      .post(`/api/v1/users/${loggedInUserId}/collections`)
      .send({ })
      .auth(loggedInUserToken, { type: 'bearer' })
      .expect(400);
  });
});
