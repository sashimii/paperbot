//

'use strict';

const Wit = require('node-wit').Wit;
const axios = require('axios');
// let client = new Wit({accessToken, actions});
//
// client.runActions('random-user-1', 'what are the top stories today', {})
//   .then((data) => {
//     console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
//   })
//   .then((data1) => {
//     console.log('More data!', data1);
//   })

function robotFactory(accessToken, sendFunction, actionsObject) {
  let actions = actionsObject;
  actions.send = sendFunction;
  return new Wit({accessToken, actions});
}

module.exports = robotFactory;
