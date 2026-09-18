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
exports.FindingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const findings_service_1 = require("./findings.service");
const review_finding_dto_1 = require("./dto/review-finding.dto");
const finding_query_dto_1 = require("./dto/finding-query.dto");
const finding_response_dto_1 = require("./dto/finding-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const auth_response_dto_1 = require("../auth/dto/auth-response.dto");
const role_enum_1 = require("../../common/enums/role.enum");
let FindingsController = class FindingsController {
    constructor(findingsService) {
        this.findingsService = findingsService;
    }
    async approve(id, dto, currentUser, ipAddress, userAgent) {
        return this.findingsService.approveFinding(id, dto, currentUser, {
            ip: ipAddress,
            userAgent,
        });
    }
    async reject(id, dto, currentUser, ipAddress, userAgent) {
        return this.findingsService.rejectFinding(id, dto, currentUser, {
            ip: ipAddress,
            userAgent,
        });
    }
    async findByCase(caseId, query, currentUser) {
        return this.findingsService.findByCaseId(caseId, query, currentUser);
    }
    async findById(id, currentUser) {
        return this.findingsService.findById(id, currentUser);
    }
};
exports.FindingsController = FindingsController;
__decorate([
    (0, common_1.Post)('findings/:id/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.REVIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Approve an AI-generated forensic finding',
        description: 'Transition finding reviewStatus to APPROVED with reviewer credentials and comment. Only accessible by REVIEWER or ADMIN. Records decision in the audit log.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Finding MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Finding successfully approved',
        type: finding_response_dto_1.FindingResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Requires REVIEWER or ADMIN role' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Finding not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Ip)()),
    __param(4, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_finding_dto_1.ReviewFindingDto,
        auth_response_dto_1.UserProfileDto, String, String]),
    __metadata("design:returntype", Promise)
], FindingsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('findings/:id/reject'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.REVIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Reject an AI-generated forensic finding',
        description: 'Transition finding reviewStatus to REJECTED with reviewer rationale. Only accessible by REVIEWER or ADMIN. Records decision in the audit log.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Finding MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Finding successfully rejected',
        type: finding_response_dto_1.FindingResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Requires REVIEWER or ADMIN role' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Finding not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Ip)()),
    __param(4, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_finding_dto_1.ReviewFindingDto,
        auth_response_dto_1.UserProfileDto, String, String]),
    __metadata("design:returntype", Promise)
], FindingsController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('cases/:caseId/findings'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve paginated and filtered findings for a case',
        description: 'Fetches forensic findings for a case with filtering by reviewStatus (PENDING_REVIEW, APPROVED, REJECTED), findingType, confidenceScore, evidenceStrength, and search.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'Case MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated findings retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: Insufficient case permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finding_query_dto_1.FindingQueryDto,
        auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], FindingsController.prototype, "findByCase", null);
__decorate([
    (0, common_1.Get)('findings/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve single forensic finding by ID',
        description: 'Fetches detailed finding record including supporting evidence, entities, reasoning, and review status.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Finding MongoDB ObjectId' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Finding details retrieved successfully',
        type: finding_response_dto_1.FindingResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden: User not authorized for this case' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Finding not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], FindingsController.prototype, "findById", null);
exports.FindingsController = FindingsController = __decorate([
    (0, swagger_1.ApiTags)('Findings & Human Review'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ version: '1' }),
    __metadata("design:paramtypes", [findings_service_1.FindingsService])
], FindingsController);
//# sourceMappingURL=findings.controller.js.map