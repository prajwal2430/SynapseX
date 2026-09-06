import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UploadEvidenceDto {
  @ApiProperty({
    example: 'Workstation WKSTN-892 Internal NVMe Dump',
    description: 'Origin or source device of the evidence artifact',
    minLength: 2,
  })
  @IsString({ message: 'Source must be a string' })
  @IsNotEmpty({ message: 'Source description is required' })
  @MinLength(2, { message: 'Source must be at least 2 characters long' })
  source: string;

  @ApiPropertyOptional({
    example: 'Raw disk image acquired during incident response containment phase.',
    description: 'Detailed description of the evidence item',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['disk-image', 'nvme', 'triage'],
    description: 'Forensic tags associated with this artifact',
    type: [String],
  })
  @IsArray({ message: 'Tags must be an array of strings' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @IsOptional()
  tags?: string[] = [];

  @ApiPropertyOptional({
    example: { hostname: 'WKSTN-892', os: 'Windows 11 Enterprise', examiner: 'Alex Mercer' },
    description: 'Arbitrary custom forensic metadata key-value pairs',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
