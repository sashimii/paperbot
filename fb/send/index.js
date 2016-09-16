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

      return {
        then: {
          send: (moreContent) => {
            let to = send(moreContent);
            return to;
          }
        }
      }
      // return new Promise((resolve, reject) => {
      //   return resolve('sent');
      // })
    }
  }
}
