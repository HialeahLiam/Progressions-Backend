const PORT = process.env.PORT || 3000;
const { MONGODB_URI } = process.env;
const dbName = process.env.MONGODB_NS;
const { NODE_ENV } = process.env;

export {
  PORT, MONGODB_URI, dbName, NODE_ENV,
};
