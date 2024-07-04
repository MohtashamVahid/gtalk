const express = require('express');
const { createRoom, getRooms, getRoomById } = require('../controllers/roomController');
const router = express.Router();

router.post('/rooms', createRoom);
router.get('/rooms', getRooms);
router.get('/rooms/:id', getRoomById);

module.exports = router;
