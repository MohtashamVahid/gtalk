const mongoose = require('mongoose');

const TypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: false,
    }
});

const Type = mongoose.model('Type', TypeSchema);

module.exports = Type;
