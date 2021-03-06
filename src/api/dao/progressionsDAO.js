import { ObjectId } from 'mongodb';

import { error, info } from '../../utils/logger';

const { dbName, NODE_ENV } = require('../../utils/config');

let progressions;

export default class ProgressionsDAO {
  static async injectDB(conn) {
    if (progressions) {
      return;
    }
    try {
      const name = NODE_ENV === 'test' ? globalThis.__MONGO_DB_NAME__ : dbName;
      progressions = await conn.db(name).collection('progressions');
    } catch (e) {
      console.log('error');
      error(`Unable to establish collection handles in progressionsDAO: ${e}`);
    }
  }

  // I copied this from mflix. Not using it for now
  //  ----------------------------------------------------------------
  /**
     * Finds and returns progressions having one of the roots.
     * @param {number[]} roots - The roots to match with. single int also accepted.
     * @returns {QueryParams} - The QueryParams for root search.
     */
  static rootSearchQuery(roots) {
    const searchRoot = Array.isArray(roots) ? roots : [roots];

    const query = { root: { $in: searchRoot } };
    const project = {};
    const sort = [];

    return { query, project, sort };
  }
  //  ----------------------------------------------------------------

  /**
     *
     * @param {Object} filters - The search parameters to use in the query.
     * @param {number} page - The page of progressions to retrieve.
     * k@param {number} progressionPerPage - The number of progressions to display per page.
     * @returns {GetProgressionsResult} An object with list of progressions and number of
     *  progressions returned
     */
  static async getProgressions({
    // here's where the default parameters are set for the getProgressions method
    filters = null,
    page = 0,
    progressionsPerPage = 20,
  } = {}) {
    // --------mflix code--------
    // let queryParams = {}
    // if (filters) {
    //     if ("root" in filters) {
    //         queryParams = this.rootSearchQuery(filters['root'])
    //     }
    // }
    // let { query = {}, project = {}, sort = sort = [] } = queryParams
    // --------------------------
    const query = {};
    const project = {};
    const sort = [];

    if (filters) {
      if (filters.parentId) {
        query.parent_collection_id = ObjectId(filters.parentId);
      }
    } 

    let cursor;
    try {
      cursor = await progressions
        .find(query)
        .project(project)
        .sort(sort);
    } catch (e) {
      error(`Unable to issue find command, ${e}`);
      return { progressionsList: [], totalNumProgressions: 0 };
    }

    const displayCursor = cursor.limit(progressionsPerPage);

    try {
      const progressionsList = await displayCursor.toArray();
      const totalNumProgressions = page === 0 ? await progressions.countDocuments(query) : 0;

      return { progressionsList, totalNumProgressions };
    } catch (e) {
      error(
        `Unable to convert cursor to array or problem counting documents, ${e}`,
      );
      return { progressionsList: [], totalNumProgressions: 0 };
    }
  }

  static async getProgressionsBelongingToCollection(collectionId) {
    try {
      const progs = await progressions.find({
        parent_collection_id: ObjectId(collectionId),
      }).toArray();
      return progs;
    } catch (e) {
      error(e);
      return [];
    }
  }

  static async createProgression({
    title,
    root,
    chords,
    owner_id,
    parent_collection_id
  }) {
    try {
      const newProgression = {title, root, chords}
      if (owner_id) newProgression.owner_id = owner_id
      if (parent_collection_id) newProgression.parent_collection_id = parent_collection_id
      const result = await progressions.insertOne(newProgression)
      info(`A document was inserted into collections with the _id: ${result.insertedId}`);
      return newProgression
      
    } catch (e) {
      error(e)
      return {error: e}
      
    }
  }

  static async deleteProgression(id) {
    try {
      const progression = await progressions.findOne({ _id: ObjectId(id) });
      await progressions.deleteOne({ _id: ObjectId(id) });
      return progression;
    } catch (e) {
      error(e);
      return {error: e}
    }
  }
}

/**
 * A progression in Progressions App
 * @typedef Progression
 * @property {string} _id
 * @property {string} title
 * @property {number} root
 */

/**
 * Result set for getProgressions method
 * @typedef GetProgressionsResult
 * @property {Progressions[]} progressionsList
 * @property {number} totalNumResults
 */
