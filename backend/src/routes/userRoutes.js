const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const authenticateJWT = require('../middlewares/authMiddleware');



/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Operations related to users
 */

/**
 * @swagger
 * /api/user/upload-image/{id}:
 *   post:
 *     summary: Upload user image
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Successfully uploaded user image
 *       '400':
 *         description: Invalid request
 */
router.post('/api/user/upload-image/:id',authenticateJWT, userController.uploadImage, userController.uploadImageAndUpdateUser);


/**
 * @swagger
 * /api/user/like:
 *   post:
 *     summary: Like a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               targetUserId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User liked successfully
 *       '400':
 *         description: Invalid request or already liked
 */
router.post('/api/user/like', authenticateJWT,userController.likeUser);


/**
 * @swagger
 * /api/user/dislike:
 *   post:
 *     summary: Dislike a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               targetUserId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User disliked successfully
 *       '400':
 *         description: Invalid request or already disliked
 */
router.post('/api/user/dislike',authenticateJWT, userController.dislikeUser);


/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: Successfully retrieved user
 *       '404':
 *         description: User not found
 */
router.get('/api/user/:id',authenticateJWT, userController.getUserById);


/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               image:
 *                 type: string
 *               education:
 *                 type: string
 *               phone:
 *                 type: string
 *               bazaar_accountId:
 *                 type: string
 *               password:
 *                 type: string
 *               device_id:
 *                 type: string
 *               has_trial:
 *                 type: boolean
 *               bio:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User created successfully
 *       '400':
 *         description: Invalid request
 */
router.post('/api/user', userController.createUser);


/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               image:
 *                 type: string
 *               education:
 *                 type: string
 *               phone:
 *                 type: string
 *               bazaar_accountId:
 *                 type: string
 *               password:
 *                 type: string
 *               device_id:
 *                 type: string
 *               has_trial:
 *                 type: boolean
 *               bio:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User updated successfully
 *       '400':
 *         description: Invalid request
 *       '404':
 *         description: User not found
 */
router.put('/api/user/:id',authenticateJWT, userController.updateUser);


/**
 * @swagger
 * /api/user/bazaar/{token}:
 *   get:
 *     summary: Get user by Bazaar token
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Bazaar account ID token
 *     responses:
 *       '200':
 *         description: Successfully retrieved user
 *       '404':
 *         description: User not found
 */
router.get('/api/user/bazaar/:token', userController.handleCafeBazaarLogin);


module.exports = router;
