const PORT = process.env.PORT || 3000;
const dbName = process.env.MONGODB_NS;
const {
	NODE_ENV, MONGODB_URI, MONGODB_URI_DEV, SECRET_KEY,
} = process.env;

export {
	PORT, MONGODB_URI, MONGODB_URI_DEV, dbName, NODE_ENV, SECRET_KEY,
};
