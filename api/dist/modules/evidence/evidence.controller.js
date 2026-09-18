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
exports.EvidenceController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const evidence_service_1 = require("./evidence.service");
const upload_evidence_dto_1 = require("./dto/upload-evidence.dto");
const evidence_response_dto_1 = require("./dto/evidence-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const auth_response_dto_1 = require("../auth/dto/auth-response.dto");
const role_enum_1 = require("../../common/enums/role.enum");
let EvidenceController = class EvidenceController {
    constructor(evidenceService) {
        this.evidenceService = evidenceService;
    }
    async uploadEvidence(caseId, file, dto, currentUser, ipAddress, userAgent) {
        return this.evidenceService.uploadAndIngest(file, caseId, dto, currentUser, { ip: ipAddress, userAgent });
    }
    async getCaseEvidence(caseId, currentUser) {
        return this.evidenceService.findByCaseId(caseId, currentUser);
    }
    async getEvidenceById(id, currentUser) {
        return this.evidenceService.findById(id, currentUser);
    }
    async deleteEvidence(id, currentUser, ipAddress, userAgent) {
        return this.evidenceService.deleteEvidence(id, currentUser, {
            ip: ipAddress,
            userAgent,
        });
    }
    async downloadEvidence(id, currentUser, ipAddress, userAgent, res) {
        const fileResult = await this.evidenceService.getDownloadStream(id, currentUser, {
            ip: ipAddress,
            userAgent,
        });
        const safeFilename = encodeURIComponent(fileResult.originalFilename);
        res.set({
            'Content-Type': fileResult.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
            'Content-Length': fileResult.fileSize,
            'X-Content-Type-Options': 'nosniff',
        });
        fileResult.stream.pipe(res);
    }
    async getSecureDownloadUrl(id, currentUser, ipAddress, userAgent) {
        return this.evidenceService.getSecureDownloadUrl(id, currentUser, 3600, {
            ip: ipAddress,
            userAgent,
        });
    }
    async verifyIntegrity(id, currentUser, ipAddress, userAgent) {
        return this.evidenceService.verifyIntegrity(id, currentUser, {
            ip: ipAddress,
            userAgent,
        });
    }
    async getAnalysis(id, currentUser) {
        return this.evidenceService.getAnalysisResult(id, currentUser);
    }
};
exports.EvidenceController = EvidenceController;
__decorate([
    (0, common_1.Post)('cases/:caseId/evidence'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload evidence artifact into secure storage abstraction',
        description: 'Validates file size and MIME type, verifies case ownership, generates SHA-256 digest, stores binary via storage abstraction layer (MinIO/S3), saves metadata, logs custody entry, and queues for processing.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'MongoDB ObjectId of the target case' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file', 'source'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Forensic evidence file (disk image, log, packet capture, document)',
                },
                source: {
                    type: 'string',
                    example: 'Workstation WKSTN-892 NVMe Image',
                },
                description: {
                    type: 'string',
                    example: 'Acquired during initial incident response triage.',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['disk-image', 'nvme'],
                },
                metadata: {
                    type: 'object',
                    example: { examiner: 'Alex Mercer', hardware: 'Dell Precision' },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Evidence successfully ingested and stored with SHA-256 fingerprint',
        type: evidence_response_dto_1.EvidenceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'File validation failed (size, extension, or MIME type)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - User not authorized for this case' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }),
        ],
    }))),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __param(4, (0, common_1.Ip)()),
    __param(5, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, upload_evidence_dto_1.UploadEvidenceDto,
        auth_response_dto_1.UserProfileDto, String, String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "uploadEvidence", null);
__decorate([
    (0, common_1.Get)('cases/:caseId/evidence'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'List all evidence items associated with a case',
        description: 'Returns all non-deleted forensic artifacts ingested for the given case. Requires case access.',
    }),
    (0, swagger_1.ApiParam)({ name: 'caseId', description: 'MongoDB ObjectId of the case' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of evidence artifacts',
        type: [evidence_response_dto_1.EvidenceResponseDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - User not authorized for this case' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Case not found' }),
    __param(0, (0, common_1.Param)('caseId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getCaseEvidence", null);
__decorate([
    (0, common_1.Get)('evidence/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve metadata for a specific evidence item',
        description: 'Returns evidence metadata including processing status, integrity status, SHA-256, and storage key.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence metadata retrieved successfully',
        type: evidence_response_dto_1.EvidenceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getEvidenceById", null);
__decorate([
    (0, common_1.Delete)('evidence/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft-delete an evidence item and log custody disposition',
        description: 'Soft-deletes the evidence artifact and writes a DISPOSED record to the custody ledger. Only ADMIN or assigned INVESTIGATOR can delete.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Evidence soft-deleted successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Evidence EV-2026-0001 was successfully removed' },
                evidenceId: { type: 'string', example: '66da81234abcd5678ef05678' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - User cannot manage this evidence' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto, String, String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "deleteEvidence", null);
__decorate([
    (0, common_1.Get)('evidence/:id/download'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'Securely download evidence file directly through authenticated backend stream',
        description: 'Requires authentication and case access. Streams binary directly from storage layer without exposing public storage URLs. Logs custody action ACCESSED.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Binary evidence stream',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - User not authorized for this case' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "downloadEvidence", null);
__decorate([
    (0, common_1.Get)('evidence/:id/download-url'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate a short-lived secure presigned download URL',
        description: 'Creates a time-limited presigned URL after verifying case authorization. URL expires in 1 hour.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Presigned download URL',
        schema: {
            type: 'object',
            properties: {
                downloadUrl: { type: 'string' },
                expiresInSeconds: { type: 'number', example: 3600 },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto, String, String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getSecureDownloadUrl", null);
__decorate([
    (0, common_1.Post)('evidence/:id/verify'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify cryptographic SHA-256 integrity against vault storage',
        description: 'Fetches stored binary from storage layer, recomputes SHA-256 digest, compares with original hash, updates integrity status, and logs a HASH_VERIFIED record in the custody ledger.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Integrity verification result and audit record',
        type: evidence_response_dto_1.VerifyHashResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto, String, String]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "verifyIntegrity", null);
__decorate([
    (0, common_1.Get)('evidence/:id/analysis'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve structured AI forensic analysis for evidence artifact',
        description: 'Fetches structured analysis results stored in MongoDB produced by the internal AI processing pipeline without direct frontend exposure.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Structured analysis results retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "getAnalysis", null);
exports.EvidenceController = EvidenceController = __decorate([
    (0, swagger_1.ApiTags)('Evidence & Chain of Custody'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ version: '1' }),
    __metadata("design:paramtypes", [evidence_service_1.EvidenceService])
], EvidenceController);
//# sourceMappingURL=evidence.controller.js.map