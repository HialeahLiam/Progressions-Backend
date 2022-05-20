const getTokenFrom = (request) => {
  const authorization = request.get('Authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('bearer '.length);
  }
  return null;
};

export default getTokenFrom;
