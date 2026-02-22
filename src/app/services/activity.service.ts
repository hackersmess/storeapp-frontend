import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
	Activity,
	ActivityRequest,
	EventRequest,
	TripRequest,
	Event,
	Trip,
	ActivityCalendar,
	ActivityParticipant,
	ActivityParticipantRequest,
	ActivityExpense,
	ActivityExpenseRequest,
	UpdateParticipantStatusRequest
} from '../models/activity.model';

/**
 * Service per la gestione delle attività di un gruppo
 * Le attività sono ora collegate direttamente al gruppo (non più tramite itinerario)
 */
@Injectable({ providedIn: 'root' })
export class ActivityService {
	private http = inject(HttpClient);
	private apiUrl = '/api';

	// ================== CRUD Activities ==================

	/**
	 * Ottiene tutte le attività di un gruppo
	 */
	getActivities(groupId: number): Observable<Activity[]> {
		return this.http.get<Activity[]>(`${this.apiUrl}/groups/${groupId}/activities`);
	}

	/**
	 * Ottiene una singola attività
	 */
	getActivity(groupId: number, activityId: number): Observable<Activity> {
		return this.http.get<Activity>(`${this.apiUrl}/groups/${groupId}/activities/${activityId}`);
	}

	/**
	 * Crea un nuovo Event
	 */
	createEvent(groupId: number, request: EventRequest): Observable<Event> {
		return this.http.post<Event>(`${this.apiUrl}/groups/${groupId}/activities/events`, request);
	}

	/**
	 * Crea un nuovo Trip
	 */
	createTrip(groupId: number, request: TripRequest): Observable<Trip> {
		return this.http.post<Trip>(`${this.apiUrl}/groups/${groupId}/activities/trips`, request);
	}

	/**
	 * Aggiorna un Event esistente
	 */
	updateEvent(groupId: number, activityId: number, request: EventRequest): Observable<Event> {
		return this.http.put<Event>(`${this.apiUrl}/groups/${groupId}/activities/events/${activityId}`, request);
	}

	/**
	 * Aggiorna un Trip esistente
	 */
	updateTrip(groupId: number, activityId: number, request: TripRequest): Observable<Trip> {
		return this.http.put<Trip>(`${this.apiUrl}/groups/${groupId}/activities/trips/${activityId}`, request);
	}

	/**
	 * Crea una nuova attività nel gruppo
	 * @deprecated Usa createEvent() o createTrip() invece
	 */
	createActivity(groupId: number, request: ActivityRequest): Observable<Activity> {
		return this.http.post<Activity>(`${this.apiUrl}/groups/${groupId}/activities`, request);
	}

	/**
	 * Aggiorna un'attività esistente
	 * @deprecated Usa updateEvent() o updateTrip() invece
	 */
	updateActivity(groupId: number, activityId: number, request: ActivityRequest): Observable<Activity> {
		return this.http.put<Activity>(`${this.apiUrl}/groups/${groupId}/activities/${activityId}`, request);
	}

	/**
	 * Elimina un'attività
	 */
	deleteActivity(groupId: number, activityId: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/groups/${groupId}/activities/${activityId}`);
	}

	/**
	 * Toggle dello stato di completamento di un'attività
	 */
	toggleActivityCompletion(groupId: number, activityId: number): Observable<Activity> {
		return this.http.patch<Activity>(
			`${this.apiUrl}/groups/${groupId}/activities/${activityId}/toggle-completion`,
			{}
		);
	}

	// ================== Calendar Views ==================

	/**
	 * Ottiene tutte le attività in formato calendario
	 */
	getAllActivitiesCalendar(groupId: number): Observable<ActivityCalendar[]> {
		return this.http.get<ActivityCalendar[]>(`${this.apiUrl}/groups/${groupId}/calendar`);
	}

	/**
	 * Ottiene le attività in un range di date specifico
	 */
	getCalendarByRange(groupId: number, startDate: string, endDate: string): Observable<ActivityCalendar[]> {
		return this.http.get<ActivityCalendar[]>(
			`${this.apiUrl}/groups/${groupId}/calendar/range`,
			{ params: { start: startDate, end: endDate } }
		);
	}

	/**
	 * Ottiene le attività di un mese specifico
	 */
	getCalendarByMonth(groupId: number, year: number, month: number): Observable<ActivityCalendar[]> {
		return this.http.get<ActivityCalendar[]>(
			`${this.apiUrl}/groups/${groupId}/calendar/month`,
			{ params: { year: year.toString(), month: month.toString() } }
		);
	}

	/**
	 * Ottiene le attività di una settimana specifica
	 */
	getCalendarByWeek(groupId: number, year: number, week: number): Observable<ActivityCalendar[]> {
		return this.http.get<ActivityCalendar[]>(
			`${this.apiUrl}/groups/${groupId}/calendar/week`,
			{ params: { year: year.toString(), week: week.toString() } }
		);
	}

	// ================== Participants ==================

	/**
	 * Aggiunge un partecipante a un'attività
	 */
	addParticipant(
		groupId: number,
		activityId: number,
		request: ActivityParticipantRequest
	): Observable<ActivityParticipant> {
		return this.http.post<ActivityParticipant>(
			`${this.apiUrl}/groups/${groupId}/activities/${activityId}/participants`,
			request
		);
	}

	/**
	 * Ottiene tutti i partecipanti di un'attività
	 */
	getParticipants(groupId: number, activityId: number): Observable<ActivityParticipant[]> {
		return this.http.get<ActivityParticipant[]>(
			`${this.apiUrl}/groups/${groupId}/activities/${activityId}/participants`
		);
	}

	/**
	 * Aggiorna lo status di un partecipante
	 */
	updateParticipantStatus(
		groupId: number,
		activityId: number,
		participantId: number,
		request: UpdateParticipantStatusRequest
	): Observable<ActivityParticipant> {
		return this.http.put<ActivityParticipant>(
			`${this.apiUrl}/groups/${groupId}/activities/${activityId}/participants/${participantId}/status`,
			request
		);
	}

	/**
	 * Rimuove un partecipante da un'attività
	 */
	removeParticipant(groupId: number, activityId: number, participantId: number): Observable<void> {
		return this.http.delete<void>(
			`${this.apiUrl}/groups/${groupId}/activities/${activityId}/participants/${participantId}`
		);
	}

	// ================== Expenses ==================

	/**
	 * Aggiunge una spesa a un'attività
	 */
	addExpense(
		groupId: number,
		activityId: number,
		request: ActivityExpenseRequest
	): Observable<ActivityExpense> {
		return this.http.post<ActivityExpense>(
			`${this.apiUrl}/groups/${groupId}/activities/${activityId}/expenses`,
			request
		);
	}

	/**
	 * Ottiene tutte le spese di un'attività
	 */
	getExpenses(groupId: number, activityId: number): Observable<ActivityExpense[]> {
		return this.http.get<ActivityExpense[]>(
			`${this.apiUrl}/groups/${groupId}/activities/${activityId}/expenses`
		);
	}

	/**
	 * Elimina una spesa
	 */
	deleteExpense(groupId: number, activityId: number, expenseId: number): Observable<void> {
		return this.http.delete<void>(
			`${this.apiUrl}/groups/${groupId}/activities/${activityId}/expenses/${expenseId}`
		);
	}

	// ================== Reordering ==================

	/**
	 * Riordina le attività
	 */
	reorderActivities(groupId: number, activityIds: number[]): Observable<void> {
		return this.http.put<void>(
			`${this.apiUrl}/groups/${groupId}/activities/reorder`,
			{ activityIds }
		);
	}
}
