import type { AuthResponse } from '@bifrost/contracts';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto implements Omit<AuthResponse, 'refreshToken'> {
	@ApiProperty({ example: 'usr_123' })
	id!: string;
	@ApiProperty({ example: 'john@example.com' })
	email!: string;
	@ApiProperty({ description: 'Short-lived JWT Access Token' })
	accessToken!: string;
}
