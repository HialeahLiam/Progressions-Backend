import { ObjectId } from 'mongodb';
import { dbName, NODE_ENV } from '../../utils/config';
import { info, error } from '../../utils/logger';
import CollectionsDAO from './collectionsDAO';

let users;

export default class UsersDAO {
  static async injectDB(conn) {
    if (users) {
      return;
    }
    try {
      const name = NODE_ENV === 'test' ? globalThis.__MONGO_DB_NAME__ : dbName;
      users = await conn.db(name).collection('users');
    } catch (e) {
      console.log('error');
      error(`Unable to establish collection handles in usersDAO: ${e}`);
    }
  }

  static async getUsers() {
    let cursor;
    try {
      cursor = await users.find();
    } catch (e) {
      error(e);
      return [];
    }

    return cursor.toArray();
  }

  static async getUser(email) {
    // TODO Ticket: User Management
    // Retrieve the user document corresponding with the user's email.
    return users.findOne({ email });
  }

  static async addUser(user) {
    try {
      await users.insertOne(user);
      return { success: true };
    } catch (e) {
      if (String(e).startsWith('MongoError: E11000 duplicate key error')) {
        return { error: 'A user with the given email already exists.' };
      }
      console.error(`Error occurred while adding new user, ${e}.`);
      return { error: e };
    }
  }
}
