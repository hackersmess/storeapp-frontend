/**
 * Modelli per l'autenticazione
 */

export interface RegisterRequest {
	email: string;
	password: string;
	name: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface AuthResponse {
	token: string;
	refreshToken: string;
	user: UserDto;
}

export interface UserDto {
	id: number;
	email: string;
	name: string;
	avatarUrl: string | null;
	bio: string | null;
	createdAt: string;
}

export interface RefreshTokenRequest {
	refreshToken: string;
}
