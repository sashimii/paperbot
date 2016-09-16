let self;

// CASE: INTRODUCTION
// Bot Introduces Itself
// PAYLOAD: NEXT

// CASE: PERSISTENT_MENU
// Explaining Persistent Menu
  // Perhaps the big topic of the now is an election. The Persistent Menu can be set to reflect that.
    // ACTION: Set Persistent Menu to show how it works and how it can be changed
    // Ask User to Press 'Continue' in Persistent Menu to Get to Next State
// PAYLOAD: NEXT


// CASE: CONTENT_TYPES
// Explaining Content Types
  // Next Button
  // CASE: STATIC_IMAGES
  // Static Images
    // Next Button
  // CASE: PNG_FILES
  // Generated PNG Files
    // Next Button
  // CASE: ANIMATED_GIF
  // GIFs
    // Next Button
  // CASE: AUDIO
  // Audio
    // Next Button
  // CASE: VIDEO
  // Video
    // Next Button
  // CASE: MISC_FILES
  // Files, like .txt files
    // Next Button

// CASE: STRUCTURED_MESSAGES
// Showcasing Structured Messages
  // CASE: BASIC_TEMPLATE
  // Showcase Basic Template
    // Next Button
  // CASE: ARTICLE_LINK
  // Show Article Link
    // Next Button
  // CASE: WEBVIEW
  // Show article rendering in Webview
    // Explain how we can avoid Mobile Ad Blockers this way
    // Next Button
  // CASE: INSTANT_ARTICLES
  // Show native support for Instant Articles
    // Next Button
  // CASE: ARTICLE_LISTS
  // How it works in an article list layout
    // Next Button
  // CASE: PARTNER_CONTENT
  // Showcase Partnered Content in list of 5 Articles
    // Show how Partnered Content can Differ from Regular Articles (ie, Direct Linking)
    // Explain Monetization
    // Next Button

// QUICK_REPLIES
// Showcase Quick Replies
  // CASE: BREAKING_NEWS
  // Let user know about a happening. Ask if they want rolling updates on that issue. (ie, Paris Attacks, Earthquakes, etc)
    // Next Button
  // CASE: PROFILE_BUILDING
  // Ask User a question that builds there interest profile
    // NEXT
  // CASE: OPINION_POLLING
  // Give the user an Poll
    // Possibility: After answer, return a basic chart
  // CASE: SUBSCRIPTIONS
  // Ask user if they want to Subscribe to: Daily News, Sports, etc
    // NEXT

// Updates Subscriptions:
  // Breaking News
  // Weather Alerts
  // Traffic & Transit Updates
  // Orange Alerts


// Monetization: Partner Content
  //

/*
 Tutorial:
  1. INTRODUCTION
  2.
*/
const tutorial = require('./scripts/tutorial');

module.exports = class GuidedMode {

  constructor() {
    if (!self) {
      self = this;
      this.users = {};
      this.modes = {
        tutorial: {
          run: tutorial,
          states: () => {
            let tutorialStates = tutorial.timeline.map((state) => {
              return Object.getOwnPropertyNames(state)[0];
            });
            return tutorialStates;
          },
        }
      }
    }
    return self;
  }

  setMode(userId, modeSetting) {
    if(typeof this.users[userId] === 'undefined') {
      this.users[userId] = {};
    }
    this.users[userId].mode = modeSetting;
    console.log('Set User Mode', this.users[userId].mode)
  }

  getMode(userId) {
    if(typeof this.users[userId] === 'undefined' || typeof this.users[userId].mode === 'undefined') {
      console.log('DEFAULT MODE');
      return 'DEFAULT';
    }
    console.log('Mode:', this.users[userId].mode);
    return this.users[userId].mode;
  }

  getUserState(userId, mode) {
    if(typeof this.users[userId] === 'undefined' || typeof this.users[userId].state === 'undefined' || typeof this.users[userId].state[mode] === 'undefined') {
      // console.log('DEFAULT USER STATE');
      return 'DEFAULT';
    }
    console.log('State:', this.users[userId].state[mode]);
    return this.users[userId].state[mode];
  }

  setUserState(userId, mode, newState) {
    if (typeof this.users[userId] === 'undefined') {
      this.users[userId] = {};
      this.users[userId].state = {};
      this.users[userId].state[mode] = newState;
      console.log('USER ID', this.users[userId]);
    } else if (typeof this.users[userId].state === 'undefined') {
      this.users[userId].state = {};
      console.log('USER STATE', this.users[userId].state);
      this.users[userId].state[mode] = newState;
      console.log('USER STATE FOR MODE', this.users[userId].state[mode]);
    } else {
      this.users[userId].state[mode] = newState;
      console.log('SET USER NOT WORKING?', this.users[userId].state[mode]);
    }
    console.log('Set User State', this.users[userId].state[mode])
  }

  nextState(userId) {

    console.log('nextState() called');
    const currentState = this.getUserState(userId);
    let timeline = this.modes[this.getMode(userId).toLowerCase()].run.timeline;
    timeline.forEach((obj, index) => {
      if(Object.hasOwnPropertyNames(obj)[0] === currentState) {
        if(typeof timeline[index+1] === 'object') {
          this.setUserState(userId, this.getMode(userId), Object.getOwnPropertyNames(timeline[index+1])[0]);
        } else {
          this.setMode('DEFAULT');
        }
      }
    });
  }

  handleMode(userId) {
    // A Monstrosity that MUST be refactored later on
    const timeline = this.modes[this.getMode(userId).toLowerCase()].run.timeline;
    timeline.forEach((obj) => {
      const funcName = Object.getOwnPropertyNames(obj)[0];
      if(funcName === this.getUserState(userId, this.getMode(userId))) {
        console.log(funcName);
        obj[this.getUserState(userId, this.getMode(userId))](userId);
        this.nextState(userId);
      }
    });
  }

}
