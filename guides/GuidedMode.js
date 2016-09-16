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

module.exports = class GuidedMode {

  constructor() {
    if (!self) {
      self = this;
    }
    this.users = {};
    return self;
  }

  setMode(userId, modeSetting) {
    this.users[userId].mode = modeSetting;
  }

  getMode(userId) {

    return this.users[userId].mode;
  }

  getUserState(userId, mode) {
    return this.users[userId].state[mode];
  }

  setUserState(userId, mode, newState) {
    this.users[userId].state[mode] = newState;
  }

  userIsInMode(userId, mode) {
    if(typeof this.getMode(userId) !== 'undefined') {
      return this.getMode(userId) === mode ? true : false;
    } else {
      return false;
    }
  }

  handleTutorial(userId, payload) {
    if(this.getTutorialMode(userId)) {
      let userState = this.getUserState(userId);
      tutorial[userState](userId);
    } else {
       return;
    }
  }


}
