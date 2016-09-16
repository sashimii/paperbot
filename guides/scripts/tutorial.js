
const send = require('./fb/send/');

const msg = require('./fb/assemble/')


let tutorial = {

  timeline: [
    {
      introduction: (userId) => {
         send(msg.text('Hi, developer friend!')).to(userId);
      }
    },
    {
      persistentMenu: () => {}
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




module.exports = tutorial;
