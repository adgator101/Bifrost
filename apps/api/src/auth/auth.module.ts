import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SessionService } from 'src/session/session.service.js';
import { TokenService } from 'src/token/token.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserService } from '../user/user.service.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
	controllers: [AuthController],
	providers: [
		PrismaService,
		AuthService,
		Reflector,
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},

		UserService,
		SessionService,
		TokenService,
	],
	imports: [
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				global: true,
				secret: config.getOrThrow<string>('JWT_SECRET'),
			}),
		}),
	],
})
export class AuthModule {}
