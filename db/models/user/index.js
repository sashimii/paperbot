let fbUserSchema = require('./user');
let mongoose = require('mongoose');
if(!process.env.MONGO_URI) {
  require('dotenv').config();
}

mongoose.connect(process.env.MONGO_URI);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('Connected!');
});

let User = mongoose.model('fbUser', fbUserSchema);

module.exports = User;
// newUser = new User({})

// module.exports = User;
