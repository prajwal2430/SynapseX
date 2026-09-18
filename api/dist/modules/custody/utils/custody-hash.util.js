"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalStringify = canonicalStringify;
exports.computeCustodyRecordHash = computeCustodyRecordHash;
const crypto = require("crypto");
function canonicalStringify(obj) {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return `[${obj.map((item) => canonicalStringify(item)).join(',')}]`;
    }
    const sortedKeys = Object.keys(obj).sort();
    const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`);
    return `{${pairs.join(',')}}`;
}
function computeCustodyRecordHash(payload) {
    const timestampIso = payload.timestamp instanceof Date
        ? payload.timestamp.toISOString()
        : new Date(payload.timestamp).toISOString();
    const canonicalPayload = [
        `evidenceId:${payload.evidenceId}`,
        `caseId:${payload.caseId}`,
        `action:${payload.action}`,
        `actorId:${payload.actorId}`,
        `timestamp:${timestampIso}`,
        `sequenceNumber:${payload.sequenceNumber}`,
        `previousRecordHash:${payload.previousRecordHash}`,
        `metadata:${canonicalStringify(payload.metadata || {})}`,
    ].join('|');
    return crypto
        .createHash('sha256')
        .update(canonicalPayload, 'utf8')
        .digest('hex');
}
//# sourceMappingURL=custody-hash.util.js.map