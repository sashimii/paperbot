module.exports = function poll(question, metadata, ...options) {
  return {
    text: question,
    metadata: metadata,
    quick_replies: options.map((option) => {
      return {
        content_type: 'text',
        title: option,
        payload: 'POLL_' + option.toUpperCase()
      }
    })
  };
}
