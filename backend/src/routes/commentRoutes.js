const express = require('express');
const { getAllComments, addComment } = require('../controllers/commentController');
const { checkUserRestriction } = require('../middlewares/userMiddleWare');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');

// مسیر Swagger و دیگر تنظیمات Swagger

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     responses:
 *       200:
 *         description: A list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get('/',authenticateJWT, getAllComments);

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Add a new comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: The created comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 */
router.post('/',authenticateJWT, checkUserRestriction, addComment);

module.exports = router;
