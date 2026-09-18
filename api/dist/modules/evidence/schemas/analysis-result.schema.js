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
exports.AnalysisResultSchema = exports.AnalysisResult = exports.ExtractedEntityRecordSchema = exports.ExtractedEntityRecord = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const case_schema_1 = require("../../cases/schemas/case.schema");
const evidence_schema_1 = require("./evidence.schema");
let ExtractedEntityRecord = class ExtractedEntityRecord {
};
exports.ExtractedEntityRecord = ExtractedEntityRecord;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ExtractedEntityRecord.prototype, "entityType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ExtractedEntityRecord.prototype, "entityValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ExtractedEntityRecord.prototype, "normalizedValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1.0 }),
    __metadata("design:type", Number)
], ExtractedEntityRecord.prototype, "confidence", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ExtractedEntityRecord.prototype, "evidenceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ExtractedEntityRecord.prototype, "eventId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ExtractedEntityRecord.prototype, "context", void 0);
exports.ExtractedEntityRecord = ExtractedEntityRecord = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ExtractedEntityRecord);
exports.ExtractedEntityRecordSchema = mongoose_1.SchemaFactory.createForClass(ExtractedEntityRecord);
let AnalysisResult = class AnalysisResult {
};
exports.AnalysisResult = AnalysisResult;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: case_schema_1.Case.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AnalysisResult.prototype, "caseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: evidence_schema_1.Evidence.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AnalysisResult.prototype, "evidenceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        index: true,
        trim: true,
    }),
    __metadata("design:type", String)
], AnalysisResult.prototype, "jobId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['COMPLETED', 'FAILED'],
        default: 'COMPLETED',
        index: true,
    }),
    __metadata("design:type", String)
], AnalysisResult.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [exports.ExtractedEntityRecordSchema],
        default: [],
    }),
    __metadata("design:type", Array)
], AnalysisResult.prototype, "entities", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        default: {},
    }),
    __metadata("design:type", Object)
], AnalysisResult.prototype, "entityCounts", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: 0,
    }),
    __metadata("design:type", Number)
], AnalysisResult.prototype, "totalEntities", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: 0,
    }),
    __metadata("design:type", Number)
], AnalysisResult.prototype, "executionTimeMs", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        trim: true,
    }),
    __metadata("design:type", String)
], AnalysisResult.prototype, "error", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        default: {},
    }),
    __metadata("design:type", Object)
], AnalysisResult.prototype, "metadata", void 0);
exports.AnalysisResult = AnalysisResult = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'analysis_results',
    })
], AnalysisResult);
exports.AnalysisResultSchema = mongoose_1.SchemaFactory.createForClass(AnalysisResult);
exports.AnalysisResultSchema.index({ evidenceId: 1, createdAt: -1 });
exports.AnalysisResultSchema.index({ caseId: 1, createdAt: -1 });
//# sourceMappingURL=analysis-result.schema.js.map