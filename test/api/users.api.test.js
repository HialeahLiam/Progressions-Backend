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

describe('getting user personal collections', () => {
    
  test('print token', async () => {
    const response = await api
      .post('/api/v1/users/login')
      .send({ email: 'liamidrovo@gmail.com', password: 'password' })
      .expect(200);

    const token = response.body.auth_token;
    const users = await db.collection('users').find().toArray();
    console.log(users);
    console.log(token);
  });
});
