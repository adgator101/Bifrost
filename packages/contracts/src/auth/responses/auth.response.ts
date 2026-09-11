export interface AuthUserResponse {
	id: string;
	email: string;
}

export interface AuthTokensResponse {
	accessToken: string;
	refreshToken: string;
}

export interface AuthResponse extends AuthTokensResponse {
	id: string;
	email: string;
}
