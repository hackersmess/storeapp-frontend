import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadcrumbState {
	/** Titolo mostrato nella navbar (es. "Gruppi", "Vacanze Sardegna") */
	title: string;
	/** Se true, mostra la freccia ← e il canGoBack. Se false mostra solo il titolo */
	showBack: boolean;
	/** Rotta a cui torna il back button. Se null usa Location.back() */
	backRoute: string | null;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
	private router = inject(Router);
	private activatedRoute = inject(ActivatedRoute);

	private _state = signal<BreadcrumbState>({
		title: '',
		showBack: false,
		backRoute: null
	});

	/** Stato corrente leggibile da navbar e altri componenti */
	readonly state = computed(() => this._state());

	constructor() {
		this.router.events
			.pipe(filter(e => e instanceof NavigationEnd))
			.subscribe(() => this.resolveFromRoute());
	}

	/** Aggiornamento esplicito dal componente (es. quando arriva il nome del gruppo dal server) */
	set(state: Partial<BreadcrumbState>) {
		this._state.update(current => ({ ...current, ...state }));
	}

	private resolveFromRoute() {
		const url = this.router.url.split('?')[0];

		// /groups/:id/edit
		if (/^\/groups\/\d+\/edit$/.test(url)) {
			this._state.set({ title: 'Modifica Gruppo', showBack: true, backRoute: null });
			return;
		}
		// /groups/create
		if (url === '/groups/create') {
			this._state.set({ title: 'Crea Gruppo', showBack: true, backRoute: '/groups' });
			return;
		}
		// /groups/:id
		if (/^\/groups\/\d+$/.test(url)) {
			// Il titolo verrà aggiornato dal GroupDetailComponent quando carica il gruppo
			this._state.set({ title: '...', showBack: true, backRoute: '/groups' });
			return;
		}
		// /groups
		if (url === '/groups') {
			this._state.set({ title: 'I Miei Gruppi', showBack: true, backRoute: '/home' });
			return;
		}
		// /home e radice
		this._state.set({ title: '', showBack: false, backRoute: null });
	}
}
