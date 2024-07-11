const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// مدل گزارش تخلف
const ViolationReportSchema = new Schema({
    reporterName: {
        type: String,
        required: true,
    },
    violationType: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    reportedItemType: {
        type: String,
        enum: ['user', 'group', 'comment'],
        required: true,
    },
    reportedItem: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'reportedItemType', // به یکی از مدل‌های زیر ارجاع می‌دهد
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// مدل گزارش تخلف
const ViolationReport = mongoose.model('ViolationReport', ViolationReportSchema);

module.exports = ViolationReport;
