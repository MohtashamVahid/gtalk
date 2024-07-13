const mongoose = require('mongoose');

const UserRestrictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restrictionType: {
    type: String,
    enum: ['comment', 'join_group', 'message'], // اضافه کردن نوع محدودیت message
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  reportReason: {
    type: String,
    required: false, // این فیلد می‌تواند اختیاری باشد
  }
});

const UserRestriction = mongoose.model('UserRestriction', UserRestrictionSchema);

module.exports = UserRestriction;
