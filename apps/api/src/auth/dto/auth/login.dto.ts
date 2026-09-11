import { LoginRequest } from '@bifrost/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto implements LoginRequest {
	@ApiProperty({
		description: 'User email address',
		example: 'user@example.com',
	})
	@IsEmail()
	email!: string;

	@ApiProperty({
		description: 'User Password',
		example: 'Password123!',
	})
	@IsString()
	password!: string;
}
