import { UserBasic } from './user.model';

export interface Group {
	id: number;
	name: string;
	description?: string;
	vacationStartDate?: string;
	vacationEndDate?: string;
	coverImageUrl?: string;
	createdBy: UserBasic;
	createdAt: string;
	updatedAt: string;
	memberCount: number;
	members?: GroupMember[];
}

export interface GroupMember {
	id: number;
	groupId: number;
	user: UserBasic;
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
	members?: AddMemberRequest[]; // Lista opzionale di membri da aggiungere in creazione
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
