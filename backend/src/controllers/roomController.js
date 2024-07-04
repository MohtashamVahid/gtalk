const Room = require('../models/Room');
const User = require('../models/User');

const createRoom = async (req, res) => {
  try {
    const { name, description, userId, admins, maxMembers, maxSpeakers } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const room = new Room({
      name,
      description,
      members: [user._id],
      admins: admins || [user._id], // Set the creator as admin or the provided admins
      maxMembers: maxMembers || 10, // Default max members if not provided
      maxSpeakers: maxSpeakers || 5, // Default max speakers if not provided
    });

    await room.save();
    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateRoomSettings = async (req, res) => {
  try {
    const { roomId, maxMembers, maxSpeakers } = req.body;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (maxMembers) {
      room.maxMembers = maxMembers;
    }

    if (maxSpeakers) {
      room.maxSpeakers = maxSpeakers;
    }

    await room.save();
    res.status(200).json({ message: 'Room settings updated successfully', room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const addAdminToRoom = async (req, res) => {
  try {
    const { roomId, userId, adminId } = req.body;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const adminUser = await User.findById(adminId);
    if (!adminUser || !room.admins.includes(adminUser._id)) {
      return res.status(403).json({ error: 'Only admins can add other admins' });
    }

    if (!room.members.includes(userId)) {
      return res.status(400).json({ error: 'User is not a member of this room' });
    }

    if (!room.admins.includes(userId)) {
      room.admins.push(userId);
      await room.save();
      res.status(200).json({ message: 'User added as admin successfully', room });
    } else {
      res.status(400).json({ error: 'User is already an admin of this room' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const removeMemberFromRoom = async (req, res) => {
  try {
    const { roomId, userId, adminId } = req.body;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const adminUser = await User.findById(adminId);
    if (!adminUser || !room.admins.includes(adminUser._id)) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    if (!room.members.includes(userId)) {
      return res.status(400).json({ error: 'User is not a member of this room' });
    }

    room.members.pull(userId);
    await room.save();
    res.status(200).json({ message: 'User removed from room successfully', room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createRoom,
  addAdminToRoom,
  removeMemberFromRoom,
    updateRoomSettings,
};
