const Room = require('../models/Room');
const User = require('../models/User');

const createRoom = async (req, res) => {
  try {
    const { name, participants, maxParticipants, maxSpeakers } = req.body;
    const newRoom = new Room({ name, participants, maxParticipants, maxSpeakers, currentSpeakers: [] });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('participants').populate('currentSpeakers');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('participants').populate('currentSpeakers');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
};
