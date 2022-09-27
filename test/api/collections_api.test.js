import supertest from 'supertest';
import app from '../../src/app';
import {
	setupDB,
	populateCollections,
	clearCollections,
	closeDB,
} from '../utils/testing';

const api = supertest(app);

let db;
let loggedInUserToken;
let loggedInUserId;

// let otherUserId;

beforeAll(async () => {
	db = await setupDB();
});

beforeEach(async () => {
	await clearCollections();
	await populateCollections();

	const response = await api
		.post('/api/v1/users/login')
		.send({ email: 'liamidrovo@gmail.com', password: 'password' })
		.expect(200);
	loggedInUserToken = response.body.auth_token;
	loggedInUserId = response.body.info._id;

	// const result = await db.collection('users').findOne({ username: 'Eryck Mercado' });
	// otherUserId = result._id.toString();
});

afterAll(async () => {
	await closeDB();
});

describe.only('getting public collections', () => {
	test('public collections are returned as json', async () => {
		await api
			.get('/api/v1/collections')
			.expect(200)
			.expect('Content-Type', /application\/json/);
	});

	test('collections shouldn\'t belong to any user', async () => {
		const response = await api.get('/api/v1/collections');
		const { collections } = response.body;
		const privateCollections = collections.filter((c) => c.owner_id);
		expect(privateCollections).toHaveLength(0);
	});

	test('collections should contain all descendent collections and progressions', async () => {
		const response = await api.get('/api/v1/collections');
		const { collections } = response.body;

		const macDemarco = collections.map(({ title, entries }) => ({ title, entries })).find((c) => c.title === 'Mac Demarco');
		macDemarco.entries = macDemarco.entries.map(({ title, entries }) => ({ title, entries }));
		macDemarco.entries = macDemarco.entries.map((e) => {
			e.entries = e.entries.map(({ title }) => ({ title }));
			const { title, entries } = e;
			return { title, entries };
		});
		// const myKindOfWoman = macDemarco.entries.find((entry) => entry.title === 'My Kind of Woman');
		// myKindOfWoman.entries = myKindOfWoman.entries.map(({ title }) => ({ title }));
		const expected = {
			title: 'Mac Demarco',
			entries: [
				{
					title: 'My Kind of Woman',
					entries: [
						{
							title: 'My Kind of Woman - Verse',
						},
						{
							title: 'My Kind of Woman - Chorus',
						},
					],
				},
				{
					title: 'Freaking Out The Neighborhood',
					entries: [
						{
							title: 'Freaking Out The Neighborhood - Intro',
						},
					],
				},
			],
		};

		expect(macDemarco).toEqual(expected);
	});
});

describe('deleting collection', () => {
	let parentCollectionId;
	beforeEach(async () => {
		const result = await db.collection('collections').findOne({ title: 'The Strokes' });
		parentCollectionId = result._id.toString();
	});

	test('cannot delete collection in any library if user not logged in', async () => {
		const res = await api
			.delete(`/api/v1/collections/${parentCollectionId}`)
			.expect(401);

		// const { error } = res.body;
		// expect(error).toBe('jwt must be provided');
	});

	test('user deletes only collection in their library', async () => {
		const res = await api
			.delete(`/api/v1/collections/${parentCollectionId}`)
			.auth(loggedInUserToken, { type: 'bearer' })
			.expect(200);

		const { collections } = res.body;
		expect(collections).toHaveLength(0);

		const deletions = [];
		deletions.push(await db.collection('collections').findOne({ title: 'The Strokes' }));
		deletions.push(await db.collection('collections').findOne({ title: 'Trying Your Luck' }));
		deletions.push(await db.collection('collections').findOne({ title: 'Last Nite' }));
		deletions.push(await db.collection('progressions').findOne({ title: 'Trying Your Luck - Verse' }));

		expect(deletions.filter((e) => e)).toHaveLength(0);
	});
});

describe('creating collection entry', () => {
	let entryParent;
	let collectionOfProgressions;
	let collectionOfCollections;

	beforeEach(async () => {
		let result = await db.collection('collections').findOne({ title: 'The Strokes' });
		entryParent = result._id.toString();

		result = await db.collection('collections').findOne({ title: 'Trying Your Luck' });
		collectionOfProgressions = result._id.toString();

		result = await db.collection('collections').findOne({ title: 'The Strokes' });
		collectionOfCollections = result._id.toString();
	});

	test('request body contains "entry" key containing object', async () => {
		const res = await api
			.post(`/api/v1/collections/${entryParent}`)
			.send({})
			.auth(loggedInUserToken, { type: 'bearer' })
			.expect(400);

		const { error } = res.body;
		expect(error).toBe('Request must contain a "entry" key');
	});

	test('user must be logged in', async () => {
		const res = await api
			.post(`/api/v1/collections/${entryParent}`)
			.send({ entry: {}, type: 'collection' })
			.expect(401);

		// const { error } = res.body;
		// expect(error).toBe('jwt must be provided'); 
	});

	test('first progression added to collection', async () => {
		let parentCollection = await db.collection('collections').findOne({title: 'The Marias'});
		await api
			.post(`/api/v1/collections/${parentCollection._id.toString()}`)
			.auth(loggedInUserToken, { type: 'bearer' })
			.send({ entry: { title: 'Maria Prog', root: 0, chords: [[1,2,3],[2,3,4]]}, type: 'progression'})
			.expect(201);

		parentCollection = await db.collection('collections').findOne({title: 'The Marias'});
		expect(parentCollection.entry_type).toBeTruthy();
		expect(parentCollection.entry_type).toBe('progression');
	});
    
	//TODO
	test('first collection added to collection', async () => {
		const {_id: id} = await db.collection('collections').findOne({title: 'The Marias'});
		await api
			.post(`/api/v1/collections/${id.toString()}`)
			.auth(loggedInUserToken, { type: 'bearer' })
			.send({ entry: {title: 'Carino'}, type: 'collection' })
			.expect(201);

		const parentCollection = await db.collection('collections').findOne({title: 'The Marias'});
		expect(parentCollection.entry_type).toBeTruthy();
		expect(parentCollection.entry_type).toBe('collection');
	});

	describe('entry\'s parent should be existing collection in user\'s library', () => {
		test('parent collection cannot be in other users\'s library', async () => {
			const unauthorizedCollection = await db.collection('collections').findOne({ title: 'Radiohead' });
			const id = unauthorizedCollection._id.toString();
			const res = await api
				.post(`/api/v1/collections/${id}`)
				.send({ entry: {}, type: 'collection' })
				.auth(loggedInUserToken, { type: 'bearer' })
				.expect(404);

			const { error } = res.body;
			expect(error).toBe('You are trying to edit a collection that does not belong to you.');
		});

		test('parent collection cannot be a public collection', async () => {
			const publicCollection = await db.collection('collections').findOne({ title: 'Mac Demarco' });
			const id = publicCollection._id.toString();

			const res = await api
				.post(`/api/v1/collections/${id}`)
				.send({ entry: {}, type: 'collection' })
				.auth(loggedInUserToken, { type: 'bearer' })
				.expect(404);

			const { error } = res.body;
			expect(error).toBe('You cannot edit a public collection');
		});
	});

	describe('creating child collection', () => {
		const newCollection = { title: 'Is This It' };

		test('valid child collection added to collection', async () => {
			const res = await api
				.post(`/api/v1/collections/${collectionOfCollections}`)
				.send({ entry: newCollection, type: 'collection' })
				.auth(loggedInUserToken, { type: 'bearer' })
				.expect(201);

			let collection = await db.collection('collections').findOne({title: 'Is This It'});
			expect(collection).toBeTruthy();
			expect(collection.parent_collection_id.toString()).toBe(collectionOfCollections); 
		});

		test('parent collection should not contain progressions', async () => {
			const res = await api
				.post(`/api/v1/collections/${collectionOfProgressions}`)
				.send({ entry: newCollection, type: 'collection' })
				.auth(loggedInUserToken, { type: 'bearer' })
				.expect(400);

			const { error } = res.body;
			expect(error).toBe('You cannot add a collection to a collection already containing progressions.');
		});

		test('collection should have title', async () => {
			const res = await api
				.post(`/api/v1/collections/${collectionOfCollections}`)
				.send({ entry: { song: 'Is This It' }, type: 'collection' })
				.auth(loggedInUserToken, { type: 'bearer' })
				.expect(400);

			const { error } = res.body;
			expect(error).toBe('Your entry needs a title.');
		});
	});

	describe('creating child progression', () => {
		const validProgression = {
			title: 'Last Nite - Chorus',
			root: 9,
			chords: [[0, 3, 5], [1, 5, 9]],
			mode: 0,
		};

		test('valid progression added to user\'s collection', async () => {
			const res = await api
				.post(`/api/v1/collections/${collectionOfProgressions}`)
				.send({ entry: validProgression, type: 'progression' })
				.auth(loggedInUserToken, { type: 'bearer' })
				.expect(201);

			let progression = await db.collection('progressions').findOne({title: 'Last Nite - Chorus'});
			expect(progression).toBeTruthy();
			expect(progression.parent_collection_id.toString()).toBe(collectionOfProgressions); 
		});

		test('parent collection should not contain collections', async () => {
			const res = await api
				.post(`/api/v1/collections/${collectionOfCollections}`)
				.send({ entry: validProgression, type: 'progression' })
				.auth(loggedInUserToken, { type: 'bearer' })
				.expect(400);

			const { error } = res.body;
			expect(error).toBe('You cannot add a progression to a collection already containing collections.');
		});

		test('progression should have title', async () => {
			const wrongProgression = {
				root: 9,
				chords: [[0, 3, 5], [1, 5, 9]],
			};

			const res = await api
				.post(`/api/v1/collections/${collectionOfProgressions}`)
				.send({ entry: wrongProgression, type: 'progression' })
				.auth(loggedInUserToken, { type: 'bearer' })
				.expect(400);

			const { error } = res.body;
			expect(error).toBe('Your entry needs a title.');
		});

		// TODO
		test('progression should have valid chords', async () => {
			expect(1).toBe(2);
		});

		// TODO
		test('progression should have valid root', async () => {
			expect(1).toBe(2);
		});
	});
});

// TODO
describe('publishing collection to public library', () => {});
