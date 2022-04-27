import { ObjectId } from 'mongodb';
import UsersDAO from '../dao/usersDAO.js';
import { error, info } from '../../utils/logger.js';

// export class User {
//     constructor({name, email})
// }

export default class UsersController {
  static apiGetUsers = async (req, res, next) => {
    try {
      const users = await UsersDAO.getUsers();
      info(users);
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  };

  static register = async (req, res) => {
    const { username, email } = req.body;
    if (!email || !username) {
      return res.status(200).json({ error: 'Required account information missing' });
    }
    const emailAlreadyExists = await users.findOne({ email });
    if (emailAlreadyExists) {
      return res.status(200).json({ error: 'Email already exists' });
    }
    const user = await users.insertOne({ username, email });
    console.log(`Document successfully created: ${user}`);
    return res.json(req.body);
  };

  static getCollections = async (req, res, next) => {
    try {
      const { id } = req.params;
      const query = { owner_id: ObjectId(id) };
      const result = await collections.find(query).toArray();
      console.log('Documents retrieved successfully:');
      console.log(result);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  static createCollection = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { username, _id } = await users.findOne(ObjectId(id));
      const { title } = req.body;

      // check if collection belonging to user with same title already exists
      const userCollections = await collections.find({ owner_id: _id }).toArray();
      if (userCollections.find((e) => e.title === title)) {
        return res.json({ error: `${username} already has a collection titled ${title} in their library.` });
      }

      console.log(userCollections);

      // add collection to collections
      const result = await collections.insertOne({ title, owner_id: _id, author: username });
      console.log('collections document succesfully created:');
      console.log(result);
      res.json({ success: `${title} collection has been added to ${username}'s library.` });
    } catch (error) {
      next(error);
    }
  };
}
