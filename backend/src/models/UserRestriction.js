const mongoose = require('mongoose');

const UserRestrictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restrictionType: {
    type: String,
    enum: ['comment', 'join_group'], // انواع محدودیت‌ها می‌تواند متفاوت باشد
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
});

const UserRestriction = mongoose.model('UserRestriction', UserRestrictionSchema);

module.exports = UserRestriction;
