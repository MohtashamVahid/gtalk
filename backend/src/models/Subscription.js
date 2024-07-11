const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['normal', 'vip'],
        required: true,
    },
    purchasedFrom: {
        type: String,
        enum: ['CafeBazaar', 'Direct'],
        required: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription;
