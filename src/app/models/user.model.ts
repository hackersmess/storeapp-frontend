export interface User {
	id: number;
	email: string;
	name: string;
	avatarUrl?: string;
	bio?: string;
	googleId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserRequest {
	email: string;
	name: string;
	password: string;
	avatarUrl?: string;
	bio?: string;
	googleId?: string;
}

export interface UpdateUserRequest {
	name?: string;
	password?: string;
	avatarUrl?: string;
	bio?: string;
}
