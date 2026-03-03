import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideLoader } from '@ng-icons/lucide';

/**
 * Componente di callback OAuth2.
 *
 * Viene raggiunto dopo che il backend ha processato il codice Google e
 * ha reindirizzato qui con i token come query param:
 *   /oauth-callback?token=...&refreshToken=...&user=...
 *
 * Oppure in caso di errore:
 *   /oauth-callback?error=...
 */
@Component({
	selector: 'app-oauth-callback',
	standalone: true,
	imports: [NgIconComponent],
	providers: [provideIcons({ lucideAlertCircle, lucideLoader })],
	template: `
		<div class="oauth-callback-container">
			<div class="oauth-card">
				@if (error()) {
					<div class="oauth-error">
						<ng-icon name="lucideAlertCircle" size="48"></ng-icon>
						<h2>Accesso non riuscito</h2>
						<p>{{ error() }}</p>
						<button class="btn-primary" (click)="goToLogin()">Torna al Login</button>
					</div>
				} @else {
					<div class="oauth-loading">
						<div class="spinner-large"></div>
						<p>Accesso con Google in corso…</p>
					</div>
				}
			</div>
		</div>
	`,
	styles: [`
		.oauth-callback-container {
			min-height: 100dvh;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--color-bg-primary);
		}

		.oauth-card {
			background: var(--color-bg-secondary);
			border: 1px solid var(--color-border);
			border-radius: 16px;
			padding: 48px 40px;
			text-align: center;
			max-width: 380px;
			width: 100%;
		}

		.oauth-loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 20px;

			p {
				color: var(--color-text-secondary);
				font-size: 0.95rem;
			}
		}

		.oauth-error {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 16px;

			ng-icon { color: var(--color-error); }

			h2 {
				color: var(--color-text-primary);
				margin: 0;
			}

			p {
				color: var(--color-text-secondary);
				margin: 0;
				font-size: 0.9rem;
			}
		}

		.spinner-large {
			width: 48px;
			height: 48px;
			border: 4px solid var(--color-border);
			border-top-color: var(--color-accent);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}

		@keyframes spin {
			to { transform: rotate(360deg); }
		}

		.btn-primary {
			margin-top: 8px;
			padding: 10px 24px;
			background: var(--color-accent);
			color: white;
			border: none;
			border-radius: 8px;
			cursor: pointer;
			font-size: 0.9rem;
			font-weight: 500;

			&:hover { opacity: 0.9; }
		}
	`]
})
export class OAuthCallbackComponent implements OnInit {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private authService = inject(AuthService);

	error = signal<string | null>(null);

	ngOnInit(): void {
		const params = this.route.snapshot.queryParamMap;

		const errorParam = params.get('error');
		if (errorParam) {
			this.error.set(errorParam);
			return;
		}

		const token = params.get('token');
		const refreshToken = params.get('refreshToken');
		const userJson = params.get('user');

		if (!token || !refreshToken || !userJson) {
			this.error.set('Parametri di autenticazione mancanti.');
			return;
		}

		try {
			const user = JSON.parse(userJson);
			// Delega la gestione al servizio di autenticazione
			this.authService.handleOAuthSuccess(token, refreshToken, user);
			this.router.navigate(['/groups']);
		} catch (e) {
			this.error.set('Errore nel processare la risposta di autenticazione.');
		}
	}

	goToLogin(): void {
		this.router.navigate(['/login']);
	}
}
