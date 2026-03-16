import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideCheckCircle, lucideEye, lucideEyeOff } from '@ng-icons/lucide';

@Component({
	selector: 'app-reset-password',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconComponent],
	providers: [provideIcons({ lucideAlertCircle, lucideCheckCircle, lucideEye, lucideEyeOff })],
	templateUrl: './reset-password.component.html',
	styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
	private fb = inject(FormBuilder);
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private authService = inject(AuthService);

	resetForm: FormGroup;
	isLoading = signal(false);
	errorMessage = signal('');
	successMessage = signal('');
	showPassword = signal(false);
	showConfirmPassword = signal(false);
	token = signal('');

	constructor() {
		this.resetForm = this.fb.group(
			{
				password: ['', [Validators.required, Validators.minLength(8)]],
				confirmPassword: ['', [Validators.required]]
			},
			{ validators: this.passwordMatchValidator }
		);

		const queryToken = this.route.snapshot.queryParamMap.get('token') || '';
		this.token.set(queryToken);
		if (!queryToken) {
			this.errorMessage.set('Token mancante o non valido. Richiedi un nuovo link di reset.');
		}
	}

	passwordMatchValidator(control: FormGroup): { passwordMismatch: true } | null {
		const password = control.get('password')?.value;
		const confirmPassword = control.get('confirmPassword')?.value;
		return password === confirmPassword ? null : { passwordMismatch: true };
	}

	onSubmit(): void {
		if (!this.token()) {
			this.errorMessage.set('Token mancante o non valido.');
			return;
		}

		if (this.resetForm.invalid) {
			this.resetForm.markAllAsTouched();
			return;
		}

		this.isLoading.set(true);
		this.errorMessage.set('');
		this.successMessage.set('');

		this.authService
			.resetPassword({
				token: this.token(),
				newPassword: this.resetForm.value.password
			})
			.subscribe({
				next: (response) => {
					this.isLoading.set(false);
					this.successMessage.set(response.message || 'Password aggiornata con successo.');
					setTimeout(() => this.router.navigate(['/login']), 1200);
				},
				error: (error) => {
					this.isLoading.set(false);
					if (error.status === 400) {
						this.errorMessage.set(error.error?.message || 'Token non valido o scaduto.');
					} else if (error.status === 0) {
						this.errorMessage.set('Impossibile contattare il server.');
					} else {
						this.errorMessage.set('Errore durante il reset password. Riprova.');
					}
				}
			});
	}

	togglePasswordVisibility(): void {
		this.showPassword.update((value) => !value);
	}

	toggleConfirmPasswordVisibility(): void {
		this.showConfirmPassword.update((value) => !value);
	}

	get password() {
		return this.resetForm.get('password');
	}

	get confirmPassword() {
		return this.resetForm.get('confirmPassword');
	}
}
