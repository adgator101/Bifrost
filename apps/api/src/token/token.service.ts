import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from 'src/common/interfaces/jwt.interface.js';
import { hashPassword } from 'src/common/utils/crypto.util.js';

@Injectable()
export class TokenService {
	constructor(private readonly jwtService: JwtService) {}

	async generateRefreshToken(userId: string, email: string) {
		const refreshToken = await this.jwtService.signAsync(
			{
				sub: userId,
				email: email,
			},
			{
				expiresIn: '30d',
			},
		);

		const refreshTokenHash = await hashPassword(refreshToken);

		return {
			refreshToken,
			refreshTokenHash,
		};
	}

	async signAccessToken(
		userId: string,
		sessionId: string,
		email: string,
	): Promise<string> {
		return this.jwtService.signAsync(
			{
				sub: userId,
				sessionId,
				email,
			},
			{ expiresIn: '6h' },
		);
	}

	async verifyRefreshToken(token: string): Promise<JwtPayload> {
		try {
			return await this.jwtService.verifyAsync<JwtPayload>(token);
		} catch {
			throw new UnauthorizedException('Invalid or expired refresh token');
		}
	}
}
