import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { CustodyService } from '../../modules/custody/custody.service';
import { ChainOfCustody } from '../../modules/custody/schemas/chain-of-custody.schema';
import { Evidence } from '../../modules/evidence/schemas/evidence.schema';
import { Case } from '../../modules/cases/schemas/case.schema';
import { UserProfileDto } from '../../modules/auth/dto/auth-response.dto';

/**
 * ============================================================================
 * Critical Workflow Test Suite: Flow 3 (Role Authorization & RBAC Boundaries)
 * ============================================================================
 *
 * Validates:
 * 1. RolesGuard enforcing least-privilege role boundaries
 * 2. VIEWER blocked from creating cases or mutating evidence (403 Forbidden)
 * 3. INVESTIGATOR blocked from approving AI findings (requires REVIEWER or ADMIN)
 * 4. Non-ADMIN users blocked from querying global audit logs (requires ADMIN)
 * 5. Case isolation: non-assigned investigator denied access to case data (403 Forbidden)
 */
describe('Critical Workflow: Role Authorization & Governance (Flow 3)', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;
  let custodyService: CustodyService;

  const mockAdminUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'admin@synapsex.local',
    name: 'Platform Administrator',
    role: Role.ADMIN,
    isActive: true,
  };

  const mockInvestigatorUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'investigator.1@synapsex.local',
    name: 'Forensic Investigator',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockReviewerUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'reviewer@synapsex.local',
    name: 'Lead Compliance Reviewer',
    role: Role.REVIEWER,
    isActive: true,
  };

  const mockViewerUser: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'external.auditor@synapsex.local',
    name: 'External Auditor',
    role: Role.VIEWER,
    isActive: true,
  };

  const mockUnassignedInvestigator: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'unassigned.investigator@synapsex.local',
    name: 'Unassigned Detective',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockCaseDocument = {
    _id: new Types.ObjectId(),
    caseNumber: 'CASE-2026-0001',
    title: 'Restricted Financial Breach',
    createdBy: new Types.ObjectId(mockInvestigatorUser.id),
    assignedUsers: [new Types.ObjectId(mockInvestigatorUser.id)],
    isDeleted: false,
  };

  const mockEvidenceDocument = {
    _id: new Types.ObjectId(),
    caseId: mockCaseDocument._id,
    evidenceNumber: 'EVD-2026-0001',
    originalFilename: 'forensic_dump.raw',
    isDeleted: false,
  };

  class MockCustodyModel {
    static find = jest.fn();
  }

  class MockEvidenceModel {
    static findOne = jest.fn();
  }

  class MockCaseModel {
    static findOne = jest.fn();
  }

  const createMockExecutionContext = (user?: UserProfileDto): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        Reflector,
        CustodyService,
        {
          provide: getModelToken(ChainOfCustody.name),
          useValue: MockCustodyModel,
        },
        {
          provide: getModelToken(Evidence.name),
          useValue: MockEvidenceModel,
        },
        {
          provide: getModelToken(Case.name),
          useValue: MockCaseModel,
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    custodyService = module.get<CustodyService>(CustodyService);
  });

  describe('RolesGuard Decision Matrix', () => {
    it('should grant access when endpoint is public (no @Roles decorator applied)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockExecutionContext(mockViewerUser);
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should deny access when endpoint requires roles but request has no authenticated user (403 Forbidden)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.INVESTIGATOR]);

      const context = createMockExecutionContext(undefined);
      expect(() => rolesGuard.canActivate(context)).toThrow(
        new ForbiddenException('Access denied: User credentials or role not established'),
      );
    });

    it('should deny VIEWER role from accessing INVESTIGATOR/ADMIN routes (Case Creation / Upload)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.INVESTIGATOR]);

      const context = createMockExecutionContext(mockViewerUser);
      expect(() => rolesGuard.canActivate(context)).toThrow(
        new ForbiddenException(
          `Access denied: Required role (${Role.ADMIN} or ${Role.INVESTIGATOR}) not met by user role (${Role.VIEWER})`,
        ),
      );
    });

    it('should deny INVESTIGATOR role from accessing REVIEWER/ADMIN routes (Finding Approval)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.REVIEWER]);

      const context = createMockExecutionContext(mockInvestigatorUser);
      expect(() => rolesGuard.canActivate(context)).toThrow(
        new ForbiddenException(
          `Access denied: Required role (${Role.ADMIN} or ${Role.REVIEWER}) not met by user role (${Role.INVESTIGATOR})`,
        ),
      );
    });

    it('should deny non-ADMIN roles from accessing ADMIN-only routes (Audit Logs)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN]);

      const investigatorContext = createMockExecutionContext(mockInvestigatorUser);
      const reviewerContext = createMockExecutionContext(mockReviewerUser);
      const viewerContext = createMockExecutionContext(mockViewerUser);

      expect(() => rolesGuard.canActivate(investigatorContext)).toThrow(ForbiddenException);
      expect(() => rolesGuard.canActivate(reviewerContext)).toThrow(ForbiddenException);
      expect(() => rolesGuard.canActivate(viewerContext)).toThrow(ForbiddenException);
    });

    it('should grant access to ADMIN user across required role set', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.INVESTIGATOR]);

      const context = createMockExecutionContext(mockAdminUser);
      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });

  describe('Case-Level Data Isolation & Access Governance', () => {
    const mockFindChain = {
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    };

    it('should allow assigned investigator to view case custody records', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidenceDocument),
      });
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDocument),
      });
      MockCustodyModel.find.mockReturnValue(mockFindChain);

      const records = await custodyService.getChainByEvidenceId(
        mockEvidenceDocument._id.toString(),
        mockInvestigatorUser,
      );

      expect(records).toBeDefined();
    });

    it('should allow platform ADMIN to view case custody records regardless of assignment', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidenceDocument),
      });
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDocument),
      });
      MockCustodyModel.find.mockReturnValue(mockFindChain);

      const records = await custodyService.getChainByEvidenceId(
        mockEvidenceDocument._id.toString(),
        mockAdminUser,
      );

      expect(records).toBeDefined();
    });

    it('should deny unassigned investigator from accessing restricted case custody records (403 Forbidden)', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvidenceDocument),
      });
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCaseDocument),
      });

      await expect(
        custodyService.getChainByEvidenceId(
          mockEvidenceDocument._id.toString(),
          mockUnassignedInvestigator,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Access denied: You are not authorized to view the chain of custody for this case',
        ),
      );
    });

    it('should return 404 NotFound when evidence does not exist before checking authorization', async () => {
      MockEvidenceModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const nonExistentId = new Types.ObjectId().toString();
      await expect(
        custodyService.getChainByEvidenceId(nonExistentId, mockInvestigatorUser),
      ).rejects.toThrow(
        new NotFoundException(`Evidence artifact '${nonExistentId}' not found`),
      );
    });
  });
});
