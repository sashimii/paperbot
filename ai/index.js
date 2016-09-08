//

'use strict';

const Wit = require('node-wit').Wit;
const axios = require('axios');
const actions = require('./actions');

if(!process.env.WIT_CLIENT_TOKEN) {
  require('dotenv').config();
}

const accessToken = process.env.WIT_CLIENT_TOKEN || '';

let client = new Wit({accessToken, actions});

module.exports = client;
