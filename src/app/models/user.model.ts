// User completo con tutti i campi
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

// User minimale usato in contesti come membri di gruppo, commenti, etc.
export type UserBasic = Pick<User, 'id' | 'email' | 'name' | 'avatarUrl'>;

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
