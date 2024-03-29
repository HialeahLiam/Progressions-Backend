import { error } from '../../utils/logger.js';
import { dbName } from '../../utils/config.js';

let progressions;
let collections;

export default class SearchDAO {
	static async injectDB(conn) {
		if (collections && progressions) {
			return;
		}
		try {
			collections = await conn.db(dbName).collection('collections');
			progressions = await conn.db(dbName).collection('progressions');
		} catch (e) {
			console.log('error');
			error(`Unable to establish collection handles in searchDAO: ${e}`);
		}
	}
}
