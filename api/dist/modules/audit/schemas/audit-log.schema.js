"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogSchema = exports.AuditLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../auth/schemas/user.schema");
let AuditLog = class AuditLog {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: user_schema_1.User.name,
        required: false,
        default: null,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        default: null,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    }),
    __metadata("design:type", Date)
], AuditLog.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        default: null,
        trim: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        default: null,
        trim: true,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        default: {},
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: false,
        collection: 'audit_logs',
        versionKey: false,
    })
], AuditLog);
exports.AuditLogSchema = mongoose_1.SchemaFactory.createForClass(AuditLog);
exports.AuditLogSchema.index({ timestamp: -1, action: 1 });
exports.AuditLogSchema.index({ userId: 1, timestamp: -1 });
exports.AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
const blockUpdate = function (next) {
    next(new Error('Audit logs are append-only and strictly immutable; updates are prohibited.'));
};
exports.AuditLogSchema.pre('updateOne', blockUpdate);
exports.AuditLogSchema.pre('updateMany', blockUpdate);
exports.AuditLogSchema.pre('findOneAndUpdate', blockUpdate);
exports.AuditLogSchema.pre('replaceOne', blockUpdate);
const blockDelete = function (next) {
    next(new Error('Audit logs are append-only and strictly immutable; deletions are prohibited.'));
};
exports.AuditLogSchema.pre('deleteOne', blockDelete);
exports.AuditLogSchema.pre('deleteMany', blockDelete);
exports.AuditLogSchema.pre('findOneAndDelete', blockDelete);
//# sourceMappingURL=audit-log.schema.js.map