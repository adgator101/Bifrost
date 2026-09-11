import { Body, Controller, Get, Post, Req, Request, Res } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import type { Request as ExpressReq, Response } from 'express';
import type { JwtPayload } from 'src/common/interfaces/jwt.interface.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { AuthResponseDto } from './dto/auth/auth-response.dto.ts';
import { LoginDto } from './dto/auth/login.dto.js';
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
		type: AuthResponseDto,
	})
	@ApiResponse({
		status: 409,
		description: 'User with this email already exists',
	})
	async register(
		@Body() dto: RegisterDto,
		@Res({ passthrough: true }) response: Response,
	) {
		const result = await this.authService.register(dto);

		response.cookie('refresh_token', result.refreshToken, {
			httpOnly: true,
			secure: false, // Set to true in prod
			maxAge: 30000 * 60 * 60 * 24, // 30d,
			sameSite: 'lax',
			signed: false,
		});

		return {
			id: result.id,
			email: result.email,
			accessToken: result.accessToken,
		};
	}

	@Public()
	@Post('login')
	@ApiResponse({
		status: 201,
		description: 'User logged in successfully',
		type: AuthResponseDto,
	})
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) response: Response,
	) {
		const result = await this.authService.login(dto);

		response.cookie('refresh_token', result.refreshToken, {
			httpOnly: true,
			secure: false, // Set to true in prod
			maxAge: 30000 * 60 * 60 * 24, // 30d,
			sameSite: 'lax',
			signed: false, // TODO: Add secret
		});

		return {
			id: result.id,
			email: result.email,
			accessToken: result.accessToken,
		};
	}

	@ApiBearerAuth()
	@Get('me')
	async getProfile(@Req() request: Request) {
		const userData: JwtPayload = request['user'];
		return await this.authService.getUserProfile(userData.email);
	}

	@Post('refresh')
	async issueAccessToken(@Req() request: ExpressReq) {
		const refreshToken = request.cookies['refresh_token'];
		return this.authService.refreshTokens(refreshToken);
	}

	@Post('logout')
	async logout(@Req() request: ExpressReq, @Res() response: Response) {
		const refreshToken = request.cookies['refresh_token'];

		await this.authService.logout(refreshToken);

		response.clearCookie('refresh_token');

		return {
			message: 'Logged out successfully',
		};
	}

	@Post('logout/all')
	async logoutAll(@Req() request: ExpressReq, @Res() response: Response) {
		const refreshToken = request.cookies['refresh_token'];

		await this.authService.logoutAll(refreshToken);

		response.clearCookie('refresh_token');
		return {
			message: 'Logged out successfully',
		};
	}
}
