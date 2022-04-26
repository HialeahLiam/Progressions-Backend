import { info, error } from '../../utils/logger.js';
import { dbName } from '../../utils/config.js';

let collections;

export default class CollectionsDAO {
  static async injectDB(conn) {
    if (collections) {
      return;
    }
    try {
      collections = await conn.db(dbName).collection('collections');
    } catch (e) {
      console.log('error');
      error(`Unable to establish collection handles in collectionsDAO: ${e}`);
    }
  }
}
