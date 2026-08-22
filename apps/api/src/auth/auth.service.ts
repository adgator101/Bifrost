import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { RegisterDto } from './dto/auth/register.dto.js';

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
	) {}

	async register(dto: RegisterDto) {
		return await this.prisma.$transaction(async (tx) => {
			const existingUser = await tx.user.findUnique({
				where: {
					email: dto.email,
				},
			});
			if (existingUser) {
				throw new ConflictException('User with this email already exists');
			}

			const hashedPassword = await this.hashPassword(dto.password);

			const user = await tx.user.create({
				data: {
					email: dto.email,
					firstName: dto.firstName,
					lastName: dto.lastName,
				},
			});

			const providerId = dto.provider === 'LOCAL' ? null : dto.providerId;

			const _userAuthentication = await tx.authentication.create({
				data: {
					userId: user.id,
					passwordHash: hashedPassword,
					provider: dto.provider,
					providerAccountId: providerId,
				},
			});

			const refreshTokenHash = await (async () => {
				const refreshToken = await this.jwtService.signAsync(
					{
						sub: user.id,
						email: user.email,
					},
					{
						expiresIn: '30d',
					},
				);

				const refreshTokenHash = await this.hashPassword(refreshToken);

				return refreshTokenHash;
			})();

			const userSession = await tx.session.create({
				data: {
					userId: user.id,
					refreshTokenHash: refreshTokenHash,
				},
			});

			const accessToken = await this.jwtService.signAsync(
				{
					sub: user.id,
					sessionId: userSession.id,
					email: user.email,
				},
				{
					expiresIn: '6h',
				},
			);

			return {
				id: user.id,
				email: user.email,
				accessToken,
			};
		});
	}

	async hashPassword(password: string) {
		return await bcrypt.hash(password, 10);
	}

	async checkPassword(requestPassword: string, passwordHash: string) {
		const isPasswordValid = await bcrypt.compare(requestPassword, passwordHash);
		return isPasswordValid;
	}
}
