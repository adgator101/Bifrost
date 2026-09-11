import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service.js';

@Global()
@Module({
	providers: [TokenService],
	exports: [TokenService],
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
export class TokenModule {}
