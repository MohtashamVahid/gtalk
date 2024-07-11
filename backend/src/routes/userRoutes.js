const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkUserFields } = require('../middleware/userMiddleWare');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Successfully retrieved all users
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully created user
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated user
 */

/**
 * @swagger
 * /users/bazaar_accountId/{token}:
 *   get:
 *     summary: Get user by Bazaar Token
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Bazaar Token
 *     responses:
 *       200:
 *         description: Successfully retrieved user
 */

/**
 * @swagger
 * /users/upload-image/{id}:
 *   post:
 *     summary: Upload image and update user
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
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
 *       200:
 *         description: Successfully uploaded image and updated user
 */

router.post('/', checkUserFields, userController.createUser);
router.put('/:id', userController.updateUser);
router.get('/bazaar_accountId/:token', userController.getUserByBazaarToken);
router.post('/upload-image/:id', userController.uploadImageAndUpdateUser);

module.exports = router;
