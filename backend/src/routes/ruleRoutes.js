// routes/rules.js

const express = require('express');
const router = express.Router();
const Rule = require('../models/RuleModel'); // مدل قانونها را وارد کنید

/**
 * @swagger
 * definitions:
 *   Rule:
 *     type: object
 *     required:
 *       - title
 *       - description
 *       - type
 *     properties:
 *       title:
 *         type: string
 *       description:
 *         type: string
 *       type:
 *         type: string
 */

/**
 * @swagger
 * /api/rules:
 *   get:
 *     summary: دریافت همه قوانین
 *     description: دریافت لیست همه قوانین موجود
 *     responses:
 *       200:
 *         description: لیست قوانین با موفقیت دریافت شد
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Rule'
 */
router.get('/api/rules', async (req, res) => {
    try {
        const rules = await Rule.find();
        res.json(rules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @swagger
 * /api/rules/{id}:
 *   get:
 *     summary: دریافت یک قانون خاص
 *     description: دریافت جزئیات یک قانون با استفاده از شناسه
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: شناسه قانون
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: جزئیات قانون با موفقیت دریافت شد
 *         schema:
 *           $ref: '#/definitions/Rule'
 *       404:
 *         description: قانون مورد نظر یافت نشد
 */
router.get('/api/rules/:id', async (req, res) => {
    try {
        const rule = await Rule.findById(req.params.id);
        if (!rule) {
            return res.status(404).json({ message: 'قانون مورد نظر یافت نشد' });
        }
        res.json(rule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
