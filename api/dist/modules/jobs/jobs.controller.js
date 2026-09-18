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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jobs_service_1 = require("./jobs.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let JobsController = class JobsController {
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    async getJobStatus(queueName, jobId) {
        return this.jobsService.getJobStatus(queueName, jobId);
    }
    async getEvidenceJobStatus(evidenceId) {
        const job = await this.jobsService.getEvidenceJobStatus(evidenceId);
        if (!job) {
            throw new common_1.NotFoundException(`No background processing job found for evidence '${evidenceId}'`);
        }
        return job;
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Get)(':queueName/:jobId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Track status and retry progress of a background BullMQ job',
        description: 'Queries active, waiting, completed, or failed state, retry attempts made, exponential backoff status, and failure reason.',
    }),
    (0, swagger_1.ApiParam)({ name: 'queueName', example: 'evidence-processing', description: 'Name of the target BullMQ queue' }),
    (0, swagger_1.ApiParam)({ name: 'jobId', example: 'evidence-66da8123-1772761500000', description: 'Job identifier' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Job execution status details',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found in specified queue' }),
    __param(0, (0, common_1.Param)('queueName')),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getJobStatus", null);
__decorate([
    (0, common_1.Get)('evidence/:evidenceId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve background processing job details for an evidence artifact',
        description: 'Finds the latest background job associated with the specified evidence item.',
    }),
    (0, swagger_1.ApiParam)({ name: 'evidenceId', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence processing job status',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No processing job found for this evidence' }),
    __param(0, (0, common_1.Param)('evidenceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getEvidenceJobStatus", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('Jobs & Asynchronous Queues'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ version: '1', path: 'jobs' }),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map