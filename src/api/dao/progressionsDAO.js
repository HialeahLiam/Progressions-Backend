import { ObjectId } from 'mongodb';
import { getUserWithUid } from '../../firebase.js';
import { dbName, NODE_ENV } from '../../utils/config.js';

import { error, info } from '../../utils/logger.js';


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

	static async getSingleProgression(id) {
		const result = await progressions.findOne({_id: ObjectId(id)})

		return result
	}

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
				parent_collection_id: collectionId,
			}).toArray();
			return progs;
		} catch (e) {
			error(e);
			return [];
		}
	}

	// A progressions should have:
	// audio
	// chords
	// mode
	// parent_collection_id
	// root
	// title
	// owner_id

	// owner_id instead of username because it is a private entry, so it belongs to a user, and you 
	// don't care about the username. When it's public, it doesn't belong to any user, but you care who 
	// published it.
	static async createProgression({
		audio,
		chords,
		mode,
		parent_collection_id,
		root,
		title,
		owner_id,
	}) {
		try {

			const newProgression = {audio, chords,mode,parent_collection_id, root, title, owner_id};
			console.log('newProgression')
			console.log(newProgression)
			// if (owner_id) newProgression.owner_id = owner_id;
			// if (parent_collection_id) newProgression.parent_collection_id = parent_collection_id;
			const result = await progressions.insertOne(newProgression);
			info(`A document was inserted into collections with the _id: ${result.insertedId}`);
			return newProgression;
      
		} catch (e) {
			error(e);
			return {error: e};
      
		}
	}

	static async deleteProgression(id) {
		const progression = await progressions.findOne({ _id: ObjectId(id) });
		await progressions.deleteOne({ _id: ObjectId(id) });
		console.log(`progression ${id} deleted`)
		return progression;
	}


	static async updateProgression(id, updatedProgression) {
		// Assumes updatedProgression properties are titled the same as in MongoDb doc

		const filter = {_id: ObjectId(id)}

		const updateDoc = {
			$set: updatedProgression
		}

		const result = await progressions.updateOne(filter, updateDoc)
		console.log(result)
		if (result.modifiedCount > 0) console.log(`progression ${id} updated`)
		return await progressions.find({_id: ObjectId(id)}).toArray()

	}

	static async copyAndMakePublic(id, newParentId) {
		
		const progression = await progressions.findOne({_id: ObjectId(id)})
		
		const {owner_id, _id, ...pub} = progression
		if (newParentId) pub.parent_collection_id = newParentId;
		const {displayName} = await getUserWithUid(owner_id)
		pub.user = displayName;
		const {insertedId} = await progressions.insertOne(pub)

		return insertedId.toString()
	}
}

// 6330ba8075c7935e2a676003

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
