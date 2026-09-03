export interface JwtPayload {
	sub: string;
	sessionId: string;
	email: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}
