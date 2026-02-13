import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
	Group,
	GroupMember,
	CreateGroupRequest,
	UpdateGroupRequest,
	AddMemberRequest,
	UpdateMemberRoleRequest
} from '../models/group.model';
import { User } from '../models/user.model';

@Injectable({
	providedIn: 'root'
})
export class GroupService {
	private http = inject(HttpClient);
	private apiUrl = '/api/groups';
	private usersApiUrl = '/api/users';

	/**
	 * Crea un nuovo gruppo
	 */
	createGroup(request: CreateGroupRequest): Observable<Group> {
		return this.http.post<Group>(this.apiUrl, request);
	}

	/**
	 * Ottiene tutti i gruppi dell'utente corrente
	 */
	getMyGroups(): Observable<Group[]> {
		console.log('GroupService: Fetching user groups from', this.apiUrl);
		return this.http.get<Group[]>(this.apiUrl).pipe(
			map(groups => {
				console.log('GroupService: Received groups:', groups);
				return groups;
			}),
			catchError(error => {
				console.error('GroupService: Error fetching groups:', error);
				throw error;
			})
		);
	}

	/**
	 * Ottiene i dettagli di un gruppo specifico
	 */
	getGroup(id: number): Observable<Group> {
		return this.http.get<Group>(`${this.apiUrl}/${id}`);
	}

	/**
	 * Aggiorna un gruppo
	 */
	updateGroup(id: number, request: UpdateGroupRequest): Observable<Group> {
		return this.http.put<Group>(`${this.apiUrl}/${id}`, request);
	}

	/**
	 * Elimina un gruppo
	 */
	deleteGroup(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}

	/**
	 * Ottiene tutti i membri di un gruppo
	 */
	getGroupMembers(groupId: number): Observable<GroupMember[]> {
		return this.http.get<GroupMember[]>(`${this.apiUrl}/${groupId}/members`);
	}

	/**
	 * Aggiunge un membro al gruppo
	 */
	addMember(groupId: number, request: AddMemberRequest): Observable<GroupMember> {
		return this.http.post<GroupMember>(`${this.apiUrl}/${groupId}/members`, request);
	}

	/**
	 * Rimuove un membro dal gruppo
	 */
	removeMember(groupId: number, memberId: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${groupId}/members/${memberId}`);
	}

	/**
	 * Abbandona un gruppo
	 */
	leaveGroup(groupId: number): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/${groupId}/leave`, {});
	}

	/**
	 * Cambia il ruolo di un membro
	 */
	updateMemberRole(groupId: number, memberId: number, request: UpdateMemberRoleRequest): Observable<GroupMember> {
		return this.http.put<GroupMember>(`${this.apiUrl}/${groupId}/members/${memberId}/role`, request);
	}

	/**
	 * Cerca utenti per username o email
	 */
	searchUsers(query: string): Observable<User[]> {
		if (!query || query.trim().length < 2) {
			return of([]);
		}

		const params = new HttpParams().set('q', query.trim());

		return this.http.get<User[]>(`${this.usersApiUrl}/search`, { params }).pipe(
			catchError(error => {
				console.error('Error searching users:', error);
				return of([]);
			})
		);
	}

	/**
	 * Ottiene tutti gli utenti disponibili
	 * @deprecated Usa getAvailableUsers(groupId) per evitare di mostrare utenti già membri
	 */
	getAllUsers(): Observable<User[]> {
		return this.http.get<User[]>(this.usersApiUrl).pipe(
			catchError(error => {
				console.error('Error fetching users:', error);
				return of([]);
			})
		);
	}

	/**
	 * Ottiene gli utenti disponibili da aggiungere al gruppo
	 * (esclude gli utenti già membri del gruppo)
	 */
	getAvailableUsers(groupId: number): Observable<User[]> {
		return this.http.get<User[]>(`${this.apiUrl}/${groupId}/available-users`).pipe(
			catchError(error => {
				console.error('Error fetching available users:', error);
				return of([]);
			})
		);
	}
}
