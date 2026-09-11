import { Module } from '@nestjs/common';
import { TokenService } from 'src/token/token.service.js';
import { SessionController } from './session.controller.js';
import { SessionService } from './session.service.js';

@Module({
	controllers: [SessionController],
	providers: [SessionService, TokenService],
})
export class SessionModule {}
