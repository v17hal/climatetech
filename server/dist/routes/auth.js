"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    phone: zod_1.z.string().min(10),
    nationalId: zod_1.z.string().min(6),
    farmName: zod_1.z.string().min(2),
    farmSize: zod_1.z.number().positive(),
    province: zod_1.z.string().min(2),
    district: zod_1.z.string().min(2),
    cropTypes: zod_1.z.array(zod_1.z.string()).default([]),
    farmingPractices: zod_1.z.array(zod_1.z.string()).default([]),
});
function generateFarmerId() {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `CSA-${year}-${rand}`;
}
function signTokens(userId, role) {
    const access = jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refresh = jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { access, refresh };
}
router.post('/register', async (req, res, next) => {
    try {
        const body = registerSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: body.email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(body.password, 12);
        const farmerId = generateFarmerId();
        const user = await prisma_1.prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                password: hashed,
                role: 'farmer',
                farmer: {
                    create: {
                        farmerId,
                        phone: body.phone,
                        nationalId: body.nationalId,
                        farmName: body.farmName,
                        farmSize: body.farmSize,
                        province: body.province,
                        district: body.district,
                        cropTypes: JSON.stringify(body.cropTypes),
                        farmingPractices: JSON.stringify(body.farmingPractices),
                        status: 'pending',
                    },
                },
            },
            include: { farmer: true },
        });
        const tokens = signTokens(user.id, user.role);
        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role, farmerId },
            ...tokens,
        });
    }
    catch (err) {
        next(err);
    }
});
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { email }, include: { farmer: true } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const tokens = signTokens(user.id, user.role);
        res.json({
            user: {
                id: user.id, name: user.name, email: user.email, role: user.role,
                farmerId: user.farmer?.farmerId,
            },
            ...tokens,
        });
    }
    catch (err) {
        next(err);
    }
});
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ error: 'No refresh token' });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const tokens = signTokens(payload.userId, payload.role);
        res.json(tokens);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
