const mongoose = require('mongoose');

const AppSettingsSchema = new mongoose.Schema({
  notifications: {
    type: Boolean,
    default: true,
  },
  maxUsersPerGroup: {
    type: Number,
    default: 10,
  },
  maxParticipantsPerCall: {
    type: Number,
    default: 4,
  },
});

const AppSettings = mongoose.model('AppSettings', AppSettingsSchema);

module.exports = AppSettings;
