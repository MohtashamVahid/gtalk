const express = require('express');
const { getAllComments, addComment } = require('../controllers/commentController');
const { checkUserRestriction } = require('../middleware/userMiddleWare');
const router = express.Router();

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
router.get('/', getAllComments);

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
router.post('/', checkUserRestriction, addComment);

module.exports = router;
