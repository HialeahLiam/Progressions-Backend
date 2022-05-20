// eslint-disable-next-line max-classes-per-file
import { ObjectId } from 'mongodb';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import UsersDAO from '../dao/usersDAO.js';
import { error, info } from '../../utils/logger.js';
import { SECRET_KEY, dbName, MONGODB_URI } from '../../utils/config.js';

export class User {
  constructor({
    _id, username, email, password, preferences = {},
  } = {}) {
    this._id = _id.toString();
    this.username = username;
    this.email = email;
    this.password = password;
    this.preferences = preferences;
  }

  toJson() {
    return {
      _id: this._id,
      username: this.username,
      email: this.email,
      preferences: this.preferences,
    };
  }

  async comparePassword(plainText) {
    return compare(plainText, this.password);
  }

  encoded() {
    const token = jwt.sign(
      {
        // token expires in 4 hours
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
        ...this.toJson(),
      },
      process.env.SECRET_KEY,
    );
    return token;
  }

  static async decoded(userJwt) {
    return jwt.verify(userJwt, process.env.SECRET_KEY, (e, res) => {
      if (e) {
        return { e };
      }
      return new User(res);
    });
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
      const { username, email, password } = req.body;

      const errors = this.verifyRegistrationInput(
        username,
        email,
        password,
      );

      if (Object.keys(errors).length > 0) {
        res.status(400).json({ errors });
        return;
      }

      /**
     * Read about salt rounds: https://github.com/kelektiv/node.bcrypt.js/#a-note-on-rounds
     */
      const saltRounds = 10;
      const passwordHash = await hash(password, saltRounds);

      const insertResult = await UsersDAO.addUser({
        username,
        email,
        password: passwordHash,
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

      const user = new User(userFromDB);

      res.status(201).json({
        auth_token: user.encoded(),
        info: user.toJson(),
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

  static getCollections = async (req, res, next) => {
    try {
      const { id } = req.params;
      res.json({
        collections: [
          {
            title: 'The Strokes',
            entry_type: 'collection',
            entries: [
              {
                title: 'Trying Your Luck',
                entry_type: 'progression',
                entries: [
                  {
                    title: 'Trying Your Luck - Verse',
                    root: 9,
                    mode: 'major',
                  },
                ],
              },
              {
                title: 'Last Nite',
                entry_type: 'progression',
              },
            ],
          },
        ],
      });
    } catch (e) {
      next(e);
    }
  };
  //   try {
  //     const { id } = req.params;
  //     const query = { owner_id: ObjectId(id) };
  //     const result = await collections.find(query).toArray();
  //     console.log('Documents retrieved successfully:');
  //     console.log(result);
  //     res.json(result);
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  static createCollection = async (req, res, next) => {};
  //   try {
  //     const { id } = req.params;
  //     const { username, _id } = await users.findOne(ObjectId(id));
  //     const { title } = req.body;

  //     // check if collection belonging to user with same title already exists
  //     const userCollections = await collections.find({ owner_id: _id }).toArray();
  //     if (userCollections.find((e) => e.title === title)) {
  //       return res.json({ error: `${username} already has a collection titled ${title} in their library.` });
  //     }

  //     console.log(userCollections);

  //     // add collection to collections
  //     const result = await collections.insertOne({ title, owner_id: _id, author: username });
  //     console.log('collections document succesfully created:');
  //     console.log(result);
  //     res.json({ success: `${title} collection has been added to ${username}'s library.` });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}
