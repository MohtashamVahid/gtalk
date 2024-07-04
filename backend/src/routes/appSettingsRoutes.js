const express = require('express');
const { getAppSettings, updateAppSettings } = require('../controllers/appSettingsController');
const router = express.Router();

router.get('/settings', getAppSettings);
router.put('/settings', updateAppSettings);

module.exports = router;
