const handle = {
  accountLink: require('./accountLink'),
  delivery: require('./delivery'),
  message: require('./message'),
  messageRead: require('./messageRead'),
  optIn: require('./optIn'),
  postback: require('./postback')
}

module.exports = function received(dataFromUser) {


  let handledMessage;
  const _getDataTypeHandler = (dataToHandle) => {
    const data = dataToHandle;
    // Make sure this is a page subscription
    if (data.object == 'page') {
      // Iterate over each entry
      // There may be multiple if batched
      data.entry.forEach((pageEntry) => {
        const pageID = pageEntry.id;
        const timeOfEvent = pageEntry.time;

        // Iterate over each messaging event
        handledMessage = pageEntry.messaging.map((messagingEvent) => {
          if (messagingEvent.optin) {
            return handle.optIn(messagingEvent);
          } else if (messagingEvent.message) {
            return handle.message(messagingEvent);
          } else if (messagingEvent.delivery) {
            return handle.delivery(messagingEvent);
          } else if (messagingEvent.postback) {
            return handle.postback(messagingEvent);
          } else if (messagingEvent.read) {
            return handle.messageRead(messagingEvent);
          } else if (messagingEvent.account_linking) {
            return handle.accountLink(messagingEvent);
          } else {
            return new Promise((resolve, reject) => {
              return reject();
            })
          }
        });
      });

      // Assume all went well.
      //
      // You must send back a 200, within 20 seconds, to let us know you've
      // successfully received the callback. Otherwise, the request will time out.
      res.sendStatus(200);
    }
  };


  return Promise((resolve, reject) => {

    return resolve();

  });


}
