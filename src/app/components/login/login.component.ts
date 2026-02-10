import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
	templateUrl: './login.component.html',
	styleUrl: './login.component.scss'
})
export class LoginComponent {
	private fb = inject(FormBuilder);
	private authService = inject(AuthService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);

	loginForm: FormGroup;
	isLoading = false;
	errorMessage = '';
	showPassword = false;

	constructor() {
		this.loginForm = this.fb.group({
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(8)]]
		});
	}

	onSubmit(): void {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		this.isLoading = true;
		this.errorMessage = '';

		const loginData = this.loginForm.value;
		console.log('Login attempt:', { email: loginData.email, passwordLength: loginData.password?.length });

		this.authService.login(loginData).subscribe({
			next: (response) => {
				console.log('Login successful:', response.user);
				// Login riuscito
				const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
				this.router.navigate([returnUrl]);
			},
			error: (error) => {
				console.error('Login error:', error);
				this.isLoading = false;
				if (error.status === 401) {
					this.errorMessage = 'Email o password non corretti';
				} else if (error.status === 0) {
					this.errorMessage = 'Impossibile contattare il server. Verifica che il backend sia in esecuzione.';
				} else {
					this.errorMessage = 'Errore durante il login. Riprova.';
				}
			}
		});
	}

	togglePasswordVisibility(): void {
		this.showPassword = !this.showPassword;
	}

	// Getter per facilità accesso ai form controls
	get email() { return this.loginForm.get('email'); }
	get password() { return this.loginForm.get('password'); }
}
