// Supports .GIF as well

module.exports = function image(url) {
  return {
    attachment: {
      type: "image",
      payload: {
        url: url
      }
    }
  }
}
