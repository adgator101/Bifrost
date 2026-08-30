import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import { UserService } from './user.service.ts';

@Module({
	providers: [UserService, PrismaService],
	// controllers: [UserController],
})
export class UserModule {}
