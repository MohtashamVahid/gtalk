const express = require('express');
const { createRoom, getRooms, getRoomById, addAdminToRoom, removeMemberFromRoom,updateRoomSettings  } = require('../controllers/roomController');
const router = express.Router();

router.post('/rooms', createRoom);
router.get('/rooms', getRooms);
router.get('/rooms/:id', getRoomById);
router.post('/create', createRoom);
router.post('/addAdmin', addAdminToRoom);
router.post('/removeMember', removeMemberFromRoom);
router.put('/updateSettings', updateRoomSettings);
module.exports = router;
