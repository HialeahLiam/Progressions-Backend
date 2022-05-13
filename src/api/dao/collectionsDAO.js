import { ObjectId } from 'bson';
import { CURSOR_FLAGS } from 'mongodb';
import { info, error } from '../../utils/logger';
import { dbName, NODE_ENV } from '../../utils/config';
import ProgressionsDAO from './progressionsDAO';
import { UserException } from '../../utils/exceptions';

let collections;
let progressions;

export default class CollectionsDAO {
  static async injectDB(conn) {
    if (collections) {
      return;
    }
    try {
      // globalThis.__MONGO_DB_NAME__ refers to in-memory db created by @shelf/jest-mongodb
      const name = NODE_ENV === 'test' ? globalThis.__MONGO_DB_NAME__ : dbName;
      collections = await conn.db(name).collection('collections');
      console.log('COLLECTIONS INJECTED');
    } catch (e) {
      error(`Unable to establish collection handles in collectionsDAO: ${e}`);
    }
  }

  static async getEntries(collectionId) {
    try {
      const collection = await collections.findOne({ _id: ObjectId(collectionId) });
      console.log('Collections from inside DAO:', await collections.find().toArray());
      console.log('PARENT COLLECTION:', collection);
      if (collection.entry_type === 'collection') {
        console.log('collection');
        const entries = await collections.find({ parent_collection_id: ObjectId(collectionId) });
        return entries.toArray();
      }
      // NOT SURE IF AGGREGATION IS FUNCTIONING CORRECTLY
      if (collection.entry_type === 'progression') {
        console.log('Entry type is progression');
        const entries = await collections.aggregate(
          [
            { $match: { _id: new ObjectId(collectionId) } },
            {
              $lookup: {
                from: 'progressions',
                let: { id: '$_id' },
                pipeline: [{ $match: { $expr: { $eq: ['$parent_collection_id', '$$id'] } } }],
                as: 'entries',
              },
            },
          ],
        );
        return entries.toArray();
      }
      // Collection does not have children and is empty.
      console.log('empty');
      return ['empty'];
    } catch (e) {
      error(e);
      return ['error'];
    }
  }

  static async getTopLevelPublicCollections() {
    try {
      // Looking for collections without parent_collection_id because top
      // level collections do not have parents.
      const cursor = await collections.find({ parent_collection_id: { $exists: false } });
      return cursor.toArray();
    } catch (e) {
      error(e);
      return [];
    }
  }

  static async addCollectionToCollection(id, entry) {
    // Check if collection exists in db
    const collection = await collections.findOne(Object(id));
    if (!collection) {
      throw new UserException('Collection with provided id does not exist.');
    }

    // Check that collection doesn't contain progressions
    const { totalNumProgressions } = await ProgressionsDAO.getProgressions({
      filter: {
        parentId: id,
      },
    });

    if (totalNumProgressions > 0) {
      throw new UserException('Cannot add collection to a collection containing progressions');
    }

    // Check if collection already has collection with provided title
    const results = await collections.find({ parent_collection_id: ObjectId(id) }).toArray();
    if (results.find((element) => element.title === entry.collection.title)) {
      throw new UserException(`Collection ${id} already contains a collection titled ${entry.collection.title}.`);
    }

    // Check that entry has valid properties

    // Add entry to collections

    // Add provided collection as entry's parent

    const newCollection = {
      title: entry.collection.title,
      parent_collection_id: ObjectId(id),
      owner_id: collection.owner_id,
    };
    const result = await collections.insertOne(newCollection);
    console.log(`A document was inserted into collections with the _id: ${result.insertedId}`);
    return res.json(newCollection);
  }

  static async addProgressionToCollection(id, entry) {}
}
