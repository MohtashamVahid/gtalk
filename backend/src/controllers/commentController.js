const Comment = require('../models/Comment');
const Room = require('../models/Room');

const addComment = async (req, res) => {
  try {
    const { userId, roomId, content } = req.body;

    const comment = new Comment({
      user: userId,
      room: roomId,
      content,
    });

    await comment.save();

    // Update the comment count in the room
    await Room.findByIdAndUpdate(roomId, { $inc: { commentCount: 1 } });

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getCommentsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const comments = await Comment.find({ room: roomId }).populate('user', 'username');
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addComment,
  getCommentsByRoom,
};
