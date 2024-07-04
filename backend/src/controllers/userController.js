const User = require('../models/User');

const likeUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.likes.includes(targetUserId)) {
      return res.status(400).json({ error: 'You have already liked this user' });
    }

    user.likes.push(targetUserId);
    await user.save();

    res.status(200).json({ message: 'User liked successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const dislikeUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.dislikes.includes(targetUserId)) {
      return res.status(400).json({ error: 'You have already disliked this user' });
    }

    user.dislikes.push(targetUserId);
    await user.save();

    res.status(200).json({ message: 'User disliked successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  likeUser,
  dislikeUser,
};
