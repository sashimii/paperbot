
const send = require('../../fb/send/');
const msg = require('../../fb/assemble/')
const modeManager = require('../GuidedMode');

let state = '';

let tutorial = {

  timeline: [
    {
      introduction: (userId) => {
         send(msg.text('Hi, developer friend!')).to(userId);
         modeManager.nextState(userId);
      }
    },
    {
      persistentMenu: () => {
        return 'wassup';
      }
    },
    {
      contentTypes: () => {}
    },
    {
      staticImages: () => {}
    },
    {
      pngFiles: () => {}
    },
    {
      animatedGifs: () => {}
    },
    {
      audio: () => {}
    },
    {
      video: () => {}
    },
    {
      miscFiles: () => {}
    },
    {
      structuredMessages: () => {}
    },
    {
      basicTemplate: () => {}
    },
    {
      articleLink: () => {}
    },
    {
      webview: () => {}
    },
    {
      instantArticles: () => {}
    },
    {
      articleLists: () => {}
    },
    {
      partnerContent: () => {}
    },
    {
      quickReplies: () => {}
    },
    {
      breakingNews: () => {}
    },
    {
      profileBuilding: () => {}
    },
    {
      opinionPolling: () => {}
    },
    {
      subscriptions: () => {}
    },
    {
      conclusion: () => {}
    }
  ]

};

// console.log(Object.getOwnPropertyNames(tutorial.timeline[0])[0]);

//
// tutorial.timeline.forEach((obj) => {
//   console.log(obj, state);
//   console.log(obj[Object.getOwnPropertyNames(obj)[0]]());
// })

module.exports = tutorial;

// console.log(modeManager.setMode);
