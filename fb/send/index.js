const callSendAPI = require('./callSendAPI');

module.exports = function send(content) {
  return {
    to: (recipientId) => {
      let message = {
        recipient: {
          id: recipientId
        },
        message: {
          attachment: {
            type: "image",
            payload: {
              url: content
            }
          }
        }
      };
      callSendAPI(message);
    }
  }
}