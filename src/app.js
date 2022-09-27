import express from 'express';
import cors from 'cors';
import collections from './api/routes/collections.route.js';
import users from './api/routes/users.route.js';
import progressions from './api/routes/progressions.route.js';
import search from './api/routes/search.route.js';
import middleware from './utils/middleware.js';
import dev from './api/routes/dev.route.js'

const app = express();

app.use(cors());
app.use(express.static('build'));
app.use(express.json());
app.use(middleware.requestLogger);

// Register API routes
app.use('/api/v1/collections', collections);
app.use('/api/v1/users', users);
app.use('/api/v1/progressions', progressions);
app.use('/api/v1/search', search);

if (process.env.NODE_ENV === "development") {
    app.use('/dev', dev)
}

// Middleware used after path implementations. Called only if request matches no endpoints.
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
