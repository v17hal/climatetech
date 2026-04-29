"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/stats', async (_req, res, next) => {
    try {
        const [totalFarmers, activeFarms, carbonStats] = await Promise.all([
            prisma_1.prisma.farmer.count(),
            prisma_1.prisma.farmer.count({ where: { status: 'active' } }),
            prisma_1.prisma.carbonRecord.aggregate({ _sum: { carbonLevel: true } }),
        ]);
        res.json({
            totalFarmers,
            activeFarms,
            carbonTracked: carbonStats._sum.carbonLevel ?? 0,
            complianceRate: totalFarmers > 0 ? Math.round((activeFarms / totalFarmers) * 100) : 0,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
