import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-navbar',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
	authService = inject(AuthService);

	currentUser$ = this.authService.currentUser$;
	isMenuOpen = false;

	toggleMenu(): void {
		this.isMenuOpen = !this.isMenuOpen;
	}

	logout(): void {
		this.authService.logout();
		this.isMenuOpen = false;
	}
}
