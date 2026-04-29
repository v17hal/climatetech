"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
exports.auditMiddleware = auditMiddleware;
/* In-memory store for demo — replace with DB insert in production */
exports.auditLog = [];
function auditMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        if (!req.userId) {
            next();
            return;
        }
        const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || 'unknown');
        const resourceId = Array.isArray(req.params?.id) ? req.params.id[0] : req.params?.id;
        const entry = {
            id: crypto.randomUUID(),
            userId: req.userId ?? 'anonymous',
            userRole: req.userRole ?? 'unknown',
            action: resolveAction(req.method, req.path),
            resource: resolveResource(req.path),
            resourceId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            ip: ipAddress,
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - start,
        };
        exports.auditLog.unshift(entry);
        if (exports.auditLog.length > 500)
            exports.auditLog.pop();
    });
    next();
}
function resolveAction(method, path) {
    if (method === 'GET')
        return 'view';
    if (method === 'POST')
        return path.includes('login') ? 'login' : path.includes('register') ? 'register' : 'create';
    if (method === 'PUT' || method === 'PATCH')
        return 'update';
    if (method === 'DELETE')
        return 'delete';
    return 'action';
}
function resolveResource(path) {
    const parts = path.split('/').filter(Boolean);
    return parts[2] ?? parts[1] ?? 'unknown';
}
