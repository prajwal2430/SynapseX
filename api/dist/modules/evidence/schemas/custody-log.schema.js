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
exports.CustodyLogSchema = exports.CustodyLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const custody_action_enum_1 = require("../enums/custody-action.enum");
const evidence_schema_1 = require("./evidence.schema");
const case_schema_1 = require("../../cases/schemas/case.schema");
const user_schema_1 = require("../../auth/schemas/user.schema");
let CustodyLog = class CustodyLog {
};
exports.CustodyLog = CustodyLog;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: evidence_schema_1.Evidence.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CustodyLog.prototype, "evidenceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: case_schema_1.Case.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CustodyLog.prototype, "caseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(custody_action_enum_1.CustodyAction),
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], CustodyLog.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: user_schema_1.User.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], CustodyLog.prototype, "performedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        lowercase: true,
        trim: true,
    }),
    __metadata("design:type", String)
], CustodyLog.prototype, "sha256AtAction", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], CustodyLog.prototype, "details", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        trim: true,
    }),
    __metadata("design:type", String)
], CustodyLog.prototype, "ipAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        trim: true,
    }),
    __metadata("design:type", String)
], CustodyLog.prototype, "userAgent", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: Date.now,
        index: true,
    }),
    __metadata("design:type", Date)
], CustodyLog.prototype, "timestamp", void 0);
exports.CustodyLog = CustodyLog = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: { createdAt: true, updatedAt: false },
        collection: 'custody_logs',
    })
], CustodyLog);
exports.CustodyLogSchema = mongoose_1.SchemaFactory.createForClass(CustodyLog);
exports.CustodyLogSchema.index({ evidenceId: 1, timestamp: -1 });
exports.CustodyLogSchema.index({ caseId: 1, timestamp: -1 });
//# sourceMappingURL=custody-log.schema.js.map