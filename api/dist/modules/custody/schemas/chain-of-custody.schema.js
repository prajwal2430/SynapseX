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
exports.ChainOfCustodySchema = exports.ChainOfCustody = exports.GENESIS_HASH = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const custody_action_enum_1 = require("../enums/custody-action.enum");
const case_schema_1 = require("../../cases/schemas/case.schema");
const user_schema_1 = require("../../auth/schemas/user.schema");
exports.GENESIS_HASH = 'GENESIS';
let ChainOfCustody = class ChainOfCustody {
};
exports.ChainOfCustody = ChainOfCustody;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'Evidence',
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChainOfCustody.prototype, "evidenceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: case_schema_1.Case.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChainOfCustody.prototype, "caseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(custody_action_enum_1.CustodyAction),
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], ChainOfCustody.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: user_schema_1.User.name,
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChainOfCustody.prototype, "actorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    }),
    __metadata("design:type", Date)
], ChainOfCustody.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Number,
        required: true,
        min: 1,
        index: true,
    }),
    __metadata("design:type", Number)
], ChainOfCustody.prototype, "sequenceNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        default: {},
    }),
    __metadata("design:type", Object)
], ChainOfCustody.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        index: true,
        trim: true,
    }),
    __metadata("design:type", String)
], ChainOfCustody.prototype, "previousRecordHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
    }),
    __metadata("design:type", String)
], ChainOfCustody.prototype, "recordHash", void 0);
exports.ChainOfCustody = ChainOfCustody = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: false,
        collection: 'chain_of_custody',
        versionKey: false,
    })
], ChainOfCustody);
exports.ChainOfCustodySchema = mongoose_1.SchemaFactory.createForClass(ChainOfCustody);
exports.ChainOfCustodySchema.index({ evidenceId: 1, sequenceNumber: 1 }, { unique: true });
exports.ChainOfCustodySchema.index({ evidenceId: 1, timestamp: 1 });
const blockUpdate = function (next) {
    next(new Error('ChainOfCustody records are append-only and strictly immutable; updates are prohibited.'));
};
exports.ChainOfCustodySchema.pre('updateOne', blockUpdate);
exports.ChainOfCustodySchema.pre('updateMany', blockUpdate);
exports.ChainOfCustodySchema.pre('findOneAndUpdate', blockUpdate);
exports.ChainOfCustodySchema.pre('replaceOne', blockUpdate);
const blockDelete = function (next) {
    next(new Error('ChainOfCustody records are append-only and strictly immutable; deletions are prohibited.'));
};
exports.ChainOfCustodySchema.pre('deleteOne', blockDelete);
exports.ChainOfCustodySchema.pre('deleteMany', blockDelete);
exports.ChainOfCustodySchema.pre('findOneAndDelete', blockDelete);
//# sourceMappingURL=chain-of-custody.schema.js.map