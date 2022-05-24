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
let loggedInUserToken;
let loggedInUserId;

// let otherUserId;

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

  // const result = await db.collection('users').findOne({ username: 'Eryck Mercado' });
  // otherUserId = result._id.toString();
});

afterAll(async () => {
  await closeDB();
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
    expect(privateCollections).toHaveLength(0);
  });

  test('collections should contain all descendent collections and progressions', async () => {
    const response = await api.get('/api/v1/collections');
    // console.log(response.body.collections[1].entries[0]);
    const { collections } = response.body;

    const macDemarco = collections.map(({ title, entries }) => ({ title, entries })).find((c) => c.title === 'Mac Demarco');
    macDemarco.entries = macDemarco.entries.map(({ title, entries }) => ({ title, entries }));
    macDemarco.entries = macDemarco.entries.map((e) => {
      e.entries = e.entries.map(({ title }) => ({ title }));
      const { title, entries } = e;
      return { title, entries };
    });
    // const myKindOfWoman = macDemarco.entries.find((entry) => entry.title === 'My Kind of Woman');
    // myKindOfWoman.entries = myKindOfWoman.entries.map(({ title }) => ({ title }));
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
          entries: [
            {
              title: 'Freaking Out The Neighborhood - Intro',
            },
          ],
        },
      ],
    };

    expect(macDemarco).toEqual(expected);
  });
});

describe('deleting collection', () => {
  let parentCollectionId;
  beforeAll(async () => {
    const result = await db.collection('collections').findOne({ title: 'The Strokes' });
    parentCollectionId = result._id.toString();
  });

  test('cannot delete collection in any library if user not logged in', async () => {
    await api
      .delete(`/api/v1/collections/${parentCollectionId}`)
      .expect(401);
  });

  test('user deletes only collection in their library', async () => {
    const res = await api
      .delete(`/api/v1/collections/${parentCollectionId}`)
      .auth(loggedInUserToken, { type: 'bearer' })
      .expect(200);

    const { collections } = res.body;
    expect(collections).toHaveLength(0);
  });
});

describe('creating collection entry', () => {
  let entryParent;
  let collectionOfProgressions;
  let collectionOfCollections;

  beforeAll(async () => {
    let result = await db.collection('collections').findOne({ title: 'The Strokes' });
    entryParent = result._id.toString();

    result = await db.collection('collections').findOne({ title: 'Last Nite' });
    collectionOfProgressions = result._id.toString();

    result = await db.collection('collections').findOne({ title: 'The Strokes' });
    collectionOfCollections = result._id.toString();
  });

  test('request body contains "collection" property containing object', async () => {
    const res = await api
      .post(`/api/v1/collections/${entryParent}`)
      .send({})
      .auth(loggedInUserToken, { type: 'bearer' })
      .expect(400);

    const { error } = res.body;
    expect(error).toBe('Request must contain a "collections" key');
  });

  describe('entry\'s parent should be existing collection in user\'s library', () => {
    test('parent collection cannot be in other users\'s library', async () => {
      const unauthorizedCollection = await db.collection('collections').findOne({ title: 'Radiohead' });
      const id = unauthorizedCollection._id.toString();
      const res = await api
        .post(`/api/v1/collections/${id}`)
        .send({ collection: {} })
        .auth(loggedInUserToken, { type: 'bearer' })
        .expect(404);

      const { error } = res.body;
      expect(error).toBe('You are trying to edit a collection that does not belong to you.');
    });

    test('parent collection cannot be a public collection', async () => {
      const publicCollection = await db.collection('collections').findOne({ title: 'Mac Demarco' });
      const id = publicCollection._id.toString();

      const res = await api
        .post(`/api/v1/collections/${id}`)
        .send({ collection: {} })
        .auth(loggedInUserToken, { type: 'bearer' })
        .expect(404);

      const { error } = res.body;
      expect(error).toBe('You cannot edit a public collection');
    });
  });

  test('user must be logged in', async () => {
    const res = await api
      .post(`/api/v1/collections/${entryParent}`)
      .send({ collection: {} })
      .expect(401);

    const { error } = res.body;
    expect(error).toBe('You must be logged in.');
  });

  describe('creating child collection', () => {
    const newCollection = { title: 'Is This It' };

    test('valid child collection added to collection', async () => {
      const res = await api
        .post(`/api/v1/collections/${collectionOfCollections}`)
        .send({ collection: newCollection })
        .auth(loggedInUserToken, { type: 'bearer' })
        .expect(200);

      const { collections } = res.body;
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
          expect.objectContaining({
            title: 'Last Nite',
          }),
          expect.objectContaining({
            title: 'Is This It',
          }),
        ],
      }));
    });

    test('parent collection should not contain progressions', async () => {
      const res = await api
        .post(`/api/v1/collections/${collectionOfProgressions}`)
        .send({ collection: newCollection })
        .auth(loggedInUserToken, { type: 'bearer' })
        .expect(400);

      const { error } = res.body;
      expect(error).toBe('You cannot add a collection to a collection already containing progressions.');
    });

    test('collection should have title', async () => {
      const res = await api
        .post(`/api/v1/collections/${collectionOfCollections}`)
        .send({ collection: { song: 'Is This It' } })
        .auth(loggedInUserToken, { type: 'bearer' })
        .expect(400);

      const { error } = res.body;
      expect(error).toBe('Your collection needs a title.');
    });
  });

  describe('user creating progression', () => {
    const validProgression = {
      title: 'Last Nite - Chorus',
      root: 9,
      chords: [[0, 3, 5], [1, 5, 9]],
    };

    test('valid progression added to user\'s collection', async () => {
      const res = await api
        .post(`/api/v1/collections/${collectionOfProgressions}`)
        .send({ collection: validProgression })
        .auth(loggedInUserToken, { type: 'bearer' })
        .expect(200);

      const { collections } = res.body;
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
          expect.objectContaining({
            title: 'Last Nite',
            entries: [
              expect.objectContaining(
                { title: 'Last Nite - Chorus' },
              )],
          }),
        ],
      }));
    });

    test('parent collection should not contain collections', async () => {
      const res = await api
        .post(`/api/v1/collections/${collectionOfCollections}`)
        .send({ collection: validProgression })
        .auth(loggedInUserToken, { type: 'bearer' })
        .expect(400);

      const { error } = res.body;
      expect(error).toBe('You cannot add a progression to a collection already containing collections.');
    });

    test('progression should have title', async () => {
      const wrongProgression = {
        root: 9,
        chords: [[0, 3, 5], [1, 5, 9]],
      };

      const res = await api
        .post(`/api/v1/collections/${collectionOfProgressions}`)
        .send({ collection: wrongProgression })
        .auth(loggedInUserToken, { type: 'bearer' })
        .expect(400);

      const { error } = res.body;
      expect(error).toBe('Your progression needs a title.');
    });

    test('progression should have valid chords', async () => {});

    test('progression should have valid root', async () => {

    });
  });
});
