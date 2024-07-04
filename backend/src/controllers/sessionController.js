const UserSession = require('../models/UserSession');
const Room = require('../models/Room');
const User = require('../models/User');
const axios = require('axios');

const joinRoom = async (req, res) => {
  try {
    const { userId, roomId } = req.body;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ error: 'Room is full' });
    }

    room.participants.push(userId);
    await room.save();

    const newSession = new UserSession({
      user: userId,
      room: roomId,
      joinTime: new Date(),
    });
    await newSession.save();

    res.status(201).json(newSession);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const leaveRoom = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await UserSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    session.leaveTime = new Date();
    await session.save();

    const room = await Room.findById(session.room);
    room.participants.pull(session.user);
    room.currentSpeakers.pull(session.user);
    await room.save();

    // Calculate time spent in minutes
    const timeSpent = Math.ceil((session.leaveTime - session.joinTime) / (1000 * 60));

    // Charge user in Cafe Bazaar (replace `chargeUser` with the actual API call to Cafe Bazaar)
    await chargeUser(session.user, timeSpent);

    res.status(200).json({ timeSpent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const startSpeaking = async (req, res) => {
  try {
    const { userId, roomId } = req.body;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.currentSpeakers.length >= room.maxSpeakers) {
      return res.status(400).json({ error: 'Too many speakers' });
    }

    room.currentSpeakers.push(userId);
    await room.save();

    res.status(200).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const stopSpeaking = async (req, res) => {
  try {
    const { userId, roomId } = req.body;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.currentSpeakers.pull(userId);
    await room.save();

    res.status(200).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const chargeUser = async (userId, timeSpent) => {
  try {
    // Fetch user info
    const user = await User.findById(userId);

    // Example API call to Cafe Bazaar (replace with actual implementation)
    const response = await axios.post('https://api.cafebazaar.ir/pay', {
      userId: user.cafeBazaarId, // Assuming user model has `cafeBazaarId`
      amount: timeSpent * COST_PER_MINUTE, // Assuming `COST_PER_MINUTE` is defined
    });

    return response.data;
  } catch (error) {
    console.error('Error charging user:', error);
    throw new Error('Failed to charge user');
  }
};

module.exports = {
  joinRoom,
  leaveRoom,
  startSpeaking,
  stopSpeaking,
};
