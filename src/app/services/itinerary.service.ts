import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
	Itinerary,
	Activity,
	ActivityParticipant,
	ActivityExpense,
	ActivityCalendar,
	ItineraryRequest,
	ActivityRequest,
	ActivityParticipantRequest,
	ActivityExpenseRequest,
	UpdateParticipantStatusRequest
} from '../models/itinerary.model';

@Injectable({
	providedIn: 'root'
})
export class ItineraryService {
	private http = inject(HttpClient);
	private apiUrl = '/api/groups';

	// =====================================
	// ITINERARY ENDPOINTS
	// =====================================

	/**
	 * Crea un nuovo itinerario per un gruppo
	 */
	createItinerary(groupId: number, request: ItineraryRequest): Observable<Itinerary> {
		return this.http.post<Itinerary>(`${this.apiUrl}/${groupId}/itinerary`, request);
	}

	/**
	 * Ottiene l'itinerario di un gruppo (info base)
	 */
	getItinerary(groupId: number): Observable<Itinerary> {
		return this.http.get<Itinerary>(`${this.apiUrl}/${groupId}/itinerary`);
	}

	/**
	 * Ottiene l'itinerario con tutte le attività
	 */
	getItineraryWithActivities(groupId: number): Observable<Itinerary> {
		return this.http.get<Itinerary>(`${this.apiUrl}/${groupId}/itinerary/full`);
	}

	/**
	 * Aggiorna un itinerario
	 */
	updateItinerary(groupId: number, request: ItineraryRequest): Observable<Itinerary> {
		return this.http.put<Itinerary>(`${this.apiUrl}/${groupId}/itinerary`, request);
	}

	/**
	 * Elimina un itinerario (solo admin)
	 */
	deleteItinerary(groupId: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${groupId}/itinerary`);
	}

	// =====================================
	// ACTIVITY ENDPOINTS
	// =====================================

	/**
	 * Crea una nuova attività
	 */
	createActivity(itineraryId: number, request: ActivityRequest): Observable<Activity> {
		return this.http.post<Activity>(`/api/itineraries/${itineraryId}/activities`, request);
	}

	/**
	 * Ottiene tutte le attività di un itinerario
	 */
	getActivities(itineraryId: number): Observable<Activity[]> {
		return this.http.get<Activity[]>(`/api/itineraries/${itineraryId}/activities`);
	}

	/**
	 * Ottiene un'attività specifica con dettagli (participants + expenses)
	 */
	getActivity(itineraryId: number, activityId: number): Observable<Activity> {
		return this.http.get<Activity>(`/api/itineraries/${itineraryId}/activities/${activityId}`);
	}

	/**
	 * Aggiorna un'attività
	 */
	updateActivity(itineraryId: number, activityId: number, request: ActivityRequest): Observable<Activity> {
		return this.http.put<Activity>(`/api/itineraries/${itineraryId}/activities/${activityId}`, request);
	}

	/**
	 * Elimina un'attività
	 */
	deleteActivity(itineraryId: number, activityId: number): Observable<void> {
		return this.http.delete<void>(`/api/itineraries/${itineraryId}/activities/${activityId}`);
	}

	/**
	 * Toggle completamento attività
	 */
	toggleActivityCompletion(itineraryId: number, activityId: number): Observable<Activity> {
		return this.http.post<Activity>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/toggle-completion`,
			{}
		);
	}

	/**
	 * Riordina attività
	 */
	reorderActivities(itineraryId: number, activityIds: number[]): Observable<void> {
		return this.http.post<void>(`/api/itineraries/${itineraryId}/activities/reorder`, {
			activityIds
		});
	}

	// =====================================
	// CALENDAR ENDPOINTS
	// =====================================

	/**
	 * Ottiene tutte le attività in formato calendario
	 */
	getAllActivitiesCalendar(itineraryId: number): Observable<ActivityCalendar[]> {
		return this.http.get<ActivityCalendar[]>(`/api/itineraries/${itineraryId}/calendar`);
	}

	/**
	 * Ottiene attività in un range di date
	 */
	getCalendarByRange(itineraryId: number, startDate: string, endDate: string): Observable<ActivityCalendar[]> {
		return this.http.get<ActivityCalendar[]>(
			`/api/itineraries/${itineraryId}/calendar/range?start=${startDate}&end=${endDate}`
		);
	}

	/**
	 * Ottiene attività per un mese specifico
	 */
	getCalendarByMonth(itineraryId: number, year: number, month: number): Observable<ActivityCalendar[]> {
		return this.http.get<ActivityCalendar[]>(
			`/api/itineraries/${itineraryId}/calendar/month?year=${year}&month=${month}`
		);
	}

	/**
	 * Ottiene attività per una settimana
	 */
	getCalendarByWeek(itineraryId: number, date: string): Observable<ActivityCalendar[]> {
		return this.http.get<ActivityCalendar[]>(`/api/itineraries/${itineraryId}/calendar/week?date=${date}`);
	}

	// =====================================
	// PARTICIPANT ENDPOINTS
	// =====================================

	/**
	 * Ottiene tutti i partecipanti di un'attività
	 */
	getParticipants(itineraryId: number, activityId: number): Observable<ActivityParticipant[]> {
		return this.http.get<ActivityParticipant[]>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/participants`
		);
	}

	/**
	 * Aggiunge un partecipante a un'attività
	 */
	addParticipant(
		itineraryId: number,
		activityId: number,
		request: ActivityParticipantRequest
	): Observable<ActivityParticipant> {
		return this.http.post<ActivityParticipant>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/participants`,
			request
		);
	}

	/**
	 * Aggiorna lo status di un partecipante
	 */
	updateParticipantStatus(
		itineraryId: number,
		activityId: number,
		participantId: number,
		request: UpdateParticipantStatusRequest
	): Observable<ActivityParticipant> {
		return this.http.put<ActivityParticipant>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/participants/${participantId}`,
			request
		);
	}

	/**
	 * Rimuove un partecipante da un'attività
	 */
	removeParticipant(itineraryId: number, activityId: number, participantId: number): Observable<void> {
		return this.http.delete<void>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/participants/${participantId}`
		);
	}

	// =====================================
	// EXPENSE ENDPOINTS
	// =====================================

	/**
	 * Ottiene tutte le spese di un'attività
	 */
	getExpenses(itineraryId: number, activityId: number): Observable<ActivityExpense[]> {
		return this.http.get<ActivityExpense[]>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/expenses`
		);
	}

	/**
	 * Aggiunge una spesa a un'attività
	 */
	addExpense(
		itineraryId: number,
		activityId: number,
		request: ActivityExpenseRequest
	): Observable<ActivityExpense> {
		return this.http.post<ActivityExpense>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/expenses`,
			request
		);
	}

	/**
	 * Aggiorna una spesa
	 */
	updateExpense(
		itineraryId: number,
		activityId: number,
		expenseId: number,
		request: ActivityExpenseRequest
	): Observable<ActivityExpense> {
		return this.http.put<ActivityExpense>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/expenses/${expenseId}`,
			request
		);
	}

	/**
	 * Elimina una spesa
	 */
	deleteExpense(itineraryId: number, activityId: number, expenseId: number): Observable<void> {
		return this.http.delete<void>(
			`/api/itineraries/${itineraryId}/activities/${activityId}/expenses/${expenseId}`
		);
	}
}
