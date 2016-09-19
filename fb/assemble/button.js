module.exports = function button(buttonText, ...buttons ) {

  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: buttonText,
        buttons: buttons
      }
    }
  };

}
