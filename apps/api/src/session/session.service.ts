import { TransactionClient } from '@bifrost/database/src/generated/internal/prismaNamespace.ts';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service.js';
import type {
	AuthTokens,
	JwtPayload,
} from 'src/common/interfaces/jwt.interface.js';
import { hashPassword } from 'src/common/utils/crypto.util.js';

@Injectable()
export class SessionService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
	) {}

	async createSession(
		userId: string,
		email: string,
		tx: TransactionClient = this.prisma,
	): Promise<AuthTokens> {
		const { refreshToken, refreshTokenHash } = await this.generateRefreshToken(
			userId,
			email,
		);
		const session = await tx.session.create({
			data: {
				userId,
				refreshTokenHash,
			},
		});
		const accessToken = await this.signAccessToken(userId, session.id, email);
		return { accessToken, refreshToken };
	}

	async rotateSession(
		oldSessionId: string,
		userId: string,
		email: string,
	): Promise<AuthTokens> {
		return this.prisma.$transaction(async (tx) => {
			if (oldSessionId) {
				await tx.session.update({
					where: {
						id: oldSessionId,
					},
					data: {
						revokedAt: new Date(),
					},
				});
			}

			const { refreshToken, refreshTokenHash } =
				await this.generateRefreshToken(userId, email);

			const newSession = await tx.session.create({
				data: {
					userId,
					refreshTokenHash,
				},
			});

			const accessToken = await this.signAccessToken(
				userId,
				newSession.id,
				email,
			);

			return {
				accessToken,
				refreshToken,
			};
		});
	}

	async revokeAllUserSessions(userId: string): Promise<void> {
		await this.prisma.session.updateMany({
			where: { userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	}

	private async generateRefreshToken(userId: string, email: string) {
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

	private async signAccessToken(
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
