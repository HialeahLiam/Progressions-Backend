import logger from './logger.js';

const requestLogger = (req, res, next) => {
  logger.info('Method', req.method);
  logger.info('Path', req.path);
  logger.info('Body', req.body);
  logger.info('----------------------------------------------------');
  next();
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'Unknown endpoint' });
};

const errorHandler = (err, req, res, next) => {
  logger.error('my message:', err.message);

  if (err.name === 'BSONTypeError') {
    res.status(400).send({ error: 'Malformatted ID' });
  }

  // TODO prints an object when error is UserException
  next(err);
};

export default {
  requestLogger,
  unknownEndpoint,
  errorHandler,
};