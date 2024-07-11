const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

/**
 * @swagger
 * /users/{userId}/subscriptions:
 *   post:
 *     summary: Create a new subscription for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Successfully created subscription
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /users/{userId}/subscriptions:
 *   get:
 *     summary: Get all subscriptions for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Successfully retrieved subscriptions
 *       404:
 *         description: User not found
 */

router.post('/:userId/subscriptions', subscriptionController.createSubscription);
router.get('/:userId/subscriptions', subscriptionController.getSubscriptionsForUser);

module.exports = router;
