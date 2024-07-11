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
  isOverload: {
    type: Boolean,
    default: false,
  },
  latestVersion: {
    type: String,
    default: '1.0.0',  // یک مقدار پیش‌فرض برای آخرین ورژن
  },
  forceUpdate: {
    type: Boolean,
    default: false,  // یک مقدار پیش‌فرض برای فورس اپدیت
  },
});

const AppSettings = mongoose.model('AppSettings', AppSettingsSchema);

module.exports = AppSettings;
