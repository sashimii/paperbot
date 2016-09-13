let User = require('./models/user');

module.exports = class Database() {

  addUser(userId) {
    let userToAdd = new User({userId: userId);
  }

  getUser(userId) {
    return new Promise((resolve, reject) => {
      User.findOne({ userId: userId }, (err, user) => {
        if(err) {
          return reject(err);
        }
        return resolve(user);
      });
    });
  }



}
