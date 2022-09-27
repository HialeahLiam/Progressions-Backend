import { verifyToken } from '../../firebase.js';
import getTokenFrom from '../../utils/requests.js';
import { checkProgressionValidity } from '../../utils/validators.js';
import CollectionsDAO from '../dao/collectionsDAO.js';
import ProgressionsDAO from '../dao/progressionsDAO.js';
import { User } from './users.controller.js';


export default class CollectionsController {

	static buildCollectionTrees = async (topCollections) => {
		console.log(topCollections)
		const collections = [...topCollections]
		const queue = [...collections];
		while (queue.length > 0) {
			const parent = queue.shift();

			// eslint-disable-next-line no-await-in-loop
			const children = await CollectionsDAO.getEntries(parent._id.toString());

			parent.entries = children;
			if (parent.entry_type === 'collection') {
				queue.push(...children);
			}
		}

		return collections
	}

	static apiDeleteCollection = async (req, res, next) => {
		try {
			const { id } = req.params;
			const {user_id} = await verifyToken(getTokenFrom(req))
			const owner_id = await CollectionsDAO.getOwnerId(id)
			// check that progression is not public
			if (!owner_id) {
				res.status(403).end()
				return
			}
			// check that progression belongs to user
			if(owner_id !== user_id) {
				res.status(401).end()
				return
			}

			await CollectionsDAO.deleteCollection(id);

			res.status(204).end()
		} catch (e) {
			next(e);
		}
	};

	static apiGetPublicCollections = async (req, res, next) => {
		let collections;
		try {
			collections = await CollectionsDAO.getTopLevelPublicCollections();
			collections = await this.buildCollectionTrees(collections)
			console.log(collections)
			res.json({ collections });
		} catch (e) {
			next(e);
		}
	};

	static apiPostCollectionEntry = async (req, res, next) => {
		try {
			const { entry, type } = req.body;
			const { id: parentId } = req.params;

			// const userToken = getTokenFrom(req);
			// const user = await User.decoded(userToken);
			const {user_id} = await verifyToken(getTokenFrom(req))

			if (!entry) {
				res.status(400).json({ error: 'Request must contain a "entry" key' });
				return;
			}

			if (type !== 'collection' && type !== 'progression') {
				res.status(400).json({
					error: `body must have "type" of either
          "collection" or "progression"`,
				});
				return;
			}

			const ownerId = await CollectionsDAO.getOwnerId(parentId);
			if (!ownerId) {
				res.status(404).json({ error: 'You cannot edit a public collection' });
				return;
			}
			if (ownerId !== user_id) {
				res.status(404).json({ error: 'You are trying to edit a collection that does not belong to you.' });
				return;
			}

			if (!entry.title) {
				res.status(400).json({ error: 'Your entry needs a title.' });
				return;
			}

			let collectionResponse;

			if (type === 'collection') {
				collectionResponse = await CollectionsDAO.addCollectionToCollection(parentId, entry);
			} else if (type === 'progression') {
				const {isValid, error} = checkProgressionValidity(entry)
				if (!isValid) {
					res.status(400).json({ error});
					return
				}
				collectionResponse = await CollectionsDAO.addProgressionToCollection(parentId, entry);
			}

			if (collectionResponse.error) {
				res.status(400).json({ error: collectionResponse.error });
				return;
			}

			// collectionResponse is the created collection/progression
			res.status(201).json({ entry: collectionResponse });
		} catch (e) {
			next(e);
		}
	};

	// Copies collection and its children and makes them all public
	static apiPublishCollection = async (req, res, next) => {

		try {
		
		const {id} = req.query;
		let q = [{id, newParent: null}]
		
		const {user_id} = await verifyToken(getTokenFrom(req))
		const ownerId = await CollectionsDAO.getOwnerId(id);

		if (!ownerId) {
			res.status(404).json({ error: 'You cannot publish an already public collection.' });
			return;
		}

		if (ownerId !== user_id) {
			res.status(404).json({ error: 'You are trying to publish a collection that does not belong to you.' });
			return;
		}

			while (q.length > 0) {
				console.log('WHILE')
				const {id: current, newParent} = q.pop()
				const publishedId = await CollectionsDAO.copyAndMakePublic(current, newParent)
				const entries = await CollectionsDAO.getEntries(current)
				if (entries.length > 0 && 'chords' in entries[0]) {
					// collection contains progressions
					for (const p of entries) {
						await ProgressionsDAO.copyAndMakePublic(p._id.toString(), publishedId)
					}
				} else {
					const qEntries = entries.map(c => (
						{
							id: c._id.toString(),
							newParent: publishedId
						}
						))
					q = [...qEntries, ... q]
				}
			}	

			res.status(201).end()
		} catch (error) {
			next(error)
		}
	}

	static apiSearchCollections = async (req, res, next) => {
		const COLLECTIONS_PER_PAGE = 20
		let page
		try {
			page = req.query.page ? parseInt(req.query.page, 10) : 0
		} catch (e) {
			console.error(`Got bad value for page:, ${e}`)
			page = 0
		}

		try {
			Object.keys(req.query)[0]
		} catch (e) {
			console.error(`No search keys specified: ${e}`)
		}

	
		let response = {}

		try {

			const filterText = req.query.text
			const ownerId = req.query.ownerId

			console.log('ownerId:' , ownerId)

			
			const { collections, totalNumCollections } = await CollectionsDAO.getCollections({
				filterText,
				ownerId,
				page,
				collectionsPerPage: COLLECTIONS_PER_PAGE,
			})

			const collectionTrees = await this.buildCollectionTrees(collections)
			
			response = {
				collections: collectionTrees,
				page: page,
				entries_per_page: COLLECTIONS_PER_PAGE,
				total_results: totalNumCollections,
			}
		

			res.json(response)
			
		} catch (error) {
			next(error)
		}

	}
}
