const AppSettings = require('../models/AppSettings');

const getAppSettings = async (req, res) => {
  try {
    const settings = await AppSettings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'App settings not found' });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateAppSettings = async (req, res) => {
  try {
    const { notifications, darkMode, language, maxUsersPerGroup, maxParticipantsPerCall } = req.body;
    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = new AppSettings({
        notifications,
        darkMode,
        language,
        maxUsersPerGroup,
        maxParticipantsPerCall,
      });
    } else {
      settings.notifications = notifications;
      settings.darkMode = darkMode;
      settings.language = language;
      settings.maxUsersPerGroup = maxUsersPerGroup;
      settings.maxParticipantsPerCall = maxParticipantsPerCall;
    }
    await settings.save();
    res.status(200).json({ message: 'App settings updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAppSettings,
  updateAppSettings,
};
