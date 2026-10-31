import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum GraphDirection {
  BOTH = 'BOTH',
  IN = 'IN',
  OUT = 'OUT',
}

export class GraphQueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated node labels to filter (e.g., Person,IPAddress,Evidence)',
    example: 'Person,IPAddress',
  })
  @IsOptional()
  @IsString()
  labels?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated relationship types to filter (e.g., APPEARED_IN,USED)',
    example: 'APPEARED_IN,USED',
  })
  @IsOptional()
  @IsString()
  relationshipTypes?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of nodes and relationships to return (default: 100, max: 500)',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 100;
}

export class NeighborsQueryDto {
  @ApiPropertyOptional({
    description: 'Hop depth for neighborhood expansion (1 to 3, default: 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  depth?: number = 1;

  @ApiPropertyOptional({
    description: 'Traversal direction',
    enum: GraphDirection,
    default: GraphDirection.BOTH,
  })
  @IsOptional()
  @IsEnum(GraphDirection)
  direction?: GraphDirection = GraphDirection.BOTH;

  @ApiPropertyOptional({
    description: 'Comma-separated relationship types to traverse',
    example: 'APPEARED_IN,CONNECTED_TO',
  })
  @IsOptional()
  @IsString()
  relationshipTypes?: string;
}

export class FindPathQueryDto {
  @ApiProperty({
    description: 'Origin node sourceId or graph node ID',
    example: '64bf9c0e5a9c2b3d8f1e4a10',
  })
  @IsNotEmpty()
  @IsString()
  fromNodeId: string;

  @ApiProperty({
    description: 'Target node sourceId or graph node ID',
    example: '64bf9c0e5a9c2b3d8f1e4a20',
  })
  @IsNotEmpty()
  @IsString()
  toNodeId: string;

  @ApiPropertyOptional({
    description: 'Maximum traversal hops for path finding (1 to 10, default: 5)',
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  maxHops?: number = 5;
}
