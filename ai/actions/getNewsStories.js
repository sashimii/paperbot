const axios = require('axios');
module.exports = function getNewsStories({context, entities}) {
  return axios.get('https://www.thestar.com/api/feed')
    .then((feed) => {
      //console.log(feed.items[0].assets[0].headline);
      context.topStories = feed.data.items[0].assets[0].headline;
      return new Promise(function(resolve, reject) {
        return resolve(context);
      });
    });

}
