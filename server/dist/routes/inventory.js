"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/farmer/:farmerId', async (req, res, next) => {
    try {
        const items = await prisma_1.prisma.inventoryItem.findMany({
            where: { farmerId: req.params.farmerId },
            orderBy: { name: 'asc' },
        });
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const item = await prisma_1.prisma.inventoryItem.create({ data: req.body });
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id', async (req, res, next) => {
    try {
        const item = await prisma_1.prisma.inventoryItem.update({ where: { id: req.params.id }, data: req.body });
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        await prisma_1.prisma.inventoryItem.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
