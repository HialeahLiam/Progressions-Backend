/* eslint-disable no-await-in-loop */
import {  ObjectId } from 'bson';
import res, { cookie } from 'express/lib/response';
import { error, info } from '../../utils/logger';
import { dbName, NODE_ENV } from '../../utils/config';
import ProgressionsDAO from './progressionsDAO';
import { UserException } from '../../utils/exceptions';
import CollectionsController from '../controllers/collections.controller';

let collections;

export default class CollectionsDAO {
  static async injectDB(conn) {
    if (collections) {
      return;
    }
    try {
      // globalThis.__MONGO_DB_NAME__ refers to in-memory db created by @shelf/jest-mongodb
      const name = NODE_ENV === 'test' ? globalThis.__MONGO_DB_NAME__ : dbName;
      collections = await conn.db(name).collection('collections');
    } catch (e) {
      error(`Unable to establish collection handles in collectionsDAO: ${e}`);
    }
  }

  static async getEntries(collectionId) {
    try {
      const collection = await collections.findOne({ _id: ObjectId(collectionId) });
      if (collection.entry_type === 'collection') {
        return await collections.find({ parent_collection_id: ObjectId(collectionId) }).toArray();
      }
      if (collection.entry_type === 'progression') {
        return await ProgressionsDAO.getProgressionsBelongingToCollection(collectionId);
      }
      // Collection does not have children and is empty.
      return [];
    } catch (e) {
      error(e);
      return { error: e };
    }
  }

  static async getTopLevelPublicCollections() {
    try {
      // Looking for collections without parent_collection_id because top
      // level collections do not have parents.
      return await collections.find({
        parent_collection_id: { $exists: false },
        owner_id: { $exists: false },
      }).toArray();
    } catch (e) {
      error(e);
      return { error: e };
    }
  }

  static async deleteCollection(collectionId) {
    try {
      const collectionQueue = [await collections.findOne({ _id: ObjectId(collectionId) })];
      const progressionQueue = [];
      const deletions = [];
      while (collectionQueue.length > 0) {
        const parent = collectionQueue.shift();

        const children = await CollectionsDAO.getEntries(parent._id);

        if (parent.entry_type && parent.entry_type === 'collection') {
          collectionQueue.push(...children);
        } else {
          progressionQueue.push(...children);
        }

        await collections.deleteOne({ _id: ObjectId(parent._id) });
        deletions.push(parent);
      }

      while (progressionQueue.length > 0) {
        deletions.push(await ProgressionsDAO.deleteProgression(
          progressionQueue.shift()._id.toString(),
        ));
      }

      return deletions;
    } catch (e) {
      error(e);
      return { error: e };
    }
  }

  static async getTopLevelUserCollections(userId) {
    try {
      // Looking for collections without parent_collection_id because top
      // level collections do not have parents.
      return await collections.find({
        parent_collection_id: { $exists: false },
        owner_id: ObjectId(userId),
      }).toArray();
    } catch (e) {
      error(e);
      return { error: e };
    }
  }

  static async getUserCollections(userId) {
    try {
      const userCollections = await CollectionsDAO.getTopLevelUserCollections(userId);
      const queue = [...userCollections];
      while (queue.length > 0) {
        const parent = queue.shift();

        // eslint-disable-next-line no-await-in-loop
        const children = await CollectionsDAO.getEntries(parent._id.toString());

        parent.entries = children;
        if (parent.entry_type === 'collection') {
          queue.push(...children);
        }
      }

      return userCollections;
    } catch (e) {
      error(e);
      return { error: e };
    }
  }

  static async addCollectionToCollection(id, entry) {
    try { 


      // Check if collection exists in db
      const parentCollection = await collections.findOne(ObjectId(id))
      if (!parentCollection) {
        return { error: 'Collection with provided id does not exist.' };
      }

      // Check that collection doesn't contain progressions
      const { totalNumProgressions } = await ProgressionsDAO.getProgressions({
        filters: {
          parentId: id
        },
      });

      if (totalNumProgressions > 0) {
        return { error: 'You cannot add a collection to a collection already containing progressions.' };
      }
      // Set entry_type for parent to collection in the case it is empty
      await collections.updateOne(
        {_id: ObjectId(id)},
        {$set: {entry_type: 'collection'}}
      )

      // Check if collection already has collection with provided title
      const results = await collections.find({ parent_collection_id: ObjectId(id) }).toArray();
      
      if (results && results.find((element) => element.title === entry.title)) {
        return { error: `Collection ${id} already contains a collection titled ${entry.collection.title}.` };
      }


      // Add entry to collections
      // Add provided collection as entry's parent

      const newCollection = {
        title: entry.title,
        parent_collection_id: ObjectId(id),
        owner_id: parentCollection.owner_id,
      };
      const result = await collections.insertOne(newCollection);
      info(`A document was inserted into collections with the _id: ${result.insertedId}`);

      return newCollection;
    } catch (e) {
      error(e);
      return { error: e };
    }
  }

  // static async getEntryType(collectionId) {
  //   const {entry_type}=  await collections.findOne(ObjectId(collectionId))
  //   return entry_type
  // }

  static async getOwnerId(collectionId) {
    try {
      const { owner_id } = await collections.findOne(ObjectId(collectionId));
      if (owner_id) {
        return owner_id.toString();
      }
      return null
    } catch (e) {
      error(e);
      return { error: e };
    }
  }

  static async addProgressionToCollection(id, entry) {
   try { // Check if collection exists in db
      const parentCollection = await collections.findOne(ObjectId(id))
      if (!parentCollection) {
        return { error: 'Collection with provided id does not exist.' };
      }

      // Check that collection doesn't contain collections

      if (await collections.countDocuments({parent_collection_id: ObjectId(id)}) > 0) {

        return { error: 'You cannot add a progression to a collection already containing collections.' };
      }

      // Set entry_type for parent to collection in the case it is empty
       await collections.updateOne(
        {_id: ObjectId(id)},
        {$set: {entry_type: 'progression'}}
      )

      // Check if collection already has progress with provided title
      const results = await CollectionsDAO.getEntries(id);
      
      if (results && results.find((element) => element.title === entry.title)) {
        return { error: `Collection ${id} already contains a collection titled ${entry.collection.title}.` };
      }

       // Add entry to progression
      // Add provided collection as entry's parent

      const newProgression = {
        title: entry.title,
        root: entry.root,
        chords: entry.chords,
        parent_collection_id: ObjectId(id),
        owner_id: parentCollection.owner_id,
      };
      const result = await ProgressionsDAO.createProgression(newProgression)


      return result.error ? {error: result.error} : result;
    } catch(e) {
      error(e);
      return {error: e}
    }
  }
}
