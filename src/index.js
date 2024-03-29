import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { PORT, MONGODB_URI, MONGODB_URI_DEV } from './utils/config.js';
import { info, error } from './utils/logger.js';
import app from './app.js';
import UsersDAO from './api/dao/usersDAO.js';
import CollectionsDAO from './api/dao/collectionsDAO.js';
import ProgressionsDAO from './api/dao/progressionsDAO.js';
import SearchDAO from './api/dao/searchDAO.js';


const uri = process.env.NODE_ENV === 'production' ? MONGODB_URI : MONGODB_URI_DEV;

info('connecting to', uri);

const client = new MongoClient(uri);

const start = async () => {
	try {
		await client.connect();
		info('Connected to MongoDB');
		await CollectionsDAO.injectDB(client);
		await UsersDAO.injectDB(client);
		await ProgressionsDAO.injectDB(client);
		await SearchDAO.injectDB(client);
	} catch (e) {
		error(`Error connecting to MongoDB: ${e}`);
	}
};
app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});

start();
