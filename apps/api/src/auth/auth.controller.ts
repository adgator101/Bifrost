import { Body, Controller, Get, Post, Req, Request } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import type { JwtPayload } from 'src/common/interfaces/jwt.interface.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/auth/login.dto.js';
import { RefreshTokenDto } from './dto/auth/refresh-token.dto.js';
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

	@Public()
	@Post('login')
	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@ApiBearerAuth()
	@Get('me')
	async getProfile(@Req() request: Request) {
		const userData: JwtPayload = request['user'];
		return this.authService.getUserProfile(userData.email);
	}

	@Post('refresh')
	async issueAccessToken(@Body() dto: RefreshTokenDto) {
		return this.authService.refreshTokens(dto.refreshToken);
	}

	@Post('logout')
	async logout(@Body() dto: RefreshTokenDto) {
		await this.authService.logout(dto.refreshToken);

		return {
			message: 'Logged out successfully',
		};
	}

	@Post('logout/all')
	async logoutAll(@Body() dto: RefreshTokenDto) {
		await this.authService.logoutAll(dto.refreshToken);

		return {
			message: 'Logged out successfully',
		};
	}
}
