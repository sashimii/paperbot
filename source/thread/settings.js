let self;

const axios = require('axios');


export default class ThreadSettings {
  constructor() {
    if (!self) {
      self = this;
    }
    return self;
  }

  _getPageAccessToken() {
    return (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
      (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
      config.get('pageAccessToken');
  }

  _getThreadSettingsUrl() {
    return 'https://graph.facebook.com/v2.6/me/thread_settings?access_token=' + this._getPageAccessToken();
  }

  _handleCallback(response, callback) {
    if(typeof callback === 'function') {
      callback(response);
    }
  }

  setGreeting(greeting, callback) {
    if(!this.greetingExists) {
      axios.post(_getThreadSettingsUrl(), {
        'setting_type': 'greeting',
        'greeting': {
          'text': greeting
        }
      })
      .then(
        (response) => {
          console.log(response);
          this.greetingExists = true;
          this._handleCallback(response, callback);
        }
      );
    }
  }

  setGetStartedButton(menuItemsArray, callback) {
    if(!this.startButtonExists) {
      axios.post(_getThreadSettingsUrl(), {
        'setting_type': 'call_to_actions',
        'thread_state': 'new_thread',
        'call_to_actions': menuItemsArray
      })
      .then(
        (response) => {
          console.log(response);
          if(response.result == "Successfully added new_thread's CTAs")
          this.startButtonExists = true;
          this._handleCallback(response, callback);
        }
      );
    }
  }

  setPersistentMenu(menuItemsArray, callback) {
    if(!this.persistentMenuIsSet) {
      axios.post(_getThreadSettingsUrl(), {
        'setting_type': 'call_to_actions',
        'thread_state': 'existing_thread',
        'call_to_actions': menuItemsArray
      })
      .then(
        (response) => {
          console.log(response);
          if(response.result == "Successfully added new_thread's CTAs")
          this.persistentMenuIsSet = true;
          this._handleCallback(response, callback);
        }
      );
    }
  }


}
