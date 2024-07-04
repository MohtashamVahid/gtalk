const express = require('express');
const { registerUser, loginUser,likeUser, dislikeUser } = require('../controllers/userController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/like', likeUser);
router.post('/dislike', dislikeUser);

module.exports = router;
