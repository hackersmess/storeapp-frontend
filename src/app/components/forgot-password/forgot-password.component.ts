import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideCheckCircle } from '@ng-icons/lucide';

@Component({
	selector: 'app-forgot-password',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconComponent],
	providers: [provideIcons({ lucideAlertCircle, lucideCheckCircle })],
	templateUrl: './forgot-password.component.html',
	styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
	private fb = inject(FormBuilder);
	private authService = inject(AuthService);

	forgotForm: FormGroup;
	isLoading = signal(false);
	errorMessage = signal('');
	successMessage = signal('');

	constructor() {
		this.forgotForm = this.fb.group({
			email: ['', [Validators.required, Validators.email, this.emailValidator]]
		});
	}

	emailValidator(control: { value: string }): { invalidEmail: true } | null {
		if (!control.value) {
			return null;
		}
		const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
		return emailPattern.test(control.value) ? null : { invalidEmail: true };
	}

	onSubmit(): void {
		if (this.forgotForm.invalid) {
			this.forgotForm.markAllAsTouched();
			return;
		}

		this.isLoading.set(true);
		this.errorMessage.set('');
		this.successMessage.set('');

		this.authService.forgotPassword(this.forgotForm.value).subscribe({
			next: (response) => {
				this.isLoading.set(false);
				this.successMessage.set(
					response.message || "Se l'email esiste, riceverai un link per il reset password"
				);
			},
			error: (error) => {
				this.isLoading.set(false);
				if (error.status === 400) {
					this.errorMessage.set(error.error?.message || 'Email non valida');
				} else if (error.status === 0) {
					this.errorMessage.set('Impossibile contattare il server.');
				} else {
					this.errorMessage.set('Errore durante la richiesta di reset. Riprova.');
				}
			}
		});
	}

	get email() {
		return this.forgotForm.get('email');
	}
}
