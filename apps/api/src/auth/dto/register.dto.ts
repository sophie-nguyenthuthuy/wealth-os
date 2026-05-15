import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Country, VisaType } from '@wealth-os/database';

export class RegisterDto {
  @ApiProperty({ example: '+819012345678', description: 'E.164 phone number' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phoneE164 must be a valid E.164 number' })
  phoneE164!: string;

  @ApiProperty({ example: 'nguyenvan.an@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'password must be at least 10 characters' })
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '1995-04-12', description: 'ISO date YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth!: string;

  @ApiProperty({ example: 'Nghệ An' })
  @IsString()
  hometownProvince!: string;

  @ApiProperty({ enum: Country, example: Country.JP })
  @IsEnum(Country)
  hostCountry!: Country;

  @ApiProperty({ enum: VisaType, example: VisaType.TECHNICAL_INTERN })
  @IsEnum(VisaType)
  visaType!: VisaType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  employerName?: string;
}
