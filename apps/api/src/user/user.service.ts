import { Prisma } from '@bifrost/database';
import { TransactionClient } from '@bifrost/database/src/generated/internal/prismaNamespace.ts';
import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from 'src/auth/dto/auth/register.dto.js';
import { PrismaService } from '../../prisma/prisma.service.ts';

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	async findUserByEmail(email: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: {
					email: email,
				},
			});

			if (!user) {
				throw new NotFoundException('User with this email does not exist');
			}
			return {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
			};
		} catch (error) {
			throw error;
		}
	}

	async createUser(tx: TransactionClient, dto: RegisterDto) {
		try {
			const user = await tx.user.create({
				data: {
					email: dto.email,
					firstName: dto.firstName,
					lastName: dto.lastName,
				},
			});

			return user;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ConflictException('User with this email already exists');
				}
			}
			throw error;
		}
	}
}
