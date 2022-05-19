import { hash } from 'bcrypt';
import { ObjectId } from 'bson';

const generateId = () => new ObjectId(ObjectId.generate(Date.now() / 1000));

export const users = [
  {
    _id: generateId(),
    username: 'Liam Idrovo',
    email: 'liamidrovo@gmail.com',
  },
  {
    _id: generateId(),
    username: 'Eryck Mercado',
    email: 'eryckmercado@gmail.com',
  },
];

export const collections = [
  {
    _id: generateId(),
    title: 'Radiohead',
    entry_type: 'collection',
    owner_id: users.find(({ username }) => username === 'Eryck Mercado'),
  },
  {
    _id: generateId(),
    title: 'The Beatles',
    entry_type: 'collection',
  },
  {
    /**
     * Do not add owner_id key. Tests assume this collection is public
     * Do not add descendant collections/progressions. Tests assume current parent/child hierarchy.
     */
    _id: generateId(),
    title: 'Mac Demarco',
    entry_type: 'collection',
  },
  {
    _id: generateId(),
    title: 'The Strokes',
    entry_type: 'collection',
    owner_id: users.find(({ username }) => username === 'Liam Idrovo'),
  },
];

collections.push(
  {
    _id: generateId(),
    title: 'My Kind of Woman',
    parent_collection_id: collections.find((o) => o.title === 'Mac Demarco')._id,
    entry_type: 'progression',
  },
  {
    _id: generateId(),
    title: 'Freaking Out The Neighborhood',
    parent_collection_id: collections.find((o) => o.title === 'Mac Demarco')._id,
    entry_type: 'progression',
  },
  {
    _id: generateId(),
    title: 'Trying Your Luck',
    parent_collection_id: collections.find((o) => o.title === 'The Strokes')._id,
    entry_type: 'progression',
  },
  {
    _id: generateId(),
    title: 'Last Nite',
    parent_collection_id: collections.find((o) => o.title === 'The Strokes')._id,
    entry_type: 'progression',
  },
);

export const progressions = [
  {
    title: 'My Kind of Woman - Verse',
    root: 9,
    mode: 'major',
    parent_collection_id: collections.find((o) => o.title === 'My Kind of Woman')._id,
  },
  {
    title: 'My Kind of Woman - Chorus',
    root: 9,
    mode: 'major',
    parent_collection_id: collections.find((o) => o.title === 'My Kind of Woman')._id,
  },
  {
    title: 'Freaking Out The Neighborhood - Intro',
    root: 9,
    mode: 'major',
    parent_collection_id: collections.find((o) => o.title === 'Freaking Out The Neighborhood')._id,
  },
  {
    title: 'Trying Your Luck - Verse',
    root: 9,
    mode: 'major',
    parent_collection_id: collections.find((o) => o.title === 'Trying Your Luck')._id,
  },
];
