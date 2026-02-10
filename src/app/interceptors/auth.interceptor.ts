import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

/**
 * Interceptor che aggiunge automaticamente il JWT token alle richieste HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService);
	const token = authService.getToken();

	// Non aggiungere token alle richieste di auth
	if (req.url.includes('/api/auth/login') ||
		req.url.includes('/api/auth/register')) {
		return next(req);
	}

	// Aggiungi token se presente
	if (token) {
		req = req.clone({
			setHeaders: {
				Authorization: `Bearer ${token}`
			}
		});
	}

	// Gestisci errori 401 (token scaduto)
	return next(req).pipe(
		catchError(error => {
			if (error.status === 401 && !req.url.includes('/api/auth/refresh')) {
				// Token scaduto, prova refresh
				return authService.refreshToken().pipe(
					switchMap(() => {
						// Riprova richiesta con nuovo token
						const newToken = authService.getToken();
						const clonedReq = req.clone({
							setHeaders: {
								Authorization: `Bearer ${newToken}`
							}
						});
						return next(clonedReq);
					}),
					catchError(refreshError => {
						// Refresh fallito, logout
						authService.logout();
						return throwError(() => refreshError);
					})
				);
			}
			return throwError(() => error);
		})
	);
};
