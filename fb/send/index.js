const callSendAPI = require('./callSendAPI');

module.exports = function send(content) {
  return {
    to: (recipientId) => {
      let message = {
        recipient: {
          id: recipientId
        },
        message: content
      };
      callSendAPI(message);
    }
  }
}
