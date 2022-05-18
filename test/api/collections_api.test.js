import supertest from 'supertest';
import app from '../../src/app';
import {
  setupDB,
  populateCollections,
  clearCollections,
  closeDB,
} from '../utils/testing';

const api = supertest(app);

beforeAll(async () => {
  await setupDB();
});

beforeEach(async () => {
  await clearCollections();
  await populateCollections();
});

afterAll(async () => {
  // await connection.close();
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
