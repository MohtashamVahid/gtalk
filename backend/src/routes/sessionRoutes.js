const express = require('express');
const { joinRoom, leaveRoom, startSpeaking, stopSpeaking } = require('../controllers/sessionController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');

router.post('/join',authenticateJWT, joinRoom);
router.post('/leave',authenticateJWT, leaveRoom);
router.post('/start-speaking',authenticateJWT, startSpeaking);
router.post('/stop-speaking',authenticateJWT, stopSpeaking);

module.exports = router;
