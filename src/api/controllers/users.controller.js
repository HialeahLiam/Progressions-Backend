import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import UsersDAO from '../dao/usersDAO.js';
import CollectionsDAO from '../dao/collectionsDAO.js';
import { info } from '../../utils/logger.js';
import getTokenFrom from '../../utils/requests.js';
import {verifyToken} from '../../firebase.js';
import { json } from 'express';
import CollectionsController from './collections.controller.js';

export class User {
	constructor({
		id, username, email,
	} = {}) {
		this.id = id;
		this.username = username;
		this.email = email;
	}

	toJson() {
		return {
			id: this.id,
			username: this.username,
			email: this.email,
		};
	}

	async comparePassword(plainText) {
		return compare(plainText, this.password);
	}

	
}

export default class UsersController {
	static apiGetUsers = async (req, res, next) => {
		try {
			const users = await UsersDAO.getUsers();
			info(users);
		} catch (e) {
			next(e);
			res.status(500).send({ error: e.message });
		}
	};

	// TODO: implement fully
	static verifyRegistrationInput(username, email, password) {
		const errors = {};
		if (!email || !username || !password) {
			errors.missing_info = 'Required account information missing';
		} else if (password.length < 8) {
			errors.password = 'Your password must be at least 8 characters.';
		}

		return errors;
	}

	static register = async (req, res) => {
		try {
			console.log(req.body);

			const {username, email, id } = req.body;
			
			const errors = {};

			// const errors = this.verifyRegistrationInput(
			// 	username,
			// 	email,
			// 	password,
			// );

			// if (Object.keys(errors).length > 0) {
			// 	res.status(400).json({ errors });
			// 	return;
			// }

			/**
       * Read about salt rounds: https://github.com/kelektiv/node.bcrypt.js/#a-note-on-rounds
       */
			// const saltRounds = 10;
			// const passwordHash = await hash(password, saltRounds);

			const insertResult = await UsersDAO.addUser({
				username,
				email,
				id
			});

			if (!insertResult.success) {
				errors.email = insertResult.error;
			}

			const userFromDB = await UsersDAO.getUser(email);
			if (!userFromDB) {
				errors.general = 'Internal error, please try again later';
			}

			if (Object.keys(errors).length > 0) {
				res.status(400).json({ errors });
				return;
			}

			// const user = new User(userFromDB);

			res.status(201).json({ 
				messsage: 'user added to mongodb'
			});
		} catch (e) {
			res.status(500).json({ error: e });
		}
	};

	static login = async (req, res, next) => {
		try {
			const { email, password } = req.body;
			const userData = await UsersDAO.getUser(email);
			if (!userData) {
				res.status(400).json({ error: 'Account with that email not found.' });
				return;
			}

			const user = new User(userData);
			if (!(await user.comparePassword(password))) {
				res.status(400).json({ error: 'Incorrect password.' });
				return;
			}

			res.json({ auth_token: user.encoded(), info: user.toJson() });
		} catch (e) {
			next(e);
			// res.status(400).json({ error: e });
		}
	};

	static apiGetCollections = async (req, res, next) => {
		try {
			const { id } = req.params;
			const userJwt = getTokenFrom(req);
			// const user = await User.decoded(userJwt);
			const {uid} = await verifyToken(userJwt);
			const user = new User({id: uid});


			if (user.id !== id) {
				res.status(404).json({ error: 'You do not have access to these collections.' });
				return;
			}

			const collections = await CollectionsDAO.getUserCollections(id);

			res.json({ collections });
		} catch (e) {
			console.log((e));
			next(e);
		}
	};
	
	static apiCreateTopLevelCollection = async (req, res, next) => {
		try {

			const { body } = req
			console.log(body)
			const {user_id, email} = await verifyToken(getTokenFrom(req))
			const {collection, error} = await CollectionsDAO.postCollectionToUserLibrary(user_id, body )
			if (error) {
				res.json(error).status(400)
				return
			}
			res.json({
				message: `Collection was added to ${email}'s library.`,
				collection
			})
			
		} catch (error) {
			console.log(error) 
		}
	};

	static apiSearchUsersCollections = async (req, res, next) => {
		console.log('USER')
		try {
			const {id} = req.params
	
			const {user_id} = await verifyToken(getTokenFrom(req))
			console.log('id:', id)
			console.log('user_id:', user_id)

			if (user_id !== id) {
				res.status(401).json({ error: 'You do not have access to these collections.' });
				return;
			}
	
			console.log('user id:', id)
			req.query.ownerId = id;
			await CollectionsController.apiSearchCollections(req, res, next)

			
		} catch (error) {
			next(error)
		}
	}
}
