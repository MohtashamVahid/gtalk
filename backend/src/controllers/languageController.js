const Language = require('../models/Language');

// گرفتن همه زبان‌ها
const getAllLanguages = async (req, res) => {
  try {
    const languages = await Language.find();
    res.status(200).json(languages);
  } catch (error) {
    res.status(500).json({ message: 'خطا در گرفتن زبان‌ها', error });
  }
};

// اضافه کردن زبان جدید
const addLanguage = async (req, res) => {
  const { name, code } = req.body;

  try {
    const newLanguage = new Language({ name, code });
    await newLanguage.save();
    res.status(201).json(newLanguage);
  } catch (error) {
    res.status(500).json({ message: 'خطا در اضافه کردن زبان جدید', error });
  }
};

module.exports = {
  getAllLanguages,
  addLanguage,
};
