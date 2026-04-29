"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/farmer/:farmerId', async (req, res, next) => {
    try {
        const records = await prisma_1.prisma.carbonRecord.findMany({
            where: { farmerId: req.params.farmerId },
            orderBy: { date: 'desc' },
        });
        res.json(records);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const { farmerId, date, carbonLevel, soilPH, organicMatter, moisture, inputMethod, notes } = req.body;
        const record = await prisma_1.prisma.carbonRecord.create({
            data: { farmerId, date: new Date(date), carbonLevel, soilPH, organicMatter, moisture, inputMethod, notes },
        });
        res.status(201).json(record);
    }
    catch (err) {
        next(err);
    }
});
router.get('/stats', async (_req, res, next) => {
    try {
        const result = await prisma_1.prisma.carbonRecord.aggregate({
            _sum: { carbonLevel: true },
            _avg: { carbonLevel: true, soilPH: true, organicMatter: true },
            _count: true,
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
