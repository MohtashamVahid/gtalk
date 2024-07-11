const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users

// Get user by ID
router.get('/:id', userController.getUserById);

// Create a new user
router.post('/', userController.createUser);

// Update a user
router.put('/:id', userController.updateUser);

router.get('/bazaar_token/:token', userController.getUserByBazaarToken);

router.post('/upload-image/:id', userController.uploadImageAndUpdateUser);

module.exports = router;
