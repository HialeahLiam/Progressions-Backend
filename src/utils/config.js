const PORT = process.env.PORT || 3000;
const dbName = process.env.MONGODB_NS;
const { NODE_ENV, MONGODB_URI, SECRET_KEY } = process.env;

export {
  PORT, MONGODB_URI, dbName, NODE_ENV, SECRET_KEY,
};
