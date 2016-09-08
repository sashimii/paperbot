module.exports = function send(request, response) {
  const {sessionId, context, entities} = request;
  const {text, quickreplies} = response;
  return new Promise(function(resolve, reject) {
    console.log('sending...', JSON.stringify(response));
    return resolve();
  });
}
