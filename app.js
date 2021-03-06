/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
'use strict';

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request'),
  axios = require('axios'),
  ThreadSettingsHandler = require('./thread/settings'),
  robotFactory = require('./ai/robotFactory'),
  send = require('./fb/send'),
  data = require('./data'),
  msg = require('./fb/assemble');

const GuidedMode = require('./guides/GuidedMode');
const modeManager = new GuidedMode();

if(!process.env.WIT_CLIENT_TOKEN) {
  require('dotenv').config();
}

const witAccessToken = process.env.WIT_CLIENT_TOKEN;

// ----------------------------------------------------------------------------
// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

const _send = (request, response) => {
  // const {sessionId, context, entities} = request;
  const sessionId = request.sessionId,
        context = request.context,
        entities = request.entities;
  const text = response.text,
        quickreplies = response.quickreplies;

  console.log('*** TEXT LENGTH IS: ', text.length);
  // Our bot has something to say!
  // Let's retrieve the Facebook user whose session belongs to
  const recipientId = sessions[sessionId].fbid;
  if (recipientId) {
    // Yay, we found our recipient!
    // Let's forward our bot response to her.
    // We return a promise to let our bot know when we're done sending
    if(text.length > 320) {

      let textToSend = text.split('.');
      let newParagraph = '';
      textToSend.forEach((sentence, index) => {
        if((newParagraph + `${sentence}.`).length <= 320) {
          newParagraph += `${sentence}.`;
        } else if ((newParagraph + `${sentence}.`).length > 320) {
          sendTypingOn(recipientId);
          sendTextMessage(recipientId, newParagraph);
          sendTypingOff(recipientId);
          newParagraph = `${sentence}.`;
        }

        if(textToSend[index+1] === undefined) {
          sendTypingOn(recipientId);
          sendTextMessage(recipientId, newParagraph);
          sendTypingOff(recipientId);
        }
      });
    } else {
      sendTypingOn(recipientId);
      sendTextMessage(recipientId, text);
      sendTypingOff(recipientId);
    }

    // // Giving the wheel back to our bot
    // return Promise.resolve()
  } else {
    console.error('Oops! Couldn\'t find user for session:', sessionId);
    // Giving the wheel back to our bot
    return Promise.resolve()
  }
}

const ai = robotFactory(witAccessToken, _send, require('./ai/actions'));

var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;
  console.log('***webhook data***', JSON.stringify(data));

  /* Ideal State of affairs:
     let handleMessage = receive(data).then((event) => { return handleMsgPromise(event) });
     handleMessage().then((stuff) => { send(stuff).to(user)});
  */

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query['account_linking_token'];
  var redirectURI = req.query['redirect_uri'];

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(event));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  let opinionPoll = {
    "text":"If an election was held today, which party would you vote for?",
    "metadata": "DEVELOPER_DEFINED_METADATA",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Liberal",
        "payload":"POLL_LIBERAL"
      },
      {
        "content_type":"text",
        "title":"PC",
        "payload":"POLL_PC"
      },
      {
        "content_type":"text",
        "title":"NDP",
        "payload":"POLL_NDP"
      }
    ]
  };


  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s",
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);

    handlePayloads(quickReplyPayload, senderID);
    return;
  }

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {

      case 'poll me':
        send(msg.ask('Do you think John Tory is doing a good job as mayor?', 'mayor_status', 'Yes', 'No')).to(senderID);
        break;
      case 'subscription cta':
        send(msg.button('Would you like a list of morning headlines? We\'ll message you at 7 AM EST, every day.', [{type: 'postback', title: 'Sign Me Up', payload: 'SIGN_UP_MH'}, {type: 'postback', title: 'No Thanks', payload: 'NO_SIGN_UP_MH'}])).to(senderID);
        break;
      case 'breaking news cta':
        send(msg.ask('The United States election is a hot mess. Should we keep you updated?', 'US_ELECTIONS', 'Keep Me Updated', 'I\'ll Pass')).to(senderID);
        break;
      case 'testing this':
        sendTextMessage(senderID, '"' + messageText + '" works!');
        break;
      case 'image':
        send(SERVER_URL + "/assets/rift.png").to(senderID);
        break;

      case 'gif':
        sendGifMessage(senderID);
        break;

      case 'audio':
        sendAudioMessage(senderID);
        break;

      case 'video':
        sendVideoMessage(senderID);
        break;

      case 'file':
        sendFileMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      case 'quick reply':
        sendQuickReply(senderID);
        break;

      case 'read receipt':
        sendReadReceipt(senderID);
        break;

      case 'typing on':
        sendTypingOn(senderID);
        break;

      case 'typing off':
        sendTypingOff(senderID);
        break;

      case 'account linking':
        sendAccountLinking(senderID);
        break;

      default:
        send(msg.text('AI Features have been temporarily disabled until the OnePlus 3T Soft Gold is in stock')).to(senderID);
        // aiResponse(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }

}

function aiResponse(recipientId, messageText) {
  const sessionId = findOrCreateSession(recipientId);
  sendTypingOn(recipientId);
  ai.runActions(sessionId, messageText, {})
    .then((data) => {
      console.log('***User has received message!***', data)
      sendTypingOff(recipientId);
    });
}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s",
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  data.getSection(payload).then((sectionItems) => {
    send(sectionItems).to(senderID);
  })


  handlePayloads(payload, senderID);


  // sendTextMessage(senderID, "Postback called");
}

function handlePayloads(payload, senderID) {

  let buttons = [
    {type: 'postback', title: 'Breaking News', payload: 'BREAKING_NEWS_SUB'},
    {type: 'postback', title: 'Sports', payload: 'SPORTS_SUB'}
  ];

  let generic = {
    content: {
      title: 'Breaking News',
      subtitle: 'Up-to-the-minute alerts on breaking news in the GTA and around the world.',
      imgUrl: 'https://www.thestar.com/assets/img/newsletters/breaking.jpg'
    },
    buttons: [
      {
        "type":"postback",
        "title":"Sign Me Up",
        "payload":"SIGN_UP_BN"
      },
      {
        "type":"postback",
        "title":"No Thanks!",
        "payload":"DEVELOPER_DEFINED_PAYLOAD"
      }
    ]
  };
  switch (payload) {
    case 'SIGN_UP_MH':
      send(msg.text('Thank you for signing up to our Morning Headlines updates')).to(senderID);
      break;
    case 'SIGN_UP_BN':
      send(msg.text('Thank you for signing up to our Breaking News updates')).to(senderID);
      break;
    case 'NO_SIGN_UP_MH':
      send(msg.ask('No problem. Would you like to learn of our other subscriptions?', 'other_subs', 'Yes', 'No')).to(senderID);
    case 'ASK_OTHER_SUBS_YES':
      send(msg.button('Here is a list of our Subscriptions: ', buttons)).to(senderID);
      break;
    case 'ASK_MAYOR_STATUS_YES':
      send(msg.text('Thanks for letting us know what you think!')).to(senderID);
      break;
    case 'ASK_US_ELECTIONS_KEEP ME UPDATED':
      sendTypingOn(senderID);
      data.getSection('/news/world/uselection').then((sectionItems) => {
        send(sectionItems).to(senderID)
      });
      break;
    case 'BREAKING_NEWS_SUB':
      send(msg.generic(generic.content, generic.buttons)).to(senderID);
      break;
    case 'SOFT_GOLD':
      sendSoftGoldStatus(senderID);
      break;
    case 'GET_RANDOM_PUPPER':
      data.getPuppers().then((result) => {
        const puppers = msg.image(result.data.data['image_url']);
        send(puppers).to(senderID);
      })
      .catch((error) => {
        if(error) {
          send(msg.text('I\'m really sorry, but I can\'t seem to find a pupper gif right now D:')).to(senderID);
        }
      });
      break;
    default:
      send(msg.text('Postback: "' + payload + '" received!')).to(senderID);
      break;
  }
}

function sendSoftGoldStatus(senderID) {
  const phoneToCheck = 403;
  axios.get(`https://oneplus.net/xman/product/info?param={"store":"ca_en","id":409,"ids":["${phoneToCheck}"]}`)
    .then((response) => {
      const data = response.data.data.children[phoneToCheck];
      const stock = data.stock;
      if(stock === 1) {

        const message = {
          title: data.name + ' is IN STOCK!',
          itemUrl: 'https://oneplus.net/ca_en/oneplus-3t',
          imageUrl: 'http://cdn04.androidauthority.net/wp-content/uploads/2016/11/OnePlus-3T-Soft-Gold-hero.png',
          subtitle: 'GO GO GO BUY BUY BUY'
        };
        const buttons = [
          {
            type: 'web_url',
            url: 'https://oneplus.net/ca_en/oneplus-3t',
            title: 'Buy dis phone'
          }
        ];
        const opPayload = msg.generic(message, buttons)
        send(msg.text(`${data.name} is available!`)).to(senderID);
        send(opPayload).to(senderID);
      } else {
        send(msg.text(`${data.name} is NOT IN STOCK. Please check again later!`)).to(senderID);
      }
    });
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "/assets/allofus480.mov"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/assets/test.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPED_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+16505551234"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",
          timestamp: "1428444852",
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      metadata: "DEVELOPER_DEFINED_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Action",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Comedy",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Drama",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s",
        recipientId);
      }
    } else {
      console.error(response.error);
    }
  });
}

function checkForOnePlus3TSoftGold() {

  const threadSettings = new ThreadSettingsHandler();

  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const fifteenMins = minute * 15;
  var fifteenMinuteInterval = 0;
  var hourInterval = 0;

  const iterationInterval = () => {

  }

  const isFifteenMins = () => {
    return (fifteenMinuteInterval / fifteenMins) === 1 ? true : false;
  }
  const isOneHour = () => {
    return (hourInterval / hour) === 1 ? true : false;
  }
  // Send a message every 30 seconds
  setInterval(function () {

    const softGoldId = 403;
    const gunmetalId = 399;
    const phoneToCheck = softGoldId;
    const SONIA = process.env['SONIA_FB_ID'];
    const SUSHIL = process.env['SUSHIL_FB_ID'];

    axios.get(`https://oneplus.net/xman/product/info?param={"store":"ca_en","id":409,"ids":["${phoneToCheck}"]}`)
      .then((response) => {
        const data = response.data.data.children[phoneToCheck];
        const stock = data.stock;
        if(stock === 1 && !threadSettings.getInformedState('sonia')) {
          const message = {
            title: data.name + ' is IN STOCK!',
            itemUrl: 'https://oneplus.net/ca_en/oneplus-3t',
            imageUrl: 'http://cdn04.androidauthority.net/wp-content/uploads/2016/11/OnePlus-3T-Soft-Gold-hero.png',
            subtitle: 'GO GO GO BUY BUY BUY'
          };
          const buttons = [
            {
              type: 'web_url',
              url: 'https://oneplus.net/ca_en/oneplus-3t',
              title: 'Buy dis phone'
            }
          ];
          const opPayload = msg.generic(message, buttons)
          send(opPayload).to(SONIA);
          send(opPayload).to(SUSHIL);
          threadSettings.setInformedState('sonia', true);
        } else if (stock === 0 && threadSettings.getInformedState('sonia')) {
          const message = `As of ${dateTime}, OP3T SOFT GOLD is no longer in stock :S`
          send(msg.text(message)).to(SONIA);
          send(msg.text(message)).to(SUSHIL);
          threadSettings.setInformedState('sonia', false);
        } else if (stock === 0 && isOneHour()){
          const dateTime = new Date().toUTCString();
          const message = `As of ${dateTime}, OP3T SOFT GOLD is still NOT IN STOCK`
          send(msg.text(message)).to(SUSHIL);
        }
      })
      .catch(function(error) {
        console.log(error);
        send(msg.text('There is an error with retreiving the data')).to(SUSHIL);
        send(msg.text(error)).to(SUSHIL);
      });

      if(isFifteenMins()) {
        fifteenMinuteInterval = 0;
      } else {
        fifteenMinuteInterval += minute;
      }
      if(isOneHour()) {
        hourInterval = 0;
      } else {
        hourInterval += minute;
      }

    // send(msg.text('Testing messages per interval')).to(process.env['SUSHIL_FB_ID']);
  }, minute);
}

checkForOnePlus3TSoftGold()


// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  const threadSettingsHandler = new ThreadSettingsHandler();
  threadSettingsHandler.setGreeting('Hello, I\'m Starbot!');
  threadSettingsHandler.setGetStartedButton([{payload: 'Hello Again, World!', title: 'Hi there!'}]);
  threadSettingsHandler.setPersistentMenu([
    {
      type: 'postback',
      title: 'Soft Gold?',
      payload: 'SOFT_GOLD'
    },
    {
      type: 'postback',
      title: 'Puppers Please?',
      payload: 'GET_RANDOM_PUPPER'
    }
  ]);
  // data.getNavigation().then((navigation) => {
  //   threadSettingsHandler.setPersistentMenu(navigation);
  // });

});

module.exports = app;
