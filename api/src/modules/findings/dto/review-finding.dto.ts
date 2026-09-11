import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewFindingDto {
  @ApiPropertyOptional({
    example: 'Verified correlation between memory dump and firewall logs. Approved as confirmed exfiltration.',
    description: 'Reviewer rationale or comments explaining the approval/rejection decision',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
