import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/auth/login.dto.ts';
import { RegisterDto } from './dto/auth/register.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('register')
	@ApiOperation({ summary: 'Register a new user' })
	@ApiResponse({
		status: 201,
		description: 'User registered successfully',
	})
	@ApiResponse({
		status: 409,
		description: 'User with this email already exists',
	})
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}
}
