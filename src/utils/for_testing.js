const reverse = (string) => string
  .split('')
  .reverse()
  .join('');

// average of array elements
const average = (array) => {
  const reducer = (sum, item) => sum + item;
  return array.reduce(reducer) / array.length;
};

module.exports = {
  reverse,
  average,
};
