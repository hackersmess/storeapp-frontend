import { UserBasic } from './user.model';

/**
 * Activity - attività del gruppo
 * Collegata direttamente al gruppo (non più tramite itinerario)
 */
export interface Activity {
	id: number;
	groupId: number;  // Collegamento diretto al gruppo
	name: string;
	description?: string;
	scheduledDate?: string;
	startTime?: string;
	endTime?: string;
	locationName?: string;
	locationAddress?: string;
	locationLat?: number;
	locationLng?: number;
	locationPlaceId?: string;
	locationProvider: LocationProvider;
	locationMetadata?: Record<string, any>;
	isCompleted: boolean;
	displayOrder: number;
	confirmedCount: number;
	maybeCount: number;
	declinedCount: number;
	createdAt: string;
	updatedAt: string;
	participants?: ActivityParticipant[];
	expenses?: ActivityExpense[];
}

/**
 * ActivityParticipant - partecipante a un'attività
 */
export interface ActivityParticipant {
	id: number;
	activityId: number;
	groupMember: GroupMemberBasic;
	status: ParticipantStatus;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * ActivityExpense - spesa per un'attività
 */
export interface ActivityExpense {
	id: number;
	activityId: number;
	paidBy: GroupMemberBasic;
	description: string;
	amount: number;
	currency: string;
	createdAt: string;
	updatedAt: string;
	splits?: ActivityExpenseSplit[];
}

/**
 * ActivityExpenseSplit - divisione di una spesa
 */
export interface ActivityExpenseSplit {
	id: number;
	expenseId: number;
	groupMember: GroupMemberBasic;
	amount: number;
	isPaid: boolean;
	paidAt?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * ActivityCalendar - vista calendario ottimizzata
 */
export interface ActivityCalendar {
	id: number;
	groupId: number;
	title: string;
	start: string;
	end: string;
	dayOfWeek: string;
	activityDate: string;
	calendarStatus: CalendarStatus;
	description?: string;
	locationName?: string;
	locationLat?: number;
	locationLng?: number;
	isCompleted: boolean;
	confirmedCount: number;
	maybeCount: number;
	declinedCount: number;
	totalMembers: number;
	creatorName: string;
	creatorAvatar?: string;
}

/**
 * GroupMemberBasic - info di base del membro
 */
export interface GroupMemberBasic {
	id: number;
	groupId: number;
	user: UserBasic;
	role: string;
	joinedAt: string;
}

/**
 * Enums
 */
export enum LocationProvider {
	MAPBOX = 'MAPBOX',
	GOOGLE_MAPS = 'GOOGLE_MAPS',
	OPENSTREETMAP = 'OPENSTREETMAP'
}

export enum ParticipantStatus {
	CONFIRMED = 'CONFIRMED',
	MAYBE = 'MAYBE',
	DECLINED = 'DECLINED'
}

export enum CalendarStatus {
	COMPLETED = 'completed',
	CONFIRMED = 'confirmed',
	DECLINED = 'declined',
	PENDING = 'pending'
}

/**
 * Request DTOs
 */
export interface ActivityRequest {
	name: string;
	description?: string;
	scheduledDate?: string;
	startTime?: string;
	endTime?: string;
	locationName?: string;
	locationAddress?: string;
	locationLat?: number;
	locationLng?: number;
	locationPlaceId?: string;
	locationProvider?: LocationProvider;
	locationMetadata?: Record<string, any>;
	isCompleted?: boolean;
	displayOrder?: number;
}

export interface ActivityParticipantRequest {
	groupMemberId: number;
	status?: ParticipantStatus;
	notes?: string;
}

export interface ActivityExpenseRequest {
	paidById: number;
	description: string;
	amount: number;
	currency?: string;
	splits: ExpenseSplitRequest[];
}

export interface ExpenseSplitRequest {
	groupMemberId: number;
	amount: number;
}

export interface UpdateParticipantStatusRequest {
	status: ParticipantStatus;
	notes?: string;
}

/**
 * Helper types per la vista calendario
 */
export interface CalendarDay {
	date: string;
	dayOfWeek: string;
	activities: ActivityCalendar[];
	activityCount: number;
	isToday: boolean;
	isPast: boolean;
}

export interface CalendarWeek {
	weekNumber: number;
	days: CalendarDay[];
}
