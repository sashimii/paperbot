'use strict';

module.exports = function handleSingleWord({context, entities}) {

  console.log(context, entities);
  const intent = entities.intent;
  const messageBody = entities.message_body;

  let isSingleWord = false;
  let word = '';
  intent.forEach((item) => {
    if(item.value === 'single word') {
      isSingleWord = true;
    }
  });
  messageBody.forEach((item) => {
    if(isSingleWord) {
      word = item.value;
    }
  });

  const outputContext = {
    singleWord: word,
  };

  return new Promise((resolve, reject) => {
    return resolve(outputContext);
  });

}

// const whatever =
//   {
//     message_body: [
//        {
//          confidence: 0.9050185339786272,
//          type: 'value',
//          value: 'top',
//          suggested: true
//        }
//      ],
//    intent: [ { confidence: 0.9525575586340809, value: 'single word' } ]
//  }
