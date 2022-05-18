import CollectionsDAO from '../../src/api/dao/collectionsDAO';
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
  await closeDB();
});

describe('getEntries()', () => {
  test('Collection with progressions', async () => {
    const { _id } = await db.collection('collections').findOne({ title: 'My Kind of Woman' });
    const entries = await CollectionsDAO.getEntries(_id.toString());
    const titles = entries.map((prog) => prog.title);
    expect(titles).toEqual(['My Kind of Woman - Verse', 'My Kind of Woman - Chorus']);
  });

  test('Collection with collections', async () => {
    const { _id } = await db.collection('collections').findOne({ title: 'Mac Demarco' });
    const entries = await CollectionsDAO.getEntries(_id.toString());
    const titles = entries.map((c) => c.title);
    expect(titles).toEqual(['My Kind of Woman', 'Freaking Out The Neighborhood']);
  });
});

describe('getTopLevelPublicCollections', () => {
  test('Returned collections belong to no user', async () => {
    const results = await CollectionsDAO.getTopLevelPublicCollections();
    const collections = results.filter((c) => c.owner_id);
    expect(collections).toHaveLength(0);
  });

  test('Returned collections do not belong to other collections', async () => {
    const results = await CollectionsDAO.getTopLevelPublicCollections();
    const collections = results.filter((c) => c.parent_collection_id);
    expect(collections).toHaveLength(0);
  });
});
