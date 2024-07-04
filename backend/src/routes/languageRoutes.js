const express = require('express');
const { getAllLanguages } = require('../controllers/languageController');
const router = express.Router();

router.get('/languages', getAllLanguages);

module.exports = router;
