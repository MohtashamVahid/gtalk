const ViolationReport = require('../models/ViolationReport');
const violationTypes = ['اسپم', 'توهین', 'محتوای غیرقانونی', 'استفاده نامناسب از محتوا', 'مزاحمت', 'انتشار اطلاعات شخصی', 'سو استفاده از حقوق دیگران', 'نقض حریم خصوصی', 'غیر مجاز بودن محتوا','انتقاد نادرست','دیگر'];

// تابع برای ثبت گزارش تخلف
const createViolationReport = async (req, res) => {
    const { reporterName, violationType, description, reportedItemType, reportedItem } = req.body;

    try {
        const newReport = new ViolationReport({
            reporterName,
            violationType,
            description,
            reportedItemType,
            reportedItem,
        });

        await newReport.save();

        res.status(201).json({ success: true, report: newReport });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// تابع برای دریافت همه گزارش‌های تخلف
const getAllViolationReports = async (req, res) => {
    try {
        const reports = await ViolationReport.find();
        res.status(200).json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// تابع برای دریافت یک گزارش تخلف خاص بر اساس شناسه
const getViolationReportById = async (req, res) => {
    const { id } = req.params;

    try {
        const report = await ViolationReport.findById(id);
        if (!report) {
            return res.status(404).json({ success: false, error: 'گزارش تخلف مورد نظر یافت نشد.' });
        }
        res.status(200).json({ success: true, report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Controller to get list of violation types
function getViolationTypes(req, res) {
    res.json(violationTypes);
}


module.exports = {
    getViolationTypes,
    createViolationReport,
    getAllViolationReports,
    getViolationReportById,
};