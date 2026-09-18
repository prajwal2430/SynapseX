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
exports.TimelineEventSchema = exports.TimelineEvent = exports.TimelineAssociatedEntitySchema = exports.TimelineAssociatedEntity = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const case_schema_1 = require("../../cases/schemas/case.schema");
const evidence_schema_1 = require("../../evidence/schemas/evidence.schema");
let TimelineAssociatedEntity = class TimelineAssociatedEntity {
};
exports.TimelineAssociatedEntity = TimelineAssociatedEntity;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], TimelineAssociatedEntity.prototype, "entityType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], TimelineAssociatedEntity.prototype, "entityValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], TimelineAssociatedEntity.prototype, "normalizedValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], TimelineAssociatedEntity.prototype, "entityId", void 0);
exports.TimelineAssociatedEntity = TimelineAssociatedEntity = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], TimelineAssociatedEntity);
exports.TimelineAssociatedEntitySchema = mongoose_1.SchemaFactory.createForClass(TimelineAssociatedEntity);
let TimelineEvent = class TimelineEvent {
};
exports.TimelineEvent = TimelineEvent;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: case_schema_1.Case.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TimelineEvent.prototype, "caseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: evidence_schema_1.Evidence.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TimelineEvent.prototype, "evidenceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], TimelineEvent.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        default: 'UTC',
    }),
    __metadata("design:type", String)
], TimelineEvent.prototype, "timezone", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        required: true,
        index: true,
    }),
    __metadata("design:type", Date)
], TimelineEvent.prototype, "normalizedTimestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], TimelineEvent.prototype, "eventType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], TimelineEvent.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: '',
        trim: true,
    }),
    __metadata("design:type", String)
], TimelineEvent.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
    }),
    __metadata("design:type", String)
], TimelineEvent.prototype, "source", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [exports.TimelineAssociatedEntitySchema],
        default: [],
    }),
    __metadata("design:type", Array)
], TimelineEvent.prototype, "entities", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        default: {},
    }),
    __metadata("design:type", Object)
], TimelineEvent.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: Date.now,
        index: true,
    }),
    __metadata("design:type", Date)
], TimelineEvent.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: Date.now,
    }),
    __metadata("design:type", Date)
], TimelineEvent.prototype, "updatedAt", void 0);
exports.TimelineEvent = TimelineEvent = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'timeline_events',
    })
], TimelineEvent);
exports.TimelineEventSchema = mongoose_1.SchemaFactory.createForClass(TimelineEvent);
exports.TimelineEventSchema.index({ caseId: 1, normalizedTimestamp: 1 });
exports.TimelineEventSchema.index({ caseId: 1, eventType: 1 });
exports.TimelineEventSchema.index({ caseId: 1, evidenceId: 1 });
exports.TimelineEventSchema.index({ caseId: 1, source: 1 });
//# sourceMappingURL=timeline-event.schema.js.map