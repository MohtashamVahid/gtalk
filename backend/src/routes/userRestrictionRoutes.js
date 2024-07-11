// userRestrictionsRoutes.js

const express = require('express');
const router = express.Router();
const userRestrictionController = require('../controllers/userRestrictionController');

/**
 * @swagger
 * /user_restrictions:
 *   get:
 *     summary: Retrieve all user restrictions
 *     tags: [User Restrictions]
 *     responses:
 *       '200':
 *         description: A list of user restrictions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 5f4933c8e47b4c7e3c99838c
 *                   user:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 5f4933c8e47b4c7e3c99838b
 *                       username:
 *                         type: string
 *                         example: john_doe
 *                   restrictionType:
 *                     type: string
 *                     example: BAN
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-07-11T12:00:00.000Z
 */

// GET /user_restrictions
router.get('/', userRestrictionController.getUserRestrictions);

/**
 * @swagger
 * /user_restrictions:
 *   post:
 *     summary: Create a new user restriction
 *     tags: [User Restrictions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 example: 5f4933c8e47b4c7e3c99838b
 *               restrictionType:
 *                 type: string
 *                 example: BAN
 *               daysToExpire:
 *                 type: integer
 *                 example: 7
 *     responses:
 *       '201':
 *         description: User restriction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 5f4933c8e47b4c7e3c99838c
 *                 user:
 *                   type: string
 *                   example: 5f4933c8e47b4c7e3c99838b
 *                 restrictionType:
 *                   type: string
 *                   example: BAN
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-07-18T12:00:00.000Z
 *       '400':
 *         description: Bad request. Invalid input data.
 */

// POST /user_restrictions
router.post('/', userRestrictionController.createUserRestriction);


/**
 * @swagger
 * /user_restrictions/{id}:
 *   delete:
 *     summary: Delete a user restriction by ID
 *     tags: [User Restrictions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 5f4933c8e47b4c7e3c99838c
 *     responses:
 *       '200':
 *         description: User restriction deleted successfully
 *       '404':
 *         description: User restriction not found
 *       '500':
 *         description: Internal server error
 */

router.delete('/:id', userRestrictionController.deleteUserRestriction);


module.exports = router;
