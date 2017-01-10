let self;

const axios = require('axios');
const config = require('config');


module.exports = class ThreadSettings {
  constructor() {
    if (!self) {
      self = this;
      this._isInformed = {
        sonia: false,
      }
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
    axios.post(this._getThreadSettingsUrl(), {
      'setting_type': 'greeting',
      'greeting': {
        'text': greeting
      }
    })
    .then(
      (response) => {
        this.greetingExists = true;
        this._handleCallback(response, callback);
      }
    );
  }

  setGetStartedButton(menuItemsArray, callback) {
    axios.post(this._getThreadSettingsUrl(), {
      'setting_type': 'call_to_actions',
      'thread_state': 'new_thread',
      'call_to_actions': menuItemsArray
    })
    .then(
      (response) => {
        console.log('Does Start Button Exist?', response.data);
        // if(response.result == "Successfully added new_thread's CTAs") {
        //   this.startButtonExists = true;
        //   this._handleCallback(response, callback);
        // }

      }
    );
  }

  getInformedState(user) {
    return this._isInformed[user];
  }

  setInformedState(user, boolState) {
    this._isInformed[user] = boolState;
  }

  setPersistentMenu(menuItemsArray, callback) {
    console.log('setPersistentMenu has been called');
    console.log('persistent menu is not set');
    axios.post(this._getThreadSettingsUrl(), {
      'setting_type': 'call_to_actions',
      'thread_state': 'existing_thread',
      'call_to_actions': menuItemsArray
    })
    .then(
      (response) => {
        console.log('Does persistent menu exist?', response.data);
        // if(response.result == "Successfully added new_thread's CTAs") {
        //   this.persistentMenuIsSet = true;
        //   this._handleCallback(response, callback);
        // }
      }
    )
    .catch((error) => {
      console.log(error);
    });
  }
}
