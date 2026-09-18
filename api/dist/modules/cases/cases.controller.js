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
exports.CasesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cases_service_1 = require("./cases.service");
const create_case_dto_1 = require("./dto/create-case.dto");
const update_case_dto_1 = require("./dto/update-case.dto");
const case_query_dto_1 = require("./dto/case-query.dto");
const case_response_dto_1 = require("./dto/case-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const auth_response_dto_1 = require("../auth/dto/auth-response.dto");
const role_enum_1 = require("../../common/enums/role.enum");
let CasesController = class CasesController {
    constructor(casesService) {
        this.casesService = casesService;
    }
    async create(createCaseDto, currentUser) {
        return this.casesService.create(createCaseDto, currentUser);
    }
    async findAll(query) {
        return this.casesService.findAll(query);
    }
    async findById(id) {
        return this.casesService.findById(id);
    }
    async update(id, updateCaseDto, currentUser) {
        return this.casesService.update(id, updateCaseDto, currentUser);
    }
    async delete(id, currentUser) {
        return this.casesService.delete(id, currentUser);
    }
};
exports.CasesController = CasesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new forensic case',
        description: 'Generates auto-incremented caseNumber (e.g. CASE-2026-0001) and assigns the creator to the case.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Case successfully created',
        type: case_response_dto_1.CaseResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation failed on input parameters',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - invalid or missing JWT token',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - VIEWER role cannot create cases',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_case_dto_1.CreateCaseDto,
        auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'List cases with pagination, search, filters, and sorting',
        description: 'Retrieves non-deleted cases. Supports regex search on title/description/caseNumber, plus status and priority filters.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of cases returned successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - invalid or missing JWT token',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [case_query_dto_1.CaseQueryDto]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve case details by ID',
        description: 'Retrieves full case details with populated creator and assigned investigators.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the case' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Case details retrieved successfully',
        type: case_response_dto_1.CaseResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Case not found or deleted',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Update case information, lifecycle status, or assignees',
        description: 'ADMIN can update any case. INVESTIGATOR can only update cases assigned to them.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the case' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Case successfully updated',
        type: case_response_dto_1.CaseResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation failed on input parameters',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - Investigator not assigned to this case or VIEWER attempting update',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Case not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_case_dto_1.UpdateCaseDto,
        auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft-delete a case',
        description: 'Marks case as deleted and sets deletedAt timestamp. ADMIN can delete any case; INVESTIGATOR can only delete assigned cases.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the case to soft-delete' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Case successfully soft-deleted',
        type: case_response_dto_1.DeleteCaseResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - cannot delete case not assigned to you',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Case not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "delete", null);
exports.CasesController = CasesController = __decorate([
    (0, swagger_1.ApiTags)('Cases'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ path: 'cases', version: '1' }),
    __metadata("design:paramtypes", [cases_service_1.CasesService])
], CasesController);
//# sourceMappingURL=cases.controller.js.map