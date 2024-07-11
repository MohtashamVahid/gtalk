const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/'); // مسیر ذخیره فایل‌های آپلود شده
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // نام فایل با تاریخ و زمان آپلود
    }
});

// فیلتر فایل‌های مجاز به عکس‌های jpg و png
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// تابع برای آپلود عکس
exports.uploadImage = upload.single('image'); // نام فیلد فرم برای آپلود عکس

// تابع برای آپلود عکس و به‌روزرسانی آدرس عکس
exports.uploadImageAndUpdateUser = async (req, res) => {
    try {
        // اگر فایل آپلود شده نبود
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ذخیره مسیر فایل آپلود شده در فیلد image کاربر
        user.image = req.file.path;

        // ذخیره کاربر با تصویر آپلود شده
        const updatedUser = await user.save();

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const likeUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.likes.includes(targetUserId)) {
      return res.status(400).json({ error: 'You have already liked this user' });
    }

    user.likes.push(targetUserId);
    await user.save();

    res.status(200).json({ message: 'User liked successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const dislikeUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.dislikes.includes(targetUserId)) {
      return res.status(400).json({ error: 'You have already disliked this user' });
    }

    user.dislikes.push(targetUserId);
    await user.save();

    res.status(200).json({ message: 'User disliked successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers likes dislikes subscriptions');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new user
exports.createUser = async (req, res) => {
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        image: req.body.image,
        education: req.body.education,
        phone: req.body.phone,
        bazaar_token: req.body.bazaar_token,
        password: req.body.password,
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a user
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.image = req.body.image || user.image;
        user.education = req.body.education || user.education;
        user.phone = req.body.phone || user.phone;
        user.bazaar_token = req.body.bazaar_token || user.bazaar_token;
        user.password = req.body.password || user.password;

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.getUserByBazaarToken = async (req, res) => {
    const { bazaar_token } = req.params;

    try {
        const user = await User.findOne({ bazaar_token: bazaar_token }).populate('followers likes dislikes subscriptions');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
