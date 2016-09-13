let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let fbUser = new Schema({
  userId:  {type: String, required: true},
  firstName: String,
  lastName: String,
  subscriptions: [{ subscription: String }],
  polls: [{question: String, answer: String}],
});

module.exports = fbUser;
