const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Create a new subscription for a user
const createSubscription = async (req, res) => {
    const { userId } = req.params;
    const { type, purchasedFrom } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const subscription = new Subscription({
            type,
            purchasedFrom,
            user: userId,
        });

        await subscription.save();

        user.subscriptions.push(subscription._id);
        await user.save();

        res.status(201).json({ message: 'Subscription created successfully', subscription });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all subscriptions for a user
const getSubscriptionsForUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).populate('subscriptions');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ subscriptions: user.subscriptions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createSubscription,
    getSubscriptionsForUser,
};
