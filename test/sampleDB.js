import { ObjectId } from 'bson';

const generateId = () => new ObjectId(ObjectId.generate(Date.now() / 1000));

export const collections = [
  {
    _id: generateId(),
    title: 'Radiohead',
  },
  {
    _id: generateId(),
    title: 'The Beatles',
  },
  {
    _id: generateId(),
    title: 'Mac Demarco',
  },
];

collections.push(
  {
    _id: generateId(),
    title: 'My Kind of Woman',
    parent_collection_id: collections.find((o) => o.title === 'Mac Demarco'),
    entry_type: 'progression',
  },
  {
    _id: generateId(),
    title: 'Freaking Out The Neighborhood',
    parent_collection_id: collections.find((o) => o.title === 'Mac Demarco'),
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
];
