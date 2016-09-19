module.exports = function generic(coreContent, buttons) {
  const content = coreContent;
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
          {
            "title":content.title,
            "item_url":content.itemUrl,
            "image_url":content.imgUrl,
            "subtitle":content.subtitle,
            "buttons":buttons
          }
        ]
      }
    }
  }
}
