import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard per proteggere route che richiedono autenticazione
 */
export const authGuard: CanActivateFn = (route, state) => {
	const authService = inject(AuthService);
	const router = inject(Router);

	if (authService.isAuthenticated() && !authService.isTokenExpired()) {
		return true;
	}

	// Redirect a login con returnUrl
	router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
	return false;
};

/**
 * Guard per redirect da login/register se già autenticato
 */
export const loginGuard: CanActivateFn = (route, state) => {
	const authService = inject(AuthService);
	const router = inject(Router);

	if (authService.isAuthenticated() && !authService.isTokenExpired()) {
		// Già autenticato, redirect a home
		router.navigate(['/']);
		return false;
	}

	return true;
};
