import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	private apiUrl = '/api/users';

	constructor(private http: HttpClient) { }

	getAllUsers(): Observable<User[]> {
		return this.http.get<User[]>(this.apiUrl);
	}

	getUserById(id: number): Observable<User> {
		return this.http.get<User>(`${this.apiUrl}/${id}`);
	}

	getUserByEmail(email: string): Observable<User> {
		return this.http.get<User>(`${this.apiUrl}/email/${email}`);
	}

	createUser(request: CreateUserRequest): Observable<User> {
		return this.http.post<User>(this.apiUrl, request);
	}

	updateUser(id: number, request: UpdateUserRequest): Observable<User> {
		return this.http.put<User>(`${this.apiUrl}/${id}`, request);
	}

	deleteUser(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}

	getUserCount(): Observable<number> {
		return this.http.get<number>(`${this.apiUrl}/count`);
	}
}
