import { BadRequestException } from '@nestjs/common';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { createCustomValidationPipe } from './custom-validation.pipe';

class SampleTestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @MinLength(5)
  description: string;
}

describe('CustomValidationPipe', () => {
  const pipe = createCustomValidationPipe();

  it('should pass valid data without throwing error', async () => {
    const validData = {
      title: 'Evidence Item A',
      description: 'Detailed description of forensic artifact',
    };

    const result = await pipe.transform(validData, {
      type: 'body',
      metatype: SampleTestDto,
    });

    expect(result).toEqual(validData);
  });

  it('should throw BadRequestException on invalid data', async () => {
    const invalidData = {
      title: '',
      description: 'shrt',
    };

    await expect(
      pipe.transform(invalidData, {
        type: 'body',
        metatype: SampleTestDto,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should strip non-whitelisted fields', async () => {
    const dataWithExtra = {
      title: 'Valid Title',
      description: 'Long enough description',
      extraField: 'should be stripped or forbidden',
    };

    // Since forbidNonWhitelisted is true, it should reject extra fields
    await expect(
      pipe.transform(dataWithExtra, {
        type: 'body',
        metatype: SampleTestDto,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
