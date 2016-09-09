const axios = require('axios');

const theStarUri = 'https://www.thestar.com';
const apiFeed = '/api/feed';
const apiEndpoint = theStarUri + apiFeed;

module.exports = function getSection(section) {

  return axios.get(apiEndpoint + section) // TODO: Abstract away the domains, paths, & URLs
    .then((response) => {
      let data = response.data;
      let articles = data.items[0].assets;
      let elements = articles.map((article) => {
        return {
          title: article.headline,
          subtitle: article.abstract,
          item_url: theStarUri + article.url,
          image_url: theStarUri + article.image.url,
          buttons: [{
            type: "web_url",
            url: theStarUri + article.url,
            title: "Read"
          }],
        };
      });

      let message = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: elements
          }
        }
      };

      return new Promise((resolve, reject) => {
        return resolve(message);
      });

    });

}
