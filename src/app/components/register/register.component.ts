import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideUser, lucideMail, lucideLock, lucideEye, lucideEyeOff } from '@ng-icons/lucide';

@Component({
	selector: 'app-register',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconComponent],
	providers: [provideIcons({ lucideAlertCircle, lucideUser, lucideMail, lucideLock, lucideEye, lucideEyeOff })],
	templateUrl: './register.component.html',
	styleUrl: './register.component.scss'
})
export class RegisterComponent {
	private fb = inject(FormBuilder);
	private authService = inject(AuthService);
	private router = inject(Router);

	registerForm: FormGroup;

	// Signals per gestire lo stato del componente
	isLoading = signal(false);
	errorMessage = signal('');
	showPassword = signal(false);
	showConfirmPassword = signal(false);

	constructor() {
		this.registerForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			email: ['', [Validators.required, Validators.email, this.emailValidator]],
			password: ['', [Validators.required, Validators.minLength(8)]],
			confirmPassword: ['', [Validators.required]]
		}, {
			validators: this.passwordMatchValidator
		});
	}

	/**
	 * Validator custom per email che corrisponde alla regex del backend (PostgreSQL)
	 * Richiede TLD valido di almeno 2 caratteri
	 */
	emailValidator(control: AbstractControl): ValidationErrors | null {
		if (!control.value) {
			return null;
		}
		// Pattern che corrisponde al backend: email con TLD di almeno 2 caratteri
		const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
		const valid = emailPattern.test(control.value);
		return valid ? null : { invalidEmail: true };
	}

	/**
	 * Validator custom per verificare che password e confirmPassword coincidano
	 */
	passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
		const password = control.get('password');
		const confirmPassword = control.get('confirmPassword');

		if (!password || !confirmPassword) {
			return null;
		}

		return password.value === confirmPassword.value ? null : { passwordMismatch: true };
	}

	onSubmit(): void {
		if (this.registerForm.invalid) {
			this.registerForm.markAllAsTouched();
			return;
		}

		this.isLoading.set(true);
		this.errorMessage.set('');

		// Rimuovi confirmPassword prima di inviare
		const { confirmPassword, ...registerData } = this.registerForm.value;

		this.authService.register(registerData).subscribe({
			next: (response) => {
				// Registrazione riuscita, redirect a home
				this.isLoading.set(false);
				this.router.navigate(['/']);
			},
			error: (error) => {
				console.error('Registration error:', error);
				console.error('Error status:', error.status);
				console.error('Error body:', error.error);

				this.isLoading.set(false);

				// Gestione errori specifici
				if (error.status === 409) {
					this.errorMessage.set('Email già registrata');
					console.log('Setting error message to:', this.errorMessage());
				} else if (error.status === 400) {
					// Errore di validazione - mostra il messaggio specifico se disponibile
					if (error.error?.error) {
						this.errorMessage.set(error.error.error);
					} else if (error.error?.message) {
						this.errorMessage.set(error.error.message);
					} else {
						this.errorMessage.set('Dati non validi. Controlla i campi.');
					}
					console.log('Setting error message to:', this.errorMessage());
				} else if (error.status === 0) {
					this.errorMessage.set('Impossibile contattare il server. Verifica che il backend sia in esecuzione.');
				} else if (error.status === 500) {
					this.errorMessage.set('Errore del server. Riprova più tardi.');
				} else {
					this.errorMessage.set('Errore durante la registrazione. Riprova.');
				}

				console.log('Final error message:', this.errorMessage());
			}
		});
	}

	togglePasswordVisibility(): void {
		this.showPassword.update(value => !value);
	}

	toggleConfirmPasswordVisibility(): void {
		this.showConfirmPassword.update(value => !value);
	}

	// Getter per facilità accesso ai form controls
	get name() { return this.registerForm.get('name'); }
	get email() { return this.registerForm.get('email'); }
	get password() { return this.registerForm.get('password'); }
	get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
