'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var self = void 0;

var axios = require('axios');

var ThreadSettings = function () {
  function ThreadSettings() {
    _classCallCheck(this, ThreadSettings);

    if (!self) {
      self = this;
    }
    return self;
  }

  _createClass(ThreadSettings, [{
    key: '_getPageAccessToken',
    value: function _getPageAccessToken() {
      return process.env.MESSENGER_PAGE_ACCESS_TOKEN ? process.env.MESSENGER_PAGE_ACCESS_TOKEN : config.get('pageAccessToken');
    }
  }, {
    key: '_getThreadSettingsUrl',
    value: function _getThreadSettingsUrl() {
      return 'https://graph.facebook.com/v2.6/me/thread_settings?access_token=' + this._getPageAccessToken();
    }
  }, {
    key: '_handleCallback',
    value: function _handleCallback(response, callback) {
      if (typeof callback === 'function') {
        callback(response);
      }
    }
  }, {
    key: 'setGreeting',
    value: function setGreeting(greeting, callback) {
      var _this = this;

      if (!this.greetingExists) {
        axios.post(_getThreadSettingsUrl(), {
          'setting_type': 'greeting',
          'greeting': {
            'text': greeting
          }
        }).then(function (response) {
          console.log(response);
          _this.greetingExists = true;
          _this._handleCallback(response, callback);
        });
      }
    }
  }, {
    key: 'setGetStartedButton',
    value: function setGetStartedButton(menuItemsArray, callback) {
      var _this2 = this;

      if (!this.startButtonExists) {
        axios.post(_getThreadSettingsUrl(), {
          'setting_type': 'call_to_actions',
          'thread_state': 'new_thread',
          'call_to_actions': menuItemsArray
        }).then(function (response) {
          console.log(response);
          if (response.result == "Successfully added new_thread's CTAs") _this2.startButtonExists = true;
          _this2._handleCallback(response, callback);
        });
      }
    }
  }, {
    key: 'setPersistentMenu',
    value: function setPersistentMenu(menuItemsArray, callback) {
      var _this3 = this;

      if (!this.persistentMenuIsSet) {
        axios.post(_getThreadSettingsUrl(), {
          'setting_type': 'call_to_actions',
          'thread_state': 'existing_thread',
          'call_to_actions': menuItemsArray
        }).then(function (response) {
          console.log(response);
          if (response.result == "Successfully added new_thread's CTAs") _this3.persistentMenuIsSet = true;
          _this3._handleCallback(response, callback);
        });
      }
    }
  }]);

  return ThreadSettings;
}();

exports.default = ThreadSettings;