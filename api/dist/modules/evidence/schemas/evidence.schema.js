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
exports.EvidenceSchema = exports.Evidence = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const processing_status_enum_1 = require("../enums/processing-status.enum");
const integrity_status_enum_1 = require("../enums/integrity-status.enum");
const evidence_status_enum_1 = require("../enums/evidence-status.enum");
const case_schema_1 = require("../../cases/schemas/case.schema");
const user_schema_1 = require("../../auth/schemas/user.schema");
let Evidence = class Evidence {
};
exports.Evidence = Evidence;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: case_schema_1.Case.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Evidence.prototype, "caseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        index: true,
        uppercase: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "evidenceNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "originalFilename", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "storageKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        lowercase: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "mimeType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        min: 0,
    }),
    __metadata("design:type", Number)
], Evidence.prototype, "fileSize", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        min: 0,
    }),
    __metadata("design:type", Number)
], Evidence.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "sha256", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        lowercase: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "md5", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: user_schema_1.User.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Evidence.prototype, "uploadedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: Date.now,
        index: true,
    }),
    __metadata("design:type", Date)
], Evidence.prototype, "uploadedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(processing_status_enum_1.ProcessingStatus),
        default: processing_status_enum_1.ProcessingStatus.PENDING,
        index: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "processingStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(integrity_status_enum_1.IntegrityStatus),
        default: integrity_status_enum_1.IntegrityStatus.VERIFIED,
        index: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "integrityStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        default: {},
    }),
    __metadata("design:type", Object)
], Evidence.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "storageBucket", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(evidence_status_enum_1.EvidenceStatus),
        default: evidence_status_enum_1.EvidenceStatus.UPLOADED,
        index: true,
    }),
    __metadata("design:type", String)
], Evidence.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: false,
        index: true,
    }),
    __metadata("design:type", Boolean)
], Evidence.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: null,
    }),
    __metadata("design:type", Date)
], Evidence.prototype, "deletedAt", void 0);
exports.Evidence = Evidence = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'evidence',
    })
], Evidence);
exports.EvidenceSchema = mongoose_1.SchemaFactory.createForClass(Evidence);
exports.EvidenceSchema.index({ caseId: 1, sha256: 1 });
exports.EvidenceSchema.index({ isDeleted: 1, processingStatus: 1, createdAt: -1 });
//# sourceMappingURL=evidence.schema.js.map