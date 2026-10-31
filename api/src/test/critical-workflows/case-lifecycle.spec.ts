import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CasesService } from '../../modules/cases/cases.service';
import { Case } from '../../modules/cases/schemas/case.schema';
import { CaseStatus } from '../../modules/cases/enums/case-status.enum';
import { CasePriority } from '../../modules/cases/enums/case-priority.enum';
import { Role } from '../../common/enums/role.enum';
import { UserProfileDto } from '../../modules/auth/dto/auth-response.dto';
import { createCustomValidationPipe } from '../../common/pipes/custom-validation.pipe';
import { CreateCaseDto } from '../../modules/cases/dto/create-case.dto';

/**
 * ============================================================================
 * Critical Workflow Test Suite: Flow 4 (Case Creation & Lifecycle Management)
 * ============================================================================
 *
 * Validates:
 * 1. Auto-incremented sequential case numbering (CASE-YYYY-XXXX)
 * 2. Automatic assignment of creator to assignedUsers and createdBy
 * 3. Input validation pipe rejecting invalid priority enums or blank titles
 * 4. Status progression through case lifecycle (OPEN -> UNDER_REVIEW -> CLOSED)
 * 5. Safe soft-deletion preserving records with audit integrity
 */
describe('Critical Workflow: Case Creation & Lifecycle Management (Flow 4)', () => {
  let casesService: CasesService;
  const validationPipe = createCustomValidationPipe();

  const mockInvestigator: UserProfileDto = {
    id: new Types.ObjectId().toString(),
    email: 'lead.investigator@synapsex.local',
    name: 'Lead Detective',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const currentYear = new Date().getFullYear();

  class MockCaseInstance {
    _id: Types.ObjectId;
    caseNumber: string;
    title: string;
    description: string;
    priority: CasePriority;
    status: CaseStatus = CaseStatus.OPEN;
    createdBy: Types.ObjectId;
    assignedUsers: Types.ObjectId[];
    tags: string[];
    isDeleted = false;
    deletedAt: Date | null = null;
    createdAt = new Date();
    updatedAt = new Date();

    constructor(data: any) {
      this._id = data._id || new Types.ObjectId();
      this.caseNumber = data.caseNumber;
      this.title = data.title;
      this.description = data.description;
      this.priority = data.priority;
      this.status = data.status || CaseStatus.OPEN;
      this.createdBy = data.createdBy;
      this.assignedUsers = data.assignedUsers || [];
      this.tags = data.tags || [];
      this.isDeleted = Boolean(data.isDeleted);
    }

    save = jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    });
  }

  class MockCaseModel {
    constructor(data: any) {
      return new MockCaseInstance(data);
    }

    static findOne = jest.fn();
    static findById = jest.fn();
    static find = jest.fn();
    static countDocuments = jest.fn();
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: getModelToken(Case.name),
          useValue: MockCaseModel,
        },
      ],
    }).compile();

    casesService = module.get<CasesService>(CasesService);
  });

  describe('Sequential Case Number Generation', () => {
    it('should generate CASE-YYYY-0001 when no prior cases exist for current year', async () => {
      // Mock findOne for latest case returns null
      MockCaseModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const newCase = await casesService.create(
        {
          title: 'Initial Ransomware Triage',
          description: 'Investigating anomalous shadow copy deletions',
          priority: CasePriority.CRITICAL,
          tags: ['ransomware', 'dfir'],
        },
        mockInvestigator,
      );

      expect(newCase).toBeDefined();
      expect(newCase.caseNumber).toBe(`CASE-${currentYear}-0001`);
    });

    it('should increment sequence to CASE-YYYY-0043 when latest case is CASE-YYYY-0042', async () => {
      MockCaseModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            caseNumber: `CASE-${currentYear}-0042`,
          }),
        }),
      });

      const newCase = await casesService.create(
        {
          title: 'Subsequent Breach Analysis',
          description: 'Correlating egress traffic to command and control node',
          priority: CasePriority.HIGH,
        },
        mockInvestigator,
      );

      expect(newCase).toBeDefined();
      expect(newCase.caseNumber).toBe(`CASE-${currentYear}-0043`);
    });
  });

  describe('Creator Assignment & Owner Binding', () => {
    it('should automatically assign creator to assignedUsers list if omitted in payload', async () => {
      MockCaseModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const newCase = await casesService.create(
        {
          title: 'Insider Exfiltration Probe',
          description: 'Investigating bulk export from secure finance store',
          priority: CasePriority.MEDIUM,
        },
        mockInvestigator,
      );

      const creatorObjectId = new Types.ObjectId(mockInvestigator.id);
      expect(newCase.createdBy.toString()).toBe(creatorObjectId.toString());
      expect(
        newCase.assignedUsers.some(
          (u: any) => u.toString() === creatorObjectId.toString(),
        ),
      ).toBe(true);
    });

    it('should not duplicate creator in assignedUsers when explicitly passed in DTO', async () => {
      MockCaseModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const colleagueId = new Types.ObjectId().toString();

      const newCase = await casesService.create(
        {
          title: 'Joint Taskforce Investigation',
          description: 'Collaborative analysis with threat intelligence unit',
          priority: CasePriority.HIGH,
          assignedUsers: [mockInvestigator.id, colleagueId],
        },
        mockInvestigator,
      );

      const assignedStrings = newCase.assignedUsers.map((u: any) => u.toString());
      expect(assignedStrings).toContain(mockInvestigator.id);
      expect(assignedStrings).toContain(colleagueId);
      // Ensure no duplicates
      const occurrences = assignedStrings.filter((id) => id === mockInvestigator.id).length;
      expect(occurrences).toBe(1);
    });
  });

  describe('Validation Pipe Constraints', () => {
    it('should reject payload with invalid priority enum (400 Bad Request)', async () => {
      const invalidPayload = {
        title: 'Valid Case Title',
        description: 'Valid Description',
        priority: 'ULTRA_URGENT_INVALID',
      };

      await expect(
        validationPipe.transform(invalidPayload, {
          type: 'body',
          metatype: CreateCaseDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payload with missing title or title under 3 characters (400 Bad Request)', async () => {
      const invalidPayload = {
        title: 'ab', // Min length is 3
        description: 'Valid Description here',
        priority: CasePriority.MEDIUM,
      };

      await expect(
        validationPipe.transform(invalidPayload, {
          type: 'body',
          metatype: CreateCaseDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payload with missing description (400 Bad Request)', async () => {
      const invalidPayload = {
        title: 'Valid Title',
        priority: CasePriority.MEDIUM,
      };

      await expect(
        validationPipe.transform(invalidPayload, {
          type: 'body',
          metatype: CreateCaseDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should pass validation and transform valid payload', async () => {
      const validPayload = {
        title: 'Authorized Investigation 2026',
        description: 'Forensic memory and disk image preservation',
        priority: CasePriority.HIGH,
        tags: ['apt', 'c2'],
      };

      const result = await validationPipe.transform(validPayload, {
        type: 'body',
        metatype: CreateCaseDto,
      });

      expect(result).toBeDefined();
      expect(result.title).toBe(validPayload.title);
      expect(result.priority).toBe(CasePriority.HIGH);
    });
  });

  describe('Lifecycle State Progression & Soft Deletion', () => {
    it('should transition case through status lifecycle (OPEN -> UNDER_REVIEW -> CLOSED)', async () => {
      const caseInstance = new MockCaseInstance({
        caseNumber: 'CASE-2026-0099',
        title: 'State Transition Case',
        description: 'Lifecycle verification',
        priority: CasePriority.MEDIUM,
        status: CaseStatus.OPEN,
        createdBy: new Types.ObjectId(mockInvestigator.id),
        assignedUsers: [new Types.ObjectId(mockInvestigator.id)],
      });

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(caseInstance),
      });

      // 1. Transition to UNDER_REVIEW
      await casesService.update(
        caseInstance._id.toString(),
        { status: CaseStatus.UNDER_REVIEW },
        mockInvestigator,
      );
      expect(caseInstance.status).toBe(CaseStatus.UNDER_REVIEW);
      expect(caseInstance.save).toHaveBeenCalled();

      // 2. Transition to CLOSED
      await casesService.update(
        caseInstance._id.toString(),
        { status: CaseStatus.CLOSED },
        mockInvestigator,
      );
      expect(caseInstance.status).toBe(CaseStatus.CLOSED);
    });

    it('should soft-delete case by setting isDeleted: true and recording deletedAt timestamp', async () => {
      const caseInstance = new MockCaseInstance({
        caseNumber: 'CASE-2026-0100',
        title: 'Case to be Purged',
        description: 'Soft deletion verification',
        priority: CasePriority.LOW,
        createdBy: new Types.ObjectId(mockInvestigator.id),
        assignedUsers: [new Types.ObjectId(mockInvestigator.id)],
      });

      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(caseInstance),
      });

      const deleteResponse = await casesService.delete(
        caseInstance._id.toString(),
        mockInvestigator,
      );

      expect(deleteResponse.deleted).toBe(true);
      expect(caseInstance.isDeleted).toBe(true);
      expect(caseInstance.deletedAt).toBeInstanceOf(Date);
      expect(caseInstance.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent or deleted case', async () => {
      MockCaseModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const fakeId = new Types.ObjectId().toString();
      await expect(
        casesService.update(fakeId, { status: CaseStatus.ARCHIVED }, mockInvestigator),
      ).rejects.toThrow(new NotFoundException(`Case with ID '${fakeId}' not found`));
    });
  });
});
