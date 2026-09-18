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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const timeline_service_1 = require("./timeline.service");
const timeline_query_dto_1 = require("./dto/timeline-query.dto");
const timeline_event_response_dto_1 = require("./dto/timeline-event-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const auth_response_dto_1 = require("../auth/dto/auth-response.dto");
const role_enum_1 = require("../../common/enums/role.enum");
let TimelineController = class TimelineController {
    constructor(timelineService) {
        this.timelineService = timelineService;
    }
    async findByCase(caseId, query, currentUser) {
        return this.timelineService.findByCaseId(caseId, query, currentUser);
    }
    async findById(id, currentUser) {
        return this.timelineService.findById(id, currentUser);
    }
};
exports.TimelineController = TimelineController;
__decorate([
    (0, common_1.Get)('cases/:caseId/timeline'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve chronologically ordered timeline events for a case',
        description: 'Fetches timeline events normalized to UTC with preserved source timestamps, supporting date-range filtering, text search, sorting, and pagination.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'Case MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated timeline events retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Insufficient case permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, timeline_query_dto_1.TimelineQueryDto,
        auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], TimelineController.prototype, "findByCase", null);
__decorate([
    (0, common_1.Get)('timeline-events/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve single timeline event by ID',
        description: 'Fetches timeline event record with original and UTC normalized timestamps, associated entities, and source metadata.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Timeline Event MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Timeline event retrieved successfully',
        type: timeline_event_response_dto_1.TimelineEventResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: User not authorized for this case' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Timeline event not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], TimelineController.prototype, "findById", null);
exports.TimelineController = TimelineController = __decorate([
    (0, swagger_1.ApiTags)('Timeline'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ version: '1' }),
    __metadata("design:paramtypes", [timeline_service_1.TimelineService])
], TimelineController);
//# sourceMappingURL=timeline.controller.js.map