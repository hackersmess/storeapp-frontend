import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideMenu, lucideX, lucideLogOut, lucideUser, lucideSettings } from '@ng-icons/lucide';

@Component({
	selector: 'app-navbar',
	standalone: true,
	imports: [CommonModule, RouterModule, NgIconComponent],
	providers: [provideIcons({ lucideMenu, lucideX, lucideLogOut, lucideUser, lucideSettings })],
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
