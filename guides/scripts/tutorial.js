
const send = require('../../fb/send/');
const msg = require('../../fb/assemble/')
const modeManager = require('../GuidedMode');

let state = '';

let tutorial = {

  timeline: [
    {
      introduction: (userId) => {
         const introPromise = send(msg.text('Hi developer,')).to(userId).then(()=>{
           return send(msg.text('I\'m Starbot. Hopefully I\'ll be making your life a tad bit easier.')).to(userId).then(() => {
             return send(msg.text('Lets start with Persistent Menus.')).to(userId);
           });
         });
         introPromise.then(() => {
           console.log('Promises Called');
         })
        //  modeManager.nextState(userId);
      }
    },
    {
      persistentMenu: (userId) => {
        send(msg.text('We will talk about the Persistent Menu Here')).to(userId);

      }
    },
    {
      contentTypes: (userId) => {
        send(msg.text('We will talk about various content types next')).to(userId);
      }
    },
    {
      staticImages: (userId) => {
        send(msg.text('Let me show you a static image!')).to(userId);
        send(msg.image('https://img.grouponcdn.com/deal/iTzVW4nyCypjLANEjKKF/YC-2048x1229.jpg/v1/c700x420.jpg')).to(userId);
      }
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
