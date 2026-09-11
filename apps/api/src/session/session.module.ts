import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SessionController } from './session.controller.js';
import { SessionService } from './session.service.js';

@Module({
	controllers: [SessionController],
	providers: [SessionService, PrismaService],
})
export class SessionModule {}
