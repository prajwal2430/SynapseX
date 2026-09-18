"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEntityValue = normalizeEntityValue;
const entity_type_enum_1 = require("../enums/entity-type.enum");
function normalizeEntityValue(type, rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
        return '';
    }
    const clean = rawValue.trim();
    switch (type) {
        case entity_type_enum_1.EntityType.EMAIL:
            return clean.toLowerCase();
        case entity_type_enum_1.EntityType.DOMAIN: {
            let domain = clean.toLowerCase();
            domain = domain.replace(/^https?:\/\//i, '');
            domain = domain.split('/')[0];
            domain = domain.split(':')[0];
            domain = domain.replace(/^www\./i, '');
            domain = domain.replace(/\.$/, '');
            return domain.trim();
        }
        case entity_type_enum_1.EntityType.IP_ADDRESS: {
            let ip = clean.toLowerCase();
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
                ip = ip.split(':')[0];
            }
            return ip.trim();
        }
        case entity_type_enum_1.EntityType.USER: {
            let user = clean.toLowerCase();
            if (user.includes('\\')) {
                const parts = user.split('\\');
                user = parts[parts.length - 1];
            }
            return user.trim();
        }
        case entity_type_enum_1.EntityType.DEVICE:
            return clean.toUpperCase().replace(/\s+/g, ' ');
        case entity_type_enum_1.EntityType.FILE:
            return clean.replace(/\\/g, '/');
        case entity_type_enum_1.EntityType.PERSON:
            return clean.replace(/\s+/g, ' ');
        case entity_type_enum_1.EntityType.LOCATION:
            return clean.replace(/\s+/g, ' ');
        default:
            return clean;
    }
}
//# sourceMappingURL=entity-normalizer.js.map