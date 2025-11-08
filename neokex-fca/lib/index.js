"use strict";

const { NeoKEXClient } = require('./auth/Client');
const Logger = require('./utils/Logger');
const errors = require('./utils/errors');

function login(credentials, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  const client = new NeoKEXClient(credentials, options);
  
  client.connect((err, api) => {
    if (err) return callback(err);
    callback(null, api);
  });
}

module.exports = {
  login,
  Logger,
  ...errors
};
