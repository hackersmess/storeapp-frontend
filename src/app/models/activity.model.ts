import { UserBasic } from './user.model';

/**
 * ==============================================
 * V5 MODELS - Event/Trip Architecture
 * ==============================================
 */

/**
 * ActivityType - Discriminator for inheritance
 */
export type ActivityType = 'EVENT' | 'TRIP';

/**
 * EventCategory - Categories for Event activities
 */
export enum EventCategory {
	RESTAURANT = 'RESTAURANT',
	MUSEUM = 'MUSEUM',
	BEACH = 'BEACH',
	PARK = 'PARK',
	ATTRACTION = 'ATTRACTION',
	ACCOMMODATION = 'ACCOMMODATION',
	SHOPPING = 'SHOPPING',
	ENTERTAINMENT = 'ENTERTAINMENT',
	SPORT = 'SPORT',
	OTHER = 'OTHER'
}

/**
 * TransportMode - Transport types for Trip activities
 */
export enum TransportMode {
	FLIGHT = 'FLIGHT',
	TRAIN = 'TRAIN',
	BUS = 'BUS',
	CAR = 'CAR',
	FERRY = 'FERRY',
	BIKE = 'BIKE',
	WALK = 'WALK',
	OTHER = 'OTHER'
}

/**
 * Location - Embedded location data
 */
export interface Location {
	name?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	placeId?: string;
	metadata?: Record<string, any>;
}

/**
 * BaseActivity - Common fields for all activities
 */
export interface BaseActivity {
	id: number;
	groupId: number;
	name: string;
	description?: string;
	startDate: string;  // ISO date string (YYYY-MM-DD)
	endDate?: string;   // For multi-day activities
	startTime?: string; // HH:mm format
	endTime?: string;   // HH:mm format
	activityType: ActivityType;
	isCompleted: boolean;
	displayOrder: number;
	totalCost?: number;
	createdAt: string;
	updatedAt: string;
	createdBy?: number;
	confirmedCount: number;
	maybeCount: number;
	declinedCount: number;
	participants?: ActivityParticipant[];
	expenses?: ActivityExpense[];
}

/**
 * Event - Single-location activity (restaurant, museum, hotel, etc.)
 */
export interface Event extends BaseActivity {
	activityType: 'EVENT';
	location?: Location;
	category: EventCategory;
	bookingUrl?: string;
	bookingReference?: string;
	reservationTime?: string; // HH:mm format
}

/**
 * Trip - Travel activity with origin and destination (flight, train, car, etc.)
 */
export interface Trip extends BaseActivity {
	activityType: 'TRIP';
	origin?: Location;
	destination?: Location;
	transportMode: TransportMode;
	departureTime?: string; // HH:mm format
	arrivalTime?: string;   // HH:mm format
	bookingReference?: string;
}

/**
 * Activity - Union type of Event | Trip
 */
export type Activity = Event | Trip;

/**
 * Type guards for Activity types
 */
export function isEvent(activity: Activity): activity is Event {
	return activity.activityType === 'EVENT';
}

export function isTrip(activity: Activity): activity is Trip {
	return activity.activityType === 'TRIP';
}

/**
 * ==============================================
 * REQUEST MODELS (for API)
 * ==============================================
 */

/**
 * EventRequest - Create/Update Event
 */
export interface EventRequest {
	name: string;
	description?: string;
	startDate: string;
	endDate?: string;
	startTime?: string;
	endTime?: string;
	locationName?: string;
	locationAddress?: string;
	locationLatitude?: number;
	locationLongitude?: number;
	locationPlaceId?: string;
	locationMetadata?: Record<string, any>;
	category: EventCategory;
	bookingUrl?: string;
	bookingReference?: string;
	reservationTime?: string;
	isCompleted?: boolean;
	displayOrder?: number;
	totalCost?: number;
	participantIds?: number[]; // IDs of GroupMembers participating
}

/**
 * TripRequest - Create/Update Trip
 */
export interface TripRequest {
	name: string;
	description?: string;
	startDate: string;
	endDate?: string;
	startTime?: string;
	endTime?: string;
	originName?: string;
	originAddress?: string;
	originLatitude?: number;
	originLongitude?: number;
	originPlaceId?: string;
	originMetadata?: Record<string, any>;
	destinationName?: string;
	destinationAddress?: string;
	destinationLatitude?: number;
	destinationLongitude?: number;
	destinationPlaceId?: string;
	destinationMetadata?: Record<string, any>;
	transportMode: TransportMode;
	departureTime?: string;
	arrivalTime?: string;
	bookingReference?: string;
	isCompleted?: boolean;
	displayOrder?: number;
	totalCost?: number;
	participantIds?: number[]; // IDs of GroupMembers participating
}

/**
 * ActivityRequest - Generic request (DEPRECATED - use EventRequest/TripRequest)
 * Kept for backward compatibility
 */
export interface ActivityRequest {
	name: string;
	description?: string;
	startDate: string;
	endDate?: string;
	startTime?: string;
	endTime?: string;
	activityType: ActivityType;
	isCompleted?: boolean;
	displayOrder?: number;
	totalCost?: number;
	// DEPRECATED fields
	scheduledDate?: string; // Use startDate instead
}

/**
 * ==============================================
 * RELATED MODELS (unchanged)
 * ==============================================
 */

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
 * ==============================================
 * ENUMS
 * ==============================================
 */

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
 * ==============================================
 * OTHER REQUEST DTOs
 * ==============================================
 */

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
 * ==============================================
 * HELPER TYPES
 * ==============================================
 */

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

/**
 * Helper function to get activity display location
 */
export function getActivityLocation(activity: Activity): string {
	if (isEvent(activity)) {
		return activity.location?.name || activity.location?.address || 'Nessun luogo';
	} else if (isTrip(activity)) {
		const origin = activity.origin?.name || activity.origin?.address || '?';
		const destination = activity.destination?.name || activity.destination?.address || '?';
		return `${origin} → ${destination}`;
	}
	return 'Nessun luogo';
}

/**
 * Helper function to check if activity is multi-day
 */
export function isMultiDay(activity: Activity): boolean {
	return !!activity.endDate && activity.endDate !== activity.startDate;
}

/**
 * Helper function to get duration in days
 */
export function getDurationDays(activity: Activity): number {
	if (!activity.endDate) return 1;
	const start = new Date(activity.startDate);
	const end = new Date(activity.endDate);
	return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Helper function to get EventCategory display label
 */
export function getEventCategoryLabel(category: EventCategory): string {
	const labels: Record<EventCategory, string> = {
		[EventCategory.RESTAURANT]: 'Ristorante',
		[EventCategory.MUSEUM]: 'Museo',
		[EventCategory.BEACH]: 'Spiaggia',
		[EventCategory.PARK]: 'Parco',
		[EventCategory.ATTRACTION]: 'Attrazione',
		[EventCategory.ACCOMMODATION]: 'Alloggio',
		[EventCategory.SHOPPING]: 'Shopping',
		[EventCategory.ENTERTAINMENT]: 'Intrattenimento',
		[EventCategory.SPORT]: 'Sport',
		[EventCategory.OTHER]: 'Altro'
	};
	return labels[category] || category;
}

/**
 * Helper function to get TransportMode display label
 */
export function getTransportModeLabel(mode: TransportMode): string {
	const labels: Record<TransportMode, string> = {
		[TransportMode.FLIGHT]: 'Volo',
		[TransportMode.TRAIN]: 'Treno',
		[TransportMode.BUS]: 'Autobus',
		[TransportMode.CAR]: 'Auto',
		[TransportMode.FERRY]: 'Traghetto',
		[TransportMode.BIKE]: 'Bici',
		[TransportMode.WALK]: 'A piedi',
		[TransportMode.OTHER]: 'Altro'
	};
	return labels[mode] || mode;
}

/**
 * Helper function to get TransportMode icon
 */
export function getTransportModeIcon(mode: TransportMode): string {
	const icons: Record<TransportMode, string> = {
		[TransportMode.FLIGHT]: 'lucidePlane',
		[TransportMode.TRAIN]: 'lucideTrain',
		[TransportMode.BUS]: 'lucideBus',
		[TransportMode.CAR]: 'lucideCar',
		[TransportMode.FERRY]: 'lucideShip',
		[TransportMode.BIKE]: 'lucideBike',
		[TransportMode.WALK]: 'lucideFootprints',
		[TransportMode.OTHER]: 'lucideMapPin'
	};
	return icons[mode] || 'lucideMapPin';
}
