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
		path: 'groups',
		canActivate: [authGuard],
		children: [
			{
				path: '',
				loadComponent: () => import('./components/groups/groups-list/groups-list.component').then(m => m.GroupsListComponent)
			},
			{
				path: 'create',
				loadComponent: () => import('./components/groups/group-form/group-form.component').then(m => m.GroupFormComponent)
			},
			{
				path: ':id',
				loadComponent: () => import('./components/groups/group-detail/group-detail.component').then(m => m.GroupDetailComponent)
			},
			{
				path: ':id/edit',
				loadComponent: () => import('./components/groups/group-form/group-form.component').then(m => m.GroupFormComponent)
			}
		]
	},
	{
		path: '**',
		redirectTo: 'home'
	}
];
