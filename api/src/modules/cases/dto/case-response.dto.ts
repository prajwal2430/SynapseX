import { ApiProperty } from '@nestjs/swagger';
import { CaseStatus } from '../enums/case-status.enum';
import { CasePriority } from '../enums/case-priority.enum';
import { UserProfileDto } from '../../auth/dto/auth-response.dto';

export class CaseResponseDto {
  @ApiProperty({ example: '66da81234abcd5678ef05678' })
  id: string;

  @ApiProperty({ example: 'CASE-2026-0001' })
  caseNumber: string;

  @ApiProperty({ example: 'Insider Threat Data Exfiltration Investigation' })
  title: string;

  @ApiProperty({ example: 'Unauthorized download of proprietary databases.' })
  description: string;

  @ApiProperty({ enum: CaseStatus, example: CaseStatus.OPEN })
  status: CaseStatus;

  @ApiProperty({ enum: CasePriority, example: CasePriority.HIGH })
  priority: CasePriority;

  @ApiProperty({ type: () => Object, example: '66da81234abcd5678ef01234' })
  createdBy: string | UserProfileDto;

  @ApiProperty({ type: () => [Object], example: ['66da81234abcd5678ef01234'] })
  assignedUsers: (string | UserProfileDto)[];

  @ApiProperty({ example: ['insider-threat', 'exfiltration'] })
  tags: string[];

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: '2026-09-06T01:42:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-06T01:42:00.000Z' })
  updatedAt: string;
}

export class DeleteCaseResponseDto {
  @ApiProperty({ example: true })
  deleted: boolean;

  @ApiProperty({ example: 'Case CASE-2026-0001 successfully deleted' })
  message: string;
}
