export const info = (...params) => {
  console.log(...params);
};

export const error = (...params) => {
  console.error(...params);
};

export default {
  info, error,
};
