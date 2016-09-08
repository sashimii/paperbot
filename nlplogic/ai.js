'use strict';

let Wit = require('node-wit').Wit;
let interactive = require('node-wit').interactive;

let axios = require('axios');

const accessToken = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node examples/quickstart.js <wit-access-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

// Quickstart example
// See https://wit.ai/ar7hur/quickstart

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    return new Promise(function(resolve, reject) {
      console.log('sending...', JSON.stringify(response));
      return resolve();
    });
  },
  getNewsStories({context, entities}) {
    // let topStory = axios.get('https://www.thestar.com/api/feed')
    //   .then((feed) => {
    //     console.log(feed.items.assets[0]);
    //     return feed.items.assets[0].headline;
    //   });
    return axios.get('https://www.thestar.com/api/feed')
      .then((feed) => {
        //console.log(feed.items[0].assets[0].headline);
        context.topStories = feed.data.items[0].assets[0].headline;
        return new Promise(function(resolve, reject) {
          return resolve(context);
        });
      });

  },
};

const client = new Wit({accessToken, actions});
interactive(client);
