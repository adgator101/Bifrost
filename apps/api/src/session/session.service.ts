import { TransactionClient } from '@bifrost/database/src/generated/internal/prismaNamespace.ts';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service.js';
import type { AuthTokens } from 'src/common/interfaces/jwt.interface.js';
import { TokenService } from 'src/token/token.service.js';

@Injectable()
export class SessionService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly tokenService: TokenService,
	) {}

	async createSession(
		userId: string,
		email: string,
		tx: TransactionClient = this.prisma,
	): Promise<AuthTokens> {
		const { refreshToken, refreshTokenHash } =
			await this.tokenService.generateRefreshToken(userId, email);
		const session = await tx.session.create({
			data: {
				userId,
				refreshTokenHash,
			},
		});
		const accessToken = await this.tokenService.signAccessToken(
			userId,
			session.id,
			email,
		);
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
				await this.tokenService.generateRefreshToken(userId, email);

			const newSession = await tx.session.create({
				data: {
					userId,
					refreshTokenHash,
				},
			});

			const accessToken = await this.tokenService.signAccessToken(
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

	async revokeSession(sessionId: string) {
		await this.prisma.session.update({
			where: { id: sessionId },
			data: { revokedAt: new Date() },
		});
	}

	async revokeAllUserSessions(userId: string): Promise<void> {
		await this.prisma.session.updateMany({
			where: { userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	}
}
