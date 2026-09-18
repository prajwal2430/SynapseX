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
exports.EntitySchema = exports.Entity = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const case_schema_1 = require("../../cases/schemas/case.schema");
const evidence_schema_1 = require("../../evidence/schemas/evidence.schema");
const entity_type_enum_1 = require("../enums/entity-type.enum");
let Entity = class Entity {
};
exports.Entity = Entity;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: case_schema_1.Case.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Entity.prototype, "caseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: evidence_schema_1.Evidence.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Entity.prototype, "evidenceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(entity_type_enum_1.EntityType),
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], Entity.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Entity.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], Entity.prototype, "normalizedValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        min: 0,
        max: 1,
        default: 1.0,
    }),
    __metadata("design:type", Number)
], Entity.prototype, "confidence", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], Entity.prototype, "source", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        default: 'AI_ANALYSIS',
    }),
    __metadata("design:type", String)
], Entity.prototype, "extractionMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'],
        default: 'MEDIUM',
    }),
    __metadata("design:type", String)
], Entity.prototype, "evidenceStrength", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        default: {},
    }),
    __metadata("design:type", Object)
], Entity.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: Date.now,
        index: true,
    }),
    __metadata("design:type", Date)
], Entity.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: Date.now,
    }),
    __metadata("design:type", Date)
], Entity.prototype, "updatedAt", void 0);
exports.Entity = Entity = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'entities',
    })
], Entity);
exports.EntitySchema = mongoose_1.SchemaFactory.createForClass(Entity);
exports.EntitySchema.index({ caseId: 1, evidenceId: 1, type: 1, normalizedValue: 1 }, { unique: true });
exports.EntitySchema.index({ caseId: 1, type: 1, normalizedValue: 1 });
exports.EntitySchema.index({ caseId: 1, createdAt: -1 });
exports.EntitySchema.index({ caseId: 1, confidence: -1 });
//# sourceMappingURL=entity.schema.js.map