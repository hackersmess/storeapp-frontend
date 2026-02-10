import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-register',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
	templateUrl: './register.component.html',
	styleUrl: './register.component.scss'
})
export class RegisterComponent {
	private fb = inject(FormBuilder);
	private authService = inject(AuthService);
	private router = inject(Router);

	registerForm: FormGroup;
	isLoading = false;
	errorMessage = '';
	showPassword = false;
	showConfirmPassword = false;

	constructor() {
		this.registerForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(8)]],
			confirmPassword: ['', [Validators.required]]
		}, {
			validators: this.passwordMatchValidator
		});
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

		this.isLoading = true;
		this.errorMessage = '';

		// Rimuovi confirmPassword prima di inviare
		const { confirmPassword, ...registerData } = this.registerForm.value;

		this.authService.register(registerData).subscribe({
			next: (response) => {
				// Registrazione riuscita, redirect a home
				this.router.navigate(['/']);
			},
			error: (error) => {
				this.isLoading = false;
				if (error.status === 409) {
					this.errorMessage = 'Email già registrata';
				} else if (error.status === 400) {
					this.errorMessage = 'Dati non validi. Controlla i campi.';
				} else {
					this.errorMessage = 'Errore durante la registrazione. Riprova.';
				}
			}
		});
	}

	togglePasswordVisibility(): void {
		this.showPassword = !this.showPassword;
	}

	toggleConfirmPasswordVisibility(): void {
		this.showConfirmPassword = !this.showConfirmPassword;
	}

	// Getter per facilità accesso ai form controls
	get name() { return this.registerForm.get('name'); }
	get email() { return this.registerForm.get('email'); }
	get password() { return this.registerForm.get('password'); }
	get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
