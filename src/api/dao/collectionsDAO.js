
import { ObjectId } from 'bson';
import { getUserWithUid } from '../../firebase.js';
import { dbName, NODE_ENV } from '../../utils/config.js';
import { error, info } from '../../utils/logger.js';
import ProgressionsDAO from './progressionsDAO.js';

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
				return await collections.find({ parent_collection_id: collectionId }).toArray();
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

				const children = await CollectionsDAO.getEntries(parent._id.toString());

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
			console.log(`collection ${collectionId} and its children deleted`)
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
				owner_id: userId,
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
			const parentCollection = await collections.findOne(ObjectId(id));
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
			);

			// Check if collection already has collection with provided title
			const results = await collections.find({ parent_collection_id: id }).toArray();
      
			if (results && results.find((element) => element.title === entry.title)) {
				return { error: `Collection ${id} already contains a collection titled ${entry.collection.title}.` };
			}


			// Add entry to collections
			// Add provided collection as entry's parent

			const newCollection = {
				title: entry.title,
				parent_collection_id: id,
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

	static async postCollectionToUserLibrary(userId, collection) {
		try {
			const {title} = collection
			const collectionDoc = 	{
				title,
				owner_id: userId,
				entries: [],

			}
			const result = await collections.insertOne(collectionDoc)
			info(`A document was inserted into collections with the _id: ${result.insertedId}`);
			collectionDoc._id = result.insertedId
			return {collection: collectionDoc}
		
		} catch (error) {
			error(error)
			return {error: e}
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
			return null;
		} catch (e) {
			error(e);
			return { error: e };
		}
	}

	static async addProgressionToCollection(id, entry) {
		try { // Check if collection exists in db
			const parentCollection = await collections.findOne(ObjectId(id));
			if (!parentCollection) {
				return { error: 'Collection with provided id does not exist.' };
			}

			// Check that collection doesn't contain collections

			if (await collections.countDocuments({parent_collection_id: id}) > 0) {

				return { error: 'You cannot add a progression to a collection already containing collections.' };
			}

			// Set entry_type for parent to collection in the case it is empty
			await collections.updateOne(
				{_id: ObjectId(id)},
				{$set: {entry_type: 'progression'}}
			);

			// Check if collection already has progress with provided title
			const results = await CollectionsDAO.getEntries(id);
      
			if (results && results.find((element) => element.title === entry.title)) {
				return { error: `Collection ${id} already contains a collection titled ${entry.collection.title}.` };
			}

			// Add entry to progression
			// Add provided collection as entry's parent

			const newProgression = {
				title: entry.title,
				mode: entry.mode,
				root: entry.root,
				chords: entry.chords,
				parent_collection_id: id,
				owner_id: parentCollection.owner_id,
				audio: entry.audio
			};
			const result = await ProgressionsDAO.createProgression(newProgression);


			return result.error ? {error: result.error} : result;
		} catch(e) {
			error(e);
			return {error: e};
		}
	}

	static async copyAndMakePublic(id, newParentId) {
		
		const collection = await collections.findOne({_id: ObjectId(id)})
		
		const {owner_id, _id, ...pub} = collection
		if (newParentId) pub.parent_collection_id = newParentId;
		const {displayName} = await getUserWithUid(owner_id)
		pub.user = displayName;
		const {insertedId} = await collections.insertOne(pub)
		return insertedId.toString()
	}

	static async getCollections({
		// here's where the default parameters are set for the getCollections method
		filterText,
		ownerId = null,
		page = 0,
		collectionsPerPage = 20,
	} = {}) {

		let cursor
		const query = {owner_id: ownerId}
		if (filterText) {
			let queryParams = {}
			
			query.$text = { $search: filterText }
	
			console.log(query)
			try {
				cursor = await collections.find(query)
			} catch (e) {
				console.error(`Unable to issue find command, ${e}`)
				return { collections: [], totalNumCollections: 0 }
			}
		} else {
			// query = {
			// 		parent_collection_id: { $exists: false },
			// 		owner_id: { $exists: false },
			// }
			query.parent_collection_id = { $exists: false }

			try {
				// Looking for collections without parent_collection_id because top
				// level collections do not have parents.
				cursor = await collections.find(query);
			} catch (e) {
				console.error(`Unable to issue find command, ${e}`)
				return { collections: [], totalNumCollections: 0 }
			}
		}


		const displayCursor = cursor.skip(collectionsPerPage * page).limit(collectionsPerPage)

		try {
			const results = await displayCursor.toArray()
			console.log('array')
			const totalNumCollections = page === 0 ? await collections.countDocuments(query) : 0
			console.log('count')

			return { collections: results, totalNumCollections }
		} catch (e) {
			console.error(
				`Unable to convert cursor to array or problem counting documents, ${e}`,
			)
			return { collections: [], totalNumCollections: 0 }
		}
	}
}
