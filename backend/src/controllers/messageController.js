const Message = require('../models/Message');
const User = require('../models/User');

// ایجاد یک پیام جدید
const createMessage = async (req, res) => {
    try {
        const { senderId, recipientId, content } = req.body;

        // گرفتن اطلاعات فرستنده و گیرنده
        const sender = await User.findById(senderId);
        const recipient = await User.findById(recipientId);

        if (!sender || !recipient) {
            return res.status(404).json({ error: 'Sender or recipient not found' });
        }

        const message = new Message({
            senderId: sender._id,
            senderName: sender.name,
            recipientId: recipient._id,
            recipientName: recipient.name,
            content
        });

        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// دریافت همه پیام‌های جدید برای یک کاربر
const getMessages = async (req, res) => {
    try {
        const { userId, lastTimestamp } = req.params;

        // پیدا کردن پیام‌هایی که بعد از تایم‌استمپ مشخص شده ایجاد شده‌اند
        const messages = await Message.find({
            $or: [
                { senderId: userId },
                { recipientId: userId }
            ],
            timestamp: { $gt: lastTimestamp }
        }).sort({ timestamp: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

module.exports = {
    createMessage,
    getMessages
};
