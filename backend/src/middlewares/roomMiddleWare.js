const Room = require('../models/Room');
const User = require('../models/User');
const UserRestriction = require('../models/UserRestriction'); // Assuming UserRestriction model is defined in this file
const mongoose = require('mongoose');

const roomMiddleware = {};

roomMiddleware.validateRoomId = async (req, res, next) => {
    const {roomId} = req.params;

    try {
        // Check if roomId is provided
        if (!roomId) {
            return res.status(400).json({error: 'RoomId parameter is required'});
        }

        // Check if roomId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({error: 'Invalid RoomId'});
        }

        // Check if room exists
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({error: 'Room not found'});
        }

        // Attach room object to request object
        req.room = room;

        next();
    } catch (error) {
        res.status(500).json({error: 'Server Error'});
    }
};

roomMiddleware.checkUserAccess = async (req, res, next) => {
    const {roomId} = req.params;
    const {userId} = req.body;

    try {
        // Fetch user info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        // Check if user is creator of the room or admin of the room
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({error: 'Room not found'});
        }
        if (room.creator.toString() !== userId && !room.admins.includes(userId)) {
            return res.status(403).json({error: 'Unauthorized access to the room'});
        }

        next();
    } catch (error) {
        res.status(500).json({error: 'Server Error'});
    }
};


// Middleware for checking comment restriction
roomMiddleware.checkCommentRestriction = async (req, res, next) => {
    const {userId} = req.body;

    try {
        // Find the user restriction for comments
        const restriction = await UserRestriction.findOne({
            user: userId,
            restrictionType: 'comment',
            expiresAt: {$gt: new Date()}, // Check if restriction has not expired
        });

        if (restriction) {
            return res.status(403).json({error: 'Comment restriction active. Cannot comment.'});
        }

        next();
    } catch (error) {
        res.status(500).json({error: 'Server Error'});
    }
};

// Middleware for checking group creation restriction
roomMiddleware.checkGroupCreationRestriction = async (req, res, next) => {
    const {userId} = req.body;

    try {
        // Find the user restriction for group creation
        const restriction = await UserRestriction.findOne({
            user: userId,
            restrictionType: 'join_group',
            expiresAt: {$gt: new Date()}, // Check if restriction has not expired
        });

        if (restriction) {
            return res.status(403).json({error: 'Group creation restriction active. Cannot create group.'});
        }

        next();
    } catch (error) {
        res.status(500).json({error: 'Server Error'});
    }
};


module.exports = roomMiddleware;
