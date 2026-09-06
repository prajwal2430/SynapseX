import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateFindingDto {
  @ApiProperty({ example: '66da81234abcd5678ef01111', description: 'Case MongoDB ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({ example: 'Suspected Data Exfiltration via Encrypted DNS' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Observed anomalous high-frequency DNS queries containing base64 payloads to suspicious domain.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'EXFILTRATION', description: 'Finding classification' })
  @IsString()
  @IsNotEmpty()
  findingType: string;

  @ApiProperty({ example: 0.88, minimum: 0, maximum: 1, description: 'Model/Algorithm confidence score' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore: number;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'], default: 'MEDIUM' })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'DEFINITIVE'])
  @IsOptional()
  evidenceStrength?: string = 'MEDIUM';

  @ApiPropertyOptional({ example: ['66da91234abcd5678ef05678'], description: 'List of Evidence MongoDB ObjectIds' })
  @IsArray()
  @IsOptional()
  supportingEvidence?: string[];

  @ApiPropertyOptional({ example: ['66da91234abcd5678ef07777'], description: 'List of Entity MongoDB ObjectIds' })
  @IsArray()
  @IsOptional()
  supportingEntities?: string[];

  @ApiProperty({ example: 'Chain of evidence indicates 45 rapid DNS TXT queries carrying sequential chunk headers matching compromised workstation.' })
  @IsString()
  @IsNotEmpty()
  reasoning: string;

  @ApiPropertyOptional({ example: 'Packet capture was truncated; payload decrypted using recovered session key only.' })
  @IsString()
  @IsOptional()
  limitations?: string = '';

  @ApiPropertyOptional({ example: 'INVESTIGATION_AGENT', default: 'AI_SERVICE' })
  @IsString()
  @IsOptional()
  generatedBy?: string = 'AI_SERVICE';
}
