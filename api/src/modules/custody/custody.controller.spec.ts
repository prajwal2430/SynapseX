import { Test, TestingModule } from '@nestjs/testing';
import { CustodyController } from './custody.controller';
import { CustodyService } from './custody.service';
import { CustodyAction } from './enums/custody-action.enum';
import { ChainVerificationStatus } from './dto/chain-of-custody-response.dto';
import { Role } from '../../common/enums/role.enum';

describe('CustodyController', () => {
  let controller: CustodyController;
  let custodyService: CustodyService;

  const mockUser = {
    id: '66da81234abcd5678ef01234',
    email: 'investigator@synapsex.local',
    name: 'Alex Mercer',
    role: Role.INVESTIGATOR,
    isActive: true,
  };

  const mockChainRecord = {
    id: '66da89994abcd5678ef09999',
    evidenceId: '66da81234abcd5678ef05678',
    caseId: '66da81234abcd5678ef01234',
    action: CustodyAction.UPLOADED,
    actorId: '66da81234abcd5678ef01234',
    timestamp: '2026-09-06T02:00:00.000Z',
    sequenceNumber: 1,
    metadata: { filename: 'disk.raw' },
    previousRecordHash: 'GENESIS',
    recordHash: 'a'.repeat(64),
  };

  const mockVerificationResult = {
    isValid: true,
    status: ChainVerificationStatus.VERIFIED,
    totalRecords: 1,
    chainHeadHash: 'a'.repeat(64),
    verifiedAt: '2026-09-06T02:05:00.000Z',
    message: 'Tamper-evident custody verification passed: All custody blocks and hash pointers are intact.',
    disclaimer: 'Notice: SynapseX tamper-evident custody logging provides mathematical audit integrity.',
  };

  const mockCustodyService = {
    getChainByEvidenceId: jest.fn().mockResolvedValue([mockChainRecord]),
    verifyChain: jest.fn().mockResolvedValue(mockVerificationResult),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustodyController],
      providers: [
        {
          provide: CustodyService,
          useValue: mockCustodyService,
        },
      ],
    }).compile();

    controller = module.get<CustodyController>(CustodyController);
    custodyService = module.get<CustodyService>(CustodyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(custodyService).toBeDefined();
  });

  describe('getCustodyChain', () => {
    it('should invoke custodyService.getChainByEvidenceId', async () => {
      const result = await controller.getCustodyChain('66da81234abcd5678ef05678', mockUser);

      expect(result).toEqual([mockChainRecord]);
      expect(mockCustodyService.getChainByEvidenceId).toHaveBeenCalledWith(
        '66da81234abcd5678ef05678',
        mockUser,
      );
    });
  });

  describe('verifyCustodyChain', () => {
    it('should invoke custodyService.verifyChain', async () => {
      const result = await controller.verifyCustodyChain('66da81234abcd5678ef05678', mockUser);

      expect(result).toEqual(mockVerificationResult);
      expect(mockCustodyService.verifyChain).toHaveBeenCalledWith(
        '66da81234abcd5678ef05678',
        mockUser,
      );
    });
  });
});
