const axios = require('axios');

module.exports = function getNavigation() {
  return axios.get('https://www.thestar.com/api/navigation').then((response) => {
    let data = response.data;
    let navigation = data.navigation.map((section) => {
      let title = section.section;
      let payload = section.path;
      return {
        'type': 'postback',
        'title': title,
        'payload': payload
      }
    });
    return new Promise((resolve, reject) => {
      return resolve(navigation);
    });
  });
}
