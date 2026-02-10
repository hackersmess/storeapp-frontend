import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, LoginRequest, RegisterRequest, UserDto } from '../models/auth.model';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private http = inject(HttpClient);
	private router = inject(Router);
	private platformId = inject(PLATFORM_ID);
	private isBrowser = isPlatformBrowser(this.platformId);

	// Usa URL assoluto per testare CORS (poi tornare a '/api/auth' per proxy)
	private readonly API_URL = 'http://localhost:8080/api/auth';
	private readonly TOKEN_KEY = 'auth_token';
	private readonly REFRESH_TOKEN_KEY = 'refresh_token';
	private readonly USER_KEY = 'current_user';

	// Observable per lo stato dell'utente corrente
	private currentUserSubject = new BehaviorSubject<UserDto | null>(this.getCurrentUser());
	public currentUser$ = this.currentUserSubject.asObservable();

	constructor() {
		// Verifica token all'avvio (solo nel browser)
		if (this.isBrowser && this.getToken() && !this.getCurrentUser()) {
			// Token presente ma user mancante - logout
			this.logout();
		}
	}

	/**
	 * Registra un nuovo utente
	 */
	register(request: RegisterRequest): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.API_URL}/register`, request).pipe(
			tap(response => this.handleAuthResponse(response))
		);
	}

	/**
	 * Effettua login
	 */
	login(request: LoginRequest): Observable<AuthResponse> {
		console.log('AuthService.login() - Sending request:', {
			url: `${this.API_URL}/login`,
			email: request.email,
			passwordPresent: !!request.password
		});
		return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
			tap(response => {
				console.log('AuthService.login() - Success response:', response);
				this.handleAuthResponse(response);
			})
		);
	}

	/**
	 * Refresh del token
	 */
	refreshToken(): Observable<AuthResponse> {
		const refreshToken = this.getRefreshToken();
		if (!refreshToken) {
			throw new Error('No refresh token available');
		}

		return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
			tap(response => this.handleAuthResponse(response))
		);
	}

	/**
	 * Logout
	 */
	logout(): void {
		// Rimuovi dati da localStorage (solo nel browser)
		if (this.isBrowser) {
			localStorage.removeItem(this.TOKEN_KEY);
			localStorage.removeItem(this.REFRESH_TOKEN_KEY);
			localStorage.removeItem(this.USER_KEY);
		}

		// Aggiorna observable
		this.currentUserSubject.next(null);

		// Redirect a login
		this.router.navigate(['/login']);
	}

	/**
	 * Salva la risposta di autenticazione
	 */
	private handleAuthResponse(response: AuthResponse): void {
		if (this.isBrowser) {
			localStorage.setItem(this.TOKEN_KEY, response.token);
			localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
			localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
		}
		this.currentUserSubject.next(response.user);
	}

	/**
	 * Ottiene il token JWT
	 */
	getToken(): string | null {
		return this.isBrowser ? localStorage.getItem(this.TOKEN_KEY) : null;
	}

	/**
	 * Ottiene il refresh token
	 */
	getRefreshToken(): string | null {
		return this.isBrowser ? localStorage.getItem(this.REFRESH_TOKEN_KEY) : null;
	}

	/**
	 * Ottiene l'utente corrente
	 */
	getCurrentUser(): UserDto | null {
		if (!this.isBrowser) return null;

		const userJson = localStorage.getItem(this.USER_KEY);
		return userJson ? JSON.parse(userJson) : null;
	}

	/**
	 * Verifica se l'utente è autenticato
	 */
	isAuthenticated(): boolean {
		return !!this.getToken();
	}

	/**
	 * Verifica se il token è scaduto (controllo client-side semplice)
	 */
	isTokenExpired(): boolean {
		const token = this.getToken();
		if (!token) return true;

		try {
			// Decodifica JWT (parte payload)
			const payload = JSON.parse(atob(token.split('.')[1]));
			const exp = payload.exp * 1000; // Converti in milliseconds
			return Date.now() >= exp;
		} catch (e) {
			return true;
		}
	}
}
