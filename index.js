require('@babel/register');
require('dotenv').config();
require('babel-polyfill');

module.exports = require('./src');
exports = require('./src');
