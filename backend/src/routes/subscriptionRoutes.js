const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// POST /api/users/:userId/subscriptions
router.post('/:userId/subscriptions', subscriptionController.createSubscription);

// GET /api/users/:userId/subscriptions
router.get('/:userId/subscriptions', subscriptionController.getSubscriptionsForUser);

module.exports = router;
