import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
	lucideMenu, lucideX, lucideLogOut, lucideUser, lucideSettings,
	lucideChevronLeft
} from '@ng-icons/lucide';

@Component({
	selector: 'app-navbar',
	standalone: true,
	imports: [CommonModule, RouterModule, NgIconComponent],
	providers: [provideIcons({ lucideMenu, lucideX, lucideLogOut, lucideUser, lucideSettings, lucideChevronLeft })],
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
	authService = inject(AuthService);
	breadcrumb = inject(BreadcrumbService);
	private location = inject(Location);
	private router = inject(Router);

	currentUser$ = this.authService.currentUser$;
	isMenuOpen = false;

	toggleMenu(): void {
		this.isMenuOpen = !this.isMenuOpen;
	}

	logout(): void {
		this.authService.logout();
		this.isMenuOpen = false;
	}

	goBack(): void {
		const backRoute = this.breadcrumb.state().backRoute;
		if (backRoute) {
			this.router.navigate([backRoute]);
		} else {
			this.location.back();
		}
	}
}
