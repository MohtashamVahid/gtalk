const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

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

exports.uploadImage = upload.single('image');

exports.uploadImageAndUpdateUser = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({message: 'Please upload an image file'});
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        user.image = req.file.path;
        const updatedUser = await user.save();

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.likeUser = async (req, res) => {
    try {
        const {userId, targetUserId} = req.body;
        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!user || !targetUser) {
            return res.status(404).json({error: 'User not found'});
        }

        if (user.likes.includes(targetUserId)) {
            return res.status(400).json({error: 'You have already liked this user'});
        }

        user.likes.push(targetUserId);
        await user.save();

        res.status(200).json({message: 'User liked successfully'});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
};

exports.dislikeUser = async (req, res) => {
    try {
        const {userId, targetUserId} = req.body;
        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!user || !targetUser) {
            return res.status(404).json({error: 'User not found'});
        }

        if (user.dislikes.includes(targetUserId)) {
            return res.status(400).json({error: 'You have already disliked this user'});
        }

        user.dislikes.push(targetUserId);
        await user.save();

        res.status(200).json({message: 'User disliked successfully'});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers likes dislikes subscriptions');
        if (!user) return res.status(404).json({message: 'User not found'});
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

exports.createUser = async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            image: req.body.image,
            education: req.body.education,
            phone: req.body.phone,
            bazaar_accountId: req.body.bazaar_accountId,
            password: hashedPassword,
            device_id: req.body.device_id,
            has_trial: req.body.has_trial,
            bio: req.body.bio // فیلد جدید معرفی
        });

        const newUser = await user.save();

        const token = jwt.sign({
            userId: newUser.id
        }, process.env.JWT_SECRET, {expiresIn: '30d'});

        res.status(201).json({newUser, token});
    } catch (error) {
        res.status(400).json({message: error.message});
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({message: 'User not found'});

        if (req.body.password) {
            user.password = await bcrypt.hash(req.body.password, 10);
        }

        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.image = req.body.image || user.image;
        user.education = req.body.education || user.education;
        user.phone = req.body.phone || user.phone;
        user.bazaar_accountId = req.body.bazaar_accountId || user.bazaar_accountId;
        user.device_id = req.body.device_id || user.device_id;
        user.has_trial = req.body.has_trial !== undefined ? req.body.has_trial : user.has_trial;
        user.bio = req.body.bio || user.bio; // فیلد جدید معرفی

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({message: error.message});
    }
};

exports.getUserByBazaarToken = async (req, res) => {
    const {token} = req.params;

    try {
        const user = await User.findOne({bazaar_accountId: token}).populate('followers likes dislikes subscriptions');
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};


exports.handleCafeBazaarLogin = async (req, res) => {
    try {
        const {
            username,
            email,
            image,
            education,
            phone,
            bazaar_accountId,
            password,
            device_id,
            has_trial,
            bio
        } = req.body;

        // جستجوی کاربر بر اساس bazaar_accountId
        let user = await User.findOne({bazaar_accountId});

        if (user) {
            // اگر کاربر وجود دارد، اطلاعات او را به‌روزرسانی کنید
            user.username = username || user.username;
            user.email = email || user.email;
            user.image = image || user.image;
            user.education = education || user.education;
            user.phone = phone || user.phone;
            user.device_id = device_id || user.device_id;
            user.has_trial = has_trial !== undefined ? has_trial : user.has_trial;
            user.bio = bio || user.bio;

            // اگر پسورد جدیدی ارسال شده بود، آن را هش کنید و تنظیم کنید
            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }

            const newUser = await user.save();

            const token = jwt.sign({
                userId: newUser._id
            }, process.env.JWT_SECRET, {expiresIn: '30d'});

            res.status(201).json({user, token});

        } else {
            // اگر کاربر وجود ندارد، کاربر جدید ایجاد کنید
            const hashedPassword = password ? await bcrypt.hash(password, 10) : '';
            user = new User({
                username,
                email,
                image,
                education,
                phone,
                bazaar_accountId,
                password: hashedPassword,
                device_id,
                has_trial,
                bio
            });

            const newUser = await user.save();
            const token = jwt.sign({
                userId: newUser.id
            }, process.env.JWT_SECRET, {expiresIn: '30d'});

            res.status(201).json({newUser, token});
        }
    } catch (error) {
        res.status(400).json({message: error.message});
    }
};
