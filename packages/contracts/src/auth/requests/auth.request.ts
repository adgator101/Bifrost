// TODO: Remove this later
import { Provider } from '@bifrost/database';

export interface RegisterRequest {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	provider: Provider;
	providerId?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}
