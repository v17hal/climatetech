"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auditLog_1 = require("../middleware/auditLog");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.requireRole)('admin'));
router.get('/', (_req, res) => {
    res.json({ entries: auditLog_1.auditLog, total: auditLog_1.auditLog.length });
});
router.get('/user/:userId', (req, res) => {
    const entries = auditLog_1.auditLog.filter((e) => e.userId === req.params.userId);
    res.json({ entries, total: entries.length });
});
exports.default = router;
