const express = require('express');
const { joinRoom, leaveRoom, startSpeaking, stopSpeaking } = require('../controllers/sessionController');
const router = express.Router();

router.post('/join', joinRoom);
router.post('/leave', leaveRoom);
router.post('/start-speaking', startSpeaking);
router.post('/stop-speaking', stopSpeaking);

module.exports = router;
