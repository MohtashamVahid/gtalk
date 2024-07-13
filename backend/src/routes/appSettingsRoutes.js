const express = require('express');
const {getAppSettings, updateAppSettings} = require('../controllers/appSettingsController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');

router.get('/settings', getAppSettings);
router.put('/settings', authenticateJWT, updateAppSettings);

module.exports = router;
