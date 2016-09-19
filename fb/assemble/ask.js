module.exports = function ask(question, metadata, ...options) {
  return {
    text: question,
    metadata: metadata,
    quick_replies: options.map((option) => {
      return {
        content_type: 'text',
        title: option,
        payload: 'ASK_' + metadata.toUpperCase() + '_' + option.replace(' ', '_').toUpperCase()
      }
    })
  };
}
