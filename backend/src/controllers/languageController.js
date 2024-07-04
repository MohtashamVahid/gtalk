const Language = require('../models/Language');

const getAllLanguages = async (req, res) => {
  try {
    const languages = await Language.find();
    res.status(200).json(languages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllLanguages,
};
