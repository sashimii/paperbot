const callSendAPI = require('./callSendAPI');

module.exports = function send(content) {

  return {
    to: (recipientId) => {
      const typing = (onOrOff) => {
        let action = {
          recipient:{
            id: recipientId
          },
          sender_action: 'typing_' + onOrOff
        }
        callSendAPI(action);
      }
      typing('on');
      let message = {
        recipient: {
          id: recipientId
        },
        message: content
      };

      callSendAPI(message);
      typing('off');
      // return new Promise((resolve, reject) => {
      //   return resolve('sent');
      // })
    }
  }
}
