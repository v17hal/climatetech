"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', async (_req, res, next) => {
    try {
        const alerts = await prisma_1.prisma.alert.findMany({
            orderBy: { createdAt: 'desc' }, take: 50,
            include: { farmer: { select: { farmerId: true, farmName: true } } },
        });
        res.json(alerts);
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id/read', async (req, res, next) => {
    try {
        const alert = await prisma_1.prisma.alert.update({ where: { id: req.params.id }, data: { read: true } });
        res.json(alert);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
