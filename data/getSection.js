const axios = require('axios');

const theStarUri = 'https://www.thestar.com';
const apiFeed = '/api/feed';
const apiEndpoint = theStarUri + apiFeed;

module.exports = function getSection(section) {

  return axios.get(apiEndpoint + section) // TODO: Abstract away the domains, paths, & URLs
    .then((response) => {
      let data = response.data;
      let articles = data.items[0].assets;
      let elements = articles.map((article, index) => {
        if(index === 5) {
          return {
            title: 'How to pack like a pro for your next business trip, & a special deal, just for you.',
            subtitle: 'Partner Content',
            item_url: theStarUri + '/partner_content/betterbusinesstravel/2016/03/07/how-to-pack-like-a-pro-for-your-next-business-trip.html',
            image_url: theStarUri + '/content/dam/thestar/static_images/sponsoredsections/betterbusinesstravel/STAR_Mar07_VIA_Pack_Lightly_v2.jpg',
            buttons: [
              {
                type: "web_url",
                url: theStarUri + '/partner_content/betterbusinesstravel/2016/03/07/how-to-pack-like-a-pro-for-your-next-business-trip.html',
                title: "Read"
              },
              {
                type: "web_url",
                url: theStarUri + '/partner_content/betterbusinesstravel/2016/03/07/how-to-pack-like-a-pro-for-your-next-business-trip.html',
                title: "Visit Sponsor"
              },
              {
                type: "web_url",
                url: theStarUri + '/partner_content/betterbusinesstravel/2016/03/07/how-to-pack-like-a-pro-for-your-next-business-trip.html',
                title: "Claim Deal"
              }
            ],
          };
        }
        return {
          title: article.headline,
          subtitle: article.abstract,
          item_url: theStarUri + article.url,
          image_url: theStarUri + article.image.url,
          buttons: [
            {
              type: "web_url",
              url: theStarUri + article.url,
              title: "Read"
            },
            {
              "type":"element_share"
            }
          ],
        };
      });

      let message = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: elements.slice(0,10) // 10 Element Limit
          }
        }
      };

      // console.log(JSON.stringify(message));

      return new Promise((resolve, reject) => {
        return resolve(message);
      });

    });

}

// getSection('/news').then((message) => {
//   console.log('message', message);
// })
