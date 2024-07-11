// userRestrictionController.js

const UserRestriction = require('../models/UserRestriction');
const moment = require('moment-timezone');

// GET /user_restrictions
const getUserRestrictions = async (req, res) => {
  try {
    const userRestrictions = await UserRestriction.find().populate('user', 'username'); // Populate the 'user' field with 'username'
    res.json(userRestrictions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /user_restrictions
const createUserRestriction = async (req, res) => {
  const { user, restrictionType, daysToExpire } = req.body;

  // Calculate expiresAt date based on daysToExpire
  const expiresAt = moment().add(daysToExpire, 'days').toDate();

  try {
    const userRestriction = new UserRestriction({
      user,
      restrictionType,
      expiresAt
    });

    const newUserRestriction = await userRestriction.save();
    res.status(201).json(newUserRestriction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// DELETE /user_restrictions/:id
const deleteUserRestriction = async (req, res) => {
  const id = req.params.id;

  try {
    const deletedUserRestriction = await UserRestriction.findByIdAndDelete(id);
    if (!deletedUserRestriction) {
      return res.status(404).json({ message: 'User restriction not found' });
    }
    res.json({ message: 'User restriction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getUserRestrictions,
  createUserRestriction,
  deleteUserRestriction
};
