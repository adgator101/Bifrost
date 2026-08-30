import { Injectable, NotFoundException } from '@nestjs/common';
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
}
