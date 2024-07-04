const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  joinTime: {
    type: Date,
    required: true,
  },
  leaveTime: {
    type: Date,
  }
});

const UserSession = mongoose.model('UserSession', UserSessionSchema);

module.exports = UserSession;
