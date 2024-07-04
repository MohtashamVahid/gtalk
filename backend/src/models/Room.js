const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  maxParticipants: {
    type: Number,
    required: true,
    default: 10, // Default maximum participants
  },
  maxSpeakers: {
    type: Number,
    required: true,
    default: 3, // Default maximum speakers at a time
  },
  currentSpeakers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }]
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
