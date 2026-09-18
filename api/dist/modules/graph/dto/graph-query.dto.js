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
exports.FindPathQueryDto = exports.NeighborsQueryDto = exports.GraphQueryDto = exports.GraphDirection = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var GraphDirection;
(function (GraphDirection) {
    GraphDirection["BOTH"] = "BOTH";
    GraphDirection["IN"] = "IN";
    GraphDirection["OUT"] = "OUT";
})(GraphDirection || (exports.GraphDirection = GraphDirection = {}));
class GraphQueryDto {
    constructor() {
        this.limit = 100;
    }
}
exports.GraphQueryDto = GraphQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Comma-separated node labels to filter (e.g., Person,IPAddress,Evidence)',
        example: 'Person,IPAddress',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GraphQueryDto.prototype, "labels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Comma-separated relationship types to filter (e.g., APPEARED_IN,USED)',
        example: 'APPEARED_IN,USED',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GraphQueryDto.prototype, "relationshipTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Maximum number of nodes and relationships to return (default: 100, max: 500)',
        default: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], GraphQueryDto.prototype, "limit", void 0);
class NeighborsQueryDto {
    constructor() {
        this.depth = 1;
        this.direction = GraphDirection.BOTH;
    }
}
exports.NeighborsQueryDto = NeighborsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Hop depth for neighborhood expansion (1 to 3, default: 1)',
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], NeighborsQueryDto.prototype, "depth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Traversal direction',
        enum: GraphDirection,
        default: GraphDirection.BOTH,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(GraphDirection),
    __metadata("design:type", String)
], NeighborsQueryDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Comma-separated relationship types to traverse',
        example: 'APPEARED_IN,CONNECTED_TO',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NeighborsQueryDto.prototype, "relationshipTypes", void 0);
class FindPathQueryDto {
    constructor() {
        this.maxHops = 5;
    }
}
exports.FindPathQueryDto = FindPathQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Origin node sourceId or graph node ID',
        example: '64bf9c0e5a9c2b3d8f1e4a10',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindPathQueryDto.prototype, "fromNodeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Target node sourceId or graph node ID',
        example: '64bf9c0e5a9c2b3d8f1e4a20',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindPathQueryDto.prototype, "toNodeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Maximum traversal hops for path finding (1 to 10, default: 5)',
        default: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], FindPathQueryDto.prototype, "maxHops", void 0);
//# sourceMappingURL=graph-query.dto.js.map