const AppSettings = require('../models/AppSettings');

const getAppSettings = async (req, res) => {
    try {
        const settings = await AppSettings.findOne();
        if (!settings) {
            return res.status(404).json({error: 'App settings not found'});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
};

const updateAppSettings = async (req, res) => {
    try {
        const {
            notifications,
            maxUsersPerGroup,
            maxParticipantsPerCall,
            isOverload,
            latestVersion,
            forceUpdate
        } = req.body;
        let settings = await AppSettings.findOne();
        if (!settings) {
            settings = new AppSettings({
                notifications,
                maxUsersPerGroup,
                maxParticipantsPerCall,
                isOverload,
                latestVersion,
                forceUpdate
            });
        } else {
            settings.notifications = notifications;
            settings.maxUsersPerGroup = maxUsersPerGroup;
            settings.maxParticipantsPerCall = maxParticipantsPerCall;
            settings.isOverload = isOverload;
            settings.latestVersion = latestVersion;
            settings.forceUpdate = forceUpdate;
        }
        await settings.save();
        res.status(200).json({message: 'App settings updated successfully'});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
};

module.exports = {
    getAppSettings,
    updateAppSettings,
};
