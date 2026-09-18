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
exports.CaseSchema = exports.Case = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const case_status_enum_1 = require("../enums/case-status.enum");
const case_priority_enum_1 = require("../enums/case-priority.enum");
const user_schema_1 = require("../../auth/schemas/user.schema");
let Case = class Case {
};
exports.Case = Case;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        index: true,
        uppercase: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "caseNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(case_status_enum_1.CaseStatus),
        default: case_status_enum_1.CaseStatus.OPEN,
        index: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(case_priority_enum_1.CasePriority),
        default: case_priority_enum_1.CasePriority.MEDIUM,
        index: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: user_schema_1.User.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Case.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{ type: mongoose_2.Types.ObjectId, ref: user_schema_1.User.name }],
        default: [],
        index: true,
    }),
    __metadata("design:type", Array)
], Case.prototype, "assignedUsers", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [String],
        default: [],
        index: true,
    }),
    __metadata("design:type", Array)
], Case.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: false,
        index: true,
    }),
    __metadata("design:type", Boolean)
], Case.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: null,
    }),
    __metadata("design:type", Date)
], Case.prototype, "deletedAt", void 0);
exports.Case = Case = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'cases',
    })
], Case);
exports.CaseSchema = mongoose_1.SchemaFactory.createForClass(Case);
exports.CaseSchema.index({ isDeleted: 1, status: 1, priority: 1, createdAt: -1 });
//# sourceMappingURL=case.schema.js.map