var axios = require('axios');

module.exports = function getPuppers() {

  const getPuppersKeyword = () => {
    const keywords = [
      'pupper', 'puppers', 'puppies', 'puppy'
    ];
    const totalKeywords = keywords.length;
    return keywords[parseInt(Math.random()*totalKeywords)];
  }

  return axios.get(`http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${getPuppersKeyword()}`);

}
