const express = require('express');
const router = express.Router();
const { createViolationReport, getAllViolationReports, getViolationReportById } = require('../controllers/reportController');


/**
 * @swagger
 * /api/violation-reports:
 *   post:
 *     summary: Create a new violation report
 *     tags:
 *       - Violation Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reporterName:
 *                 type: string
 *               violationType:
 *                 type: string
 *               description:
 *                 type: string
 *               reportedItemType:
 *                 type: string
 *                 enum: [user, group, comment]
 *               reportedItem:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Created
 *       '500':
 *         description: Internal Server Error
 */
router.post('/api/violation-reports', createViolationReport);

/**
 * @swagger
 * /api/violation-reports:
 *   get:
 *     summary: Get all violation reports
 *     tags:
 *       - Violation Reports
 *     responses:
 *       '200':
 *         description: Success
 *       '500':
 *         description: Internal Server Error
 */
router.get('/api/violation-reports', getAllViolationReports);

/**
 * @swagger
 * /api/violation-reports/{id}:
 *   get:
 *     summary: Get a violation report by ID
 *     tags:
 *       - Violation Reports
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Success
 *       '404':
 *         description: Violation report not found
 *       '500':
 *         description: Internal Server Error
 */
router.get('/api/violation-reports/:id', getViolationReportById);

module.exports = router;
