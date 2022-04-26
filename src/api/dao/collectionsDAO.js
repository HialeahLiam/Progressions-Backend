import { ObjectId } from 'bson';
import { info, error } from '../../utils/logger';
import { dbName } from '../../utils/config';
import ProgressionsDAO from './progressionsDAO';
import { UserException } from '../../utils/exceptions';

let collections;

export default class CollectionsDAO {
  static async injectDB(conn) {
    if (collections) {
      return;
    }
    try {
      collections = await conn.db(dbName).collection('collections');
    } catch (e) {
      error(`Unable to establish collection handles in collectionsDAO: ${e}`);
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
