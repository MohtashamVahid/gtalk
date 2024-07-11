const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    image: {
        type: String,
        required: false,
    },
    education: {
        type: String,
        required: false,
    },
    phone: {
        type: String,
        required: false,
    },
    bazaar_token: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: true,
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    subscriptions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
    }],
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
