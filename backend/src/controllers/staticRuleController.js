// controllers/StaticRuleController.js

const staticRules = require('../models/StaticRuleModel');

// دریافت همه قوانین ثابت
const getAllStaticRules = (req, res) => {
    try {
        res.json(staticRules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllStaticRules
};
