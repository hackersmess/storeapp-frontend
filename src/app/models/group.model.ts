export interface Group {
	id: number;
	name: string;
	description?: string;
	vacationStartDate?: string;
	vacationEndDate?: string;
	coverImageUrl?: string;
	createdBy: {
		id: number;
		email: string;
		name: string;
		avatarUrl?: string;
	};
	createdAt: string;
	updatedAt: string;
	memberCount: number;
	members?: GroupMember[];
}

export interface GroupMember {
	id: number;
	groupId: number;
	user: {
		id: number;
		email: string;
		name: string;
		avatarUrl?: string;
	};
	role: GroupRole;
	joinedAt: string;
}

export enum GroupRole {
	ADMIN = 'ADMIN',
	MEMBER = 'MEMBER'
}

export interface CreateGroupRequest {
	name: string;
	description?: string;
	vacationStartDate?: string;
	vacationEndDate?: string;
	coverImageUrl?: string;
}

export interface UpdateGroupRequest {
	name?: string;
	description?: string;
	vacationStartDate?: string;
	vacationEndDate?: string;
	coverImageUrl?: string;
}

export interface AddMemberRequest {
	email?: string;
	username?: string;
	role: GroupRole;
}

export interface UpdateMemberRoleRequest {
	role: GroupRole;
}
