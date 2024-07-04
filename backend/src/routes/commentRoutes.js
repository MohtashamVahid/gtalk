const express = require('express');
const { addComment, getCommentsByRoom } = require('../controllers/commentController');
const router = express.Router();

router.post('/add', addComment);
router.get('/room/:roomId', getCommentsByRoom);

module.exports = router;
