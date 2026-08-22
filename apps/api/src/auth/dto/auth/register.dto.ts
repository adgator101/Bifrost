import { Provider } from '@bifrost/database';
import { ApiProperty } from '@nestjs/swagger';
import {
	IsEmail,
	IsEnum,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';

export class RegisterDto {
	@ApiProperty({
		description: 'User email address',
		example: 'user@example.com',
	})
	@IsEmail()
	email!: string;

	@ApiProperty({
		description: 'User password',
		example: 'Password123!',
		minLength: 8,
		maxLength: 25,
	})
	@IsString()
	@MinLength(8, {
		message: 'Password must be at least 8 characters long',
	})
	@MaxLength(25, { message: 'Password too long' })
	password!: string;

	@ApiProperty({
		description: 'First name',
		example: 'John',
		minLength: 2,
		maxLength: 40,
	})
	@IsString()
	@MinLength(2, { message: 'First name too short' })
	@MaxLength(40, { message: 'First name too long' })
	firstName!: string;

	@ApiProperty({
		description: 'Last name',
		example: 'Doe',
		minLength: 2,
		maxLength: 40,
	})
	@IsString()
	@MinLength(2, { message: 'Last name too Short' })
	@MaxLength(40, { message: 'Last name too long' })
	lastName!: string;

	@ApiProperty({
		description: 'Authentication provider type',
		enum: Provider,
		example: Provider.LOCAL,
	})
	@IsEnum(Provider)
	provider!: Provider;

	@ApiProperty({
		description: 'External provider account ID (optional for LOCAL)',
		example: '',
		required: false,
	})
	@IsString()
	providerId!: string;
}

