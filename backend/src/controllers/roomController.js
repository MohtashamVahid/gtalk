const Room = require('../models/Room');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // برای ایجاد شناسه یکتا

const createRoom = async (req, res) => {
    try {
        const {name, description, userId, admins, maxMembers, maxSpeakers, languageId, topic, rules} = req.body;
        if (!name || !description || !userId || !languageId || !topic) {
            return res.status(400).json({error: 'Missing required fields'});
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }
        const roomId = uuidv4(); // ایجاد شناسه یکتا برای گروه
        const room = new Room({
            roomId,
            name,
            description,
            creator: user._id,
            members: [user._id],
            admins: admins || [user._id],
            maxMembers: maxMembers || 10,
            maxSpeakers: maxSpeakers || 5,
            languageId,
            topic,
            rules,
            commentCount: 0, // Ensure initial commentCount is set
        });

        await room.save();
        res.status(201).json({message: 'Room created successfully', room});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const updateRoomSettings = async (req, res) => {
    try {
        const {roomId, maxMembers, maxSpeakers, languageId, topic, rules} = req.body;
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({error: 'Room not found'});
        }

        if (maxMembers) {
            room.maxMembers = maxMembers;
        }

        if (maxSpeakers) {
            room.maxSpeakers = maxSpeakers;
        }

        if (languageId) {
            room.languageId = languageId;
        }

        if (topic) {
            room.topic = topic;
        }

        if (rules) {
            room.rules = rules;
        }

        await room.save();
        res.status(200).json({message: 'Room settings updated successfully', room});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const addMemberToRoom = async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

         if (!room.members.includes(userId)) {
            room.members.push(userId);
            await room.save();
            res.status(200).json({ message: 'User added to room members successfully', room });
        } else {
            res.status(400).json({ error: 'User is already a member of this room' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const addAdminToRoom = async (req, res) => {
    try {
        const {roomId, userId, adminId} = req.body;
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({error: 'Room not found'});
        }

        const adminUser = await User.findById(adminId);
        if (!adminUser || !room.admins.includes(adminUser._id)) {
            return res.status(403).json({error: 'Only admins can add other admins'});
        }

        if (!room.members.includes(userId)) {
            return res.status(400).json({error: 'User is not a member of this room'});
        }

        if (!room.admins.includes(userId)) {
            room.admins.push(userId);
            await room.save();
            res.status(200).json({message: 'User added as admin successfully', room});
        } else {
            res.status(400).json({error: 'User is already an admin of this room'});
        }
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const removeMemberFromRoom = async (req, res) => {
    try {
        const {roomId, userId, adminId} = req.body;
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({error: 'Room not found'});
        }

        const adminUser = await User.findById(adminId);
        if (!adminUser || !room.admins.includes(adminUser._id)) {
            return res.status(403).json({error: 'Only admins can remove members'});
        }

        if (!room.members.includes(userId)) {
            return res.status(400).json({error: 'User is not a member of this room'});
        }

        room.members.pull(userId);
        await room.save();
        res.status(200).json({message: 'User removed from room successfully', room});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const banMemberFromRoom = async (req, res) => {
    const { roomId, userId, adminId } = req.body;
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const adminUser = await User.findById(adminId);
        if (!adminUser || !room.admins.includes(adminUser._id)) {
            return res.status(403).json({ error: 'Only admins can ban members' });
        }

        if (!room.members.includes(userId)) {
            return res.status(400).json({ error: 'User is not a member of this room' });
        }

        // First, remove user from members
        room.members.pull(userId);
        await room.save();

        // Now add user to bannedMembers
        if (!room.bannedMembers.includes(userId)) {
            room.bannedMembers.push(userId);
        }
        await room.save();

        res.status(200).json({ message: 'User banned from room successfully', room });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    createRoom,
    addAdminToRoom,
    updateRoomSettings,
    addMemberToRoom,
    removeMemberFromRoom,
    banMemberFromRoom
};
