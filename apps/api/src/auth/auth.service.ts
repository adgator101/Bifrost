import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service.js';
import { PrismaService } from '../../prisma/prisma.service.ts';
import { LoginDto } from './dto/auth/login.dto.ts';
import type { RegisterDto } from './dto/auth/register.dto.js';

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
	) {}

	async register(dto: RegisterDto) {
		return await this.prisma.$transaction(async (tx) => {
			const existingUser = await this.userService.findUserByEmail(dto.email);

			// TODO: Check exceptions later
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

			const { accessToken, refreshToken } = await this.generateSession(
				user.id,
				user.email,
			);

			return {
				id: user.id,
				email: user.email,
				accessToken,
				refreshToken,
			};
		});
	}

	async login(dto: LoginDto) {
		try {
			const existingUser = await this.userService.findUserByEmail(dto.email);

			if (!existingUser) {
				throw new NotFoundException('User with this email does not exist');
			}
			const userAuthentication = await this.prisma.authentication.findFirst({
				where: {
					userId: existingUser.id,
				},
			});

			// TODO: Exception handling is poor. Will check into it later.
			if (!userAuthentication) {
				throw new NotFoundException('Please login');
			}

			const isPasswordCorrect = this.checkPassword(
				dto.password,
				userAuthentication.passwordHash,
			);

			if (!isPasswordCorrect) {
				throw new ConflictException('Invalid Password');
			}

			const { accessToken, refreshToken } = await this.generateSession(
				existingUser.id,
				existingUser.email,
			);

			return {
				id: existingUser.id,
				email: existingUser.email,
				accessToken,
				refreshToken,
			};
		} catch (error) {
			console.error(error);
		}
	}
	async hashPassword(password: string) {
		return await bcrypt.hash(password, 10);
	}

	async checkPassword(requestPassword: string, passwordHash: string) {
		const isPasswordValid = await bcrypt.compare(requestPassword, passwordHash);
		return isPasswordValid;
	}

	async generateAccessToken(userId: string, sessionId: string, email: string) {
		return await this.jwtService.signAsync(
			{
				sub: userId,
				sessionId: sessionId,
				email: email,
			},
			{
				expiresIn: '6h',
			},
		);
	}

	async generateRefreshTokenHash(userId: string, email: string) {
		const refreshToken = await this.jwtService.signAsync(
			{
				sub: userId,
				email: email,
			},
			{
				expiresIn: '30d',
			},
		);

		const refreshTokenHash = await this.hashPassword(refreshToken);

		return {
			refreshToken,
			refreshTokenHash,
		};
	}

	// TODO: Will migrate these to session service later
	async generateSession(userId: string, email: string) {
		const { refreshToken, refreshTokenHash } =
			await this.generateRefreshTokenHash(userId, email);

		const userSession = await this.prisma.session.create({
			data: {
				userId: userId,
				refreshTokenHash,
			},
		});

		const accessToken = await this.generateAccessToken(
			userId,
			userSession.id,
			email,
		);

		return {
			accessToken,
			refreshToken,
		};
	}
}
