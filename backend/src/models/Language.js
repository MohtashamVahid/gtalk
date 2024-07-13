const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    }
});

const Language = mongoose.model('Language', LanguageSchema);

module.exports = Language;
