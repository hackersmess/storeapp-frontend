import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		component: LoginComponent,
		canActivate: [loginGuard]
	},
	{
		path: 'register',
		component: RegisterComponent,
		canActivate: [loginGuard]
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'home'
	},
	{
		path: 'home',
		loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
		canActivate: [authGuard]
	},
	{
		path: '**',
		redirectTo: 'home'
	}
];
