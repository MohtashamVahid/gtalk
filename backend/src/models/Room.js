const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
   maxMembers: {
    type: Number,
    default: 10, // تعداد حداکثر اعضا در گروه
  },
  maxSpeakers: {
    type: Number,
    default: 5, // تعداد حداکثر کاربران همزمان که می‌توانند صحبت کنند
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
