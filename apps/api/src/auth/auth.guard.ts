import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtPayload } from 'src/common/interfaces/jwt.interface.js';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext) {
		const isPublicEndpoint = this.reflector.getAllAndOverride<boolean>(
			IS_PUBLIC_KEY,
			[context.getHandler(), context.getClass()],
		);

		// Skip Authentication check for public endpoints
		if (isPublicEndpoint) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const token = this.extractAuthTokenFromHeaders(request);

		if (!token) {
			throw new UnauthorizedException();
		}

		try {
			const payload: JwtPayload = await this.jwtService.verifyAsync(token);
			request['user'] = payload;
		} catch (error) {
			throw new UnauthorizedException(
				'Invalid or expired authentication token',
			);
		}
		return true;
	}

	private extractAuthTokenFromHeaders(request: Request) {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
