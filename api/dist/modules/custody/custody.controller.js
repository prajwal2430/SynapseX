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
exports.CustodyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const custody_service_1 = require("./custody.service");
const chain_of_custody_response_dto_1 = require("./dto/chain-of-custody-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const auth_response_dto_1 = require("../auth/dto/auth-response.dto");
const role_enum_1 = require("../../common/enums/role.enum");
let CustodyController = class CustodyController {
    constructor(custodyService) {
        this.custodyService = custodyService;
    }
    async getCustodyChain(id, currentUser) {
        return this.custodyService.getChainByEvidenceId(id, currentUser);
    }
    async verifyCustodyChain(id, currentUser) {
        return this.custodyService.verifyChain(id, currentUser);
    }
};
exports.CustodyController = CustodyController;
__decorate([
    (0, common_1.Get)('evidence/:id/custody'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve tamper-evident chain of custody ledger for an evidence item',
        description: 'Returns the chronological, append-only chain of custody records with cryptographic SHA-256 hashes linking each record to the previous one.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chain of custody ledger retrieved successfully',
        type: [chain_of_custody_response_dto_1.ChainOfCustodyResponseDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - User not authorized for this case' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], CustodyController.prototype, "getCustodyChain", null);
__decorate([
    (0, common_1.Get)('evidence/:id/custody/verify'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.INVESTIGATOR, role_enum_1.Role.ANALYST, role_enum_1.Role.REVIEWER, role_enum_1.Role.VIEWER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Cryptographically verify the tamper-evident chain of custody',
        description: 'Walks the custody ledger from genesis to head, verifying each previousRecordHash pointer, sequence number continuity (detecting missing records), and re-computing SHA-256 digests. Does not claim legal/court certification.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Chain verification report',
        type: chain_of_custody_response_dto_1.VerifyChainResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Evidence not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_response_dto_1.UserProfileDto]),
    __metadata("design:returntype", Promise)
], CustodyController.prototype, "verifyCustodyChain", null);
exports.CustodyController = CustodyController = __decorate([
    (0, swagger_1.ApiTags)('Tamper-Evident Custody Logging'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ version: '1' }),
    __metadata("design:paramtypes", [custody_service_1.CustodyService])
], CustodyController);
//# sourceMappingURL=custody.controller.js.map