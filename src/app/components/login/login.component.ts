import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideMail, lucideLock, lucideEye, lucideEyeOff } from '@ng-icons/lucide';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconComponent],
	providers: [provideIcons({ lucideAlertCircle, lucideMail, lucideLock, lucideEye, lucideEyeOff })],
	templateUrl: './login.component.html',
	styleUrl: './login.component.scss'
})
export class LoginComponent {
	private fb = inject(FormBuilder);
	private authService = inject(AuthService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);

	loginForm: FormGroup;

	// Signals per gestire lo stato del componente
	isLoading = signal(false);
	errorMessage = signal('');
	showPassword = signal(false);

	constructor() {
		this.loginForm = this.fb.group({
			email: ['', [Validators.required, Validators.email, this.emailValidator]],
			password: ['', [Validators.required, Validators.minLength(8)]]
		});
	}

	/**
	 * Validator custom per email che corrisponde alla regex del backend (PostgreSQL)
	 * Richiede TLD valido di almeno 2 caratteri
	 */
	emailValidator(control: any): any {
		if (!control.value) {
			return null;
		}
		// Pattern che corrisponde al backend: email con TLD di almeno 2 caratteri
		const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
		const valid = emailPattern.test(control.value);
		return valid ? null : { invalidEmail: true };
	}

	onSubmit(): void {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		this.isLoading.set(true);
		this.errorMessage.set('');

		const loginData = this.loginForm.value;
		console.log('Login attempt:', { email: loginData.email, passwordLength: loginData.password?.length });

		this.authService.login(loginData).subscribe({
			next: (response) => {
				console.log('Login successful:', response.user);
				this.isLoading.set(false);
				// Login riuscito
				const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
				this.router.navigate([returnUrl]);
			},
			error: (error) => {
				console.error('Login error:', error);
				console.error('Error status:', error.status);
				console.error('Error body:', error.error);

				this.isLoading.set(false);

				// Gestione errori specifici
				if (error.status === 401) {
					this.errorMessage.set('Email o password non corretti');
				} else if (error.status === 400) {
					// Errore di validazione - mostra il messaggio specifico se disponibile
					if (error.error?.error) {
						this.errorMessage.set(error.error.error);
					} else if (error.error?.message) {
						this.errorMessage.set(error.error.message);
					} else {
						this.errorMessage.set('Dati non validi. Controlla i campi.');
					}
				} else if (error.status === 0) {
					this.errorMessage.set('Impossibile contattare il server. Verifica che il backend sia in esecuzione.');
				} else if (error.status === 500) {
					this.errorMessage.set('Errore del server. Riprova più tardi.');
				} else {
					this.errorMessage.set('Errore durante il login. Riprova.');
				}

				console.log('Final error message:', this.errorMessage());
			}
		});
	}

	togglePasswordVisibility(): void {
		this.showPassword.update(value => !value);
	}

	// Getter per facilità accesso ai form controls
	get email() { return this.loginForm.get('email'); }
	get password() { return this.loginForm.get('password'); }
}
