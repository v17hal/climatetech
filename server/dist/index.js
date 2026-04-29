"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const farmers_1 = __importDefault(require("./routes/farmers"));
const carbon_1 = __importDefault(require("./routes/carbon"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const audit_1 = __importDefault(require("./routes/audit"));
const errorHandler_1 = require("./middleware/errorHandler");
const auditLog_1 = require("./middleware/auditLog");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true }));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
/* Rate limiting */
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please try again in 15 minutes' },
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts — please try again in 15 minutes' },
});
app.use('/api/', limiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
/* Audit logging */
app.use(auditLog_1.auditMiddleware);
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/farmers', farmers_1.default);
app.use('/api/v1/carbon', carbon_1.default);
app.use('/api/v1/dashboard', dashboard_1.default);
app.use('/api/v1/alerts', alerts_1.default);
app.use('/api/v1/inventory', inventory_1.default);
app.use('/api/v1/audit', audit_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'CarbonSmart API', version: '1.0.0' });
});
/* Serve frontend static files */
const clientBuildPath = path_1.default.join(__dirname, '../..', 'client', 'dist');
app.use(express_1.default.static(clientBuildPath));
/* SPA fallback: serve index.html for all non-API routes */
app.get(/.*/, (_req, res) => {
    res.sendFile(path_1.default.join(clientBuildPath, 'index.html'));
});
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🌱 CarbonSmart API running on http://localhost:${PORT}`);
});
exports.default = app;
