const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // فیلد اجباری برای ذخیره کردن ایدی سازنده
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
        default: 20,
    },
    maxSpeakers: {
        type: Number,
        default: 5,
    },
    languageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Language',
        required: true, // اینجا فیلد اجباری برای ذخیره کردن ایدی زبان
    },
    topic: {
        type: String,
        required: true,
    },
    commentCount: {
        type: Number,
        default: 0,
    },
    rules: {
        type: String,
        required: false,
    },
    bannedMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
