import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { SessionModule } from './session/session.module.js';
import { TokenModule } from './token/token.module.js';
import { TokenService } from './token/token.service.js';
import { UserModule } from './user/user.module.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env', '../../.env'],
		}),
		AuthModule,
		UserModule,
		SessionModule,
		TokenModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
