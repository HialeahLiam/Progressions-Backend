import { dbName } from '../../utils/config.js'
import { info, error } from '../../utils/logger.js'
import CollectionsDAO from './collectionsDAO.js'

let users

export default class UsersDAO {
    static async injectDB(conn) {
        if (users) {
            return
        }
        try {
            users = await conn.db(dbName).collection('users')            
        } catch (e) {
            console.log('error')
            error(`Unable to establish collection handles in usersDAO: ${e}`)
        }
    }

    static async getUsers() {
        let cursor;
        try {
            cursor = await users.find()
        } catch (e) {
            error(e)
            return []
        }

        return cursor.toArray()
    }

    static async getUserCollections(userId) {
        const query = { owner_id: ObjectId(id) };
        try {
            const collections = await CollectionsDAO.getUserCollections(userId)
        } catch (e) {
            
        }
    }
}