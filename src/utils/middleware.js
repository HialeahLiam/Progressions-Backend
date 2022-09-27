import { info, error } from './logger.js';

const requestLogger = (req, res, next) => {
	info('Method', req.method);
	info('Path', req.path);
	info('Body', req.body);
	info('----------------------------------------------------');
	next();
};

const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: 'Unknown endpoint' });
};

const errorHandler = (err, req, res, next) => {
	error('my message:', err.message);

	if (err.name === 'BSONTypeError') {
		res.status(400).send({ error: 'Malformatted ID' });
		return;
	}

	next(err);
};

export default {
	requestLogger,
	unknownEndpoint,
	errorHandler,
};
