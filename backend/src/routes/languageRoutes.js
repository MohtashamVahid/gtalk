const express = require('express');
const { getAllLanguages, addLanguage } = require('../controllers/languageController');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');


/**
 * @swagger
 * components:
 *   schemas:
 *     Language:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the language
 *         code:
 *           type: string
 *           description: The code of the language
 *       example:
 *         name: English
 *         code: en
 */

/**
 * @swagger
 * /languages:
 *   get:
 *     summary: Get all languages
 *     responses:
 *       200:
 *         description: A list of languages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Language'
 */
router.get('/', getAllLanguages);

/**
 * @swagger
 * /languages:
 *   post:
 *     summary: Add a new language
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Language'
 *     responses:
 *       201:
 *         description: The created language
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Language'
 */
router.post('/',authenticateJWT, addLanguage);

module.exports = router;
