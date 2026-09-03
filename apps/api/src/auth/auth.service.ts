import { Prisma } from '@bifrost/database';
import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { compareData, hashPassword } from 'src/common/utils/crypto.util.js';
import { SessionService } from 'src/session/session.service.js';
import { PrismaService } from '../../prisma/prisma.service.ts';
import { UserService } from '../user/user.service.js';
import { LoginDto } from './dto/auth/login.dto.ts';
import type { RegisterDto } from './dto/auth/register.dto.js';

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService,
		private readonly sessionService: SessionService,
	) {}

	async register(dto: RegisterDto) {
		try {
			return await this.prisma.$transaction(async (tx) => {
				const hashedPassword = await hashPassword(dto.password);

				const user = await tx.user.create({
					data: {
						email: dto.email,
						firstName: dto.firstName,
						lastName: dto.lastName,
					},
				});

				const providerId = dto.provider === 'LOCAL' ? null : dto.providerId;

				await tx.authentication.create({
					data: {
						userId: user.id,
						passwordHash: hashedPassword,
						provider: dto.provider,
						providerAccountId: providerId,
					},
				});

				const { accessToken, refreshToken } =
					await this.sessionService.createSession(user.id, user.email, tx);

				return {
					id: user.id,
					email: user.email,
					accessToken,
					refreshToken,
				};
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ConflictException('User with this email already exists');
				}
			}

			console.error('Registration error:', error);
			throw new InternalServerErrorException(
				'An unexpected error occurred during registration',
			);
		}
	}

	async login(dto: LoginDto) {
		const existingUser = await this.userService.findUserByEmail(dto.email);

		if (!existingUser) {
			throw new UnauthorizedException('Invalid Credentials');
		}

		const userAuthentication = await this.prisma.authentication.findFirst({
			where: {
				userId: existingUser.id,
			},
		});

		// TODO: Exception handling is poor. Will check into it later.
		if (!userAuthentication) {
			throw new UnauthorizedException('Invalid Credentials');
		}

		const isPasswordCorrect = await compareData(
			dto.password,
			userAuthentication.passwordHash,
		);

		if (!isPasswordCorrect) {
			throw new UnauthorizedException('Invalid Credentials');
		}

		const { accessToken, refreshToken } =
			await this.sessionService.createSession(
				existingUser.id,
				existingUser.email,
			);

		return {
			id: existingUser.id,
			email: existingUser.email,
			accessToken,
			refreshToken,
		};
	}

	async getUserProfile(email: string) {
		const userData = await this.userService.findUserByEmail(email);

		return {
			id: userData.id,
			email: userData.email,
			firstName: userData.firstName,
			lastName: userData.lastName,
		};
	}

	async refreshTokens(rawRefreshToken: string) {
		const payload =
			await this.sessionService.verifyRefreshToken(rawRefreshToken);

		const session = await this.prisma.session.findUnique({
			where: { id: payload.sessionId },
		});

		if (!session) {
			throw new UnauthorizedException('Session not found');
		}

		// If revoked token use detected, throw an exception and revoke all user session
		if (session.revokedAt) {
			await this.sessionService.revokeAllUserSessions(payload.sub);
			throw new UnauthorizedException('Invalid session. Please login again');
		}
		const isTokenMatch = await bcrypt.compare(
			rawRefreshToken,
			session.refreshTokenHash,
		);

		if (!isTokenMatch) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		await this.prisma.session.update({
			where: {
				id: payload.sub,
			},
			data: {
				revokedAt: new Date(), //TODO: Change this
			},
		});

		return await this.sessionService.rotateSession(
			session.id,
			payload.sub,
			payload.email,
		);
	}
}
