import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: false,
    description: 'Active status of the user account. Inactive users cannot authenticate.',
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @IsNotEmpty({ message: 'isActive is required' })
  isActive: boolean;
}
