import { Component, OnInit, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { Group } from '../../../models/group.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCirclePlus, lucideCalendar, lucideUsers } from '@ng-icons/lucide';

@Component({
	selector: 'app-groups-list',
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	providers: [provideIcons({ lucideCirclePlus, lucideCalendar, lucideUsers })],
	templateUrl: './groups-list.component.html',
	styleUrls: ['./groups-list.component.scss']
})
export class GroupsListComponent implements OnInit {
	private groupService = inject(GroupService);
	private router = inject(Router);
	private platformId = inject(PLATFORM_ID);
	private isBrowser = isPlatformBrowser(this.platformId);

	// Signal per lo stato del componente
	groups = signal<Group[]>([]);
	loading = signal(false);
	error = signal<string | null>(null);

	// Computed signal - si aggiorna automaticamente quando groups cambia
	hasGroups = computed(() => this.groups().length > 0);
	groupCount = computed(() => this.groups().length);

	ngOnInit() {
		// Carica i gruppi solo nel browser, non durante SSR
		if (this.isBrowser) {
			this.loadGroups();
		}
	}

	loadGroups() {
		this.loading.set(true);
		this.error.set(null);

		console.log('GroupsListComponent: Starting loadGroups()');
		this.groupService.getMyGroups().subscribe({
			next: (groups) => {
				console.log('GroupsListComponent: Received groups:', groups);
				this.groups.set(groups);
				this.loading.set(false);
				// ✅ NON serve più this.cdr.detectChanges()!
				console.log('GroupsListComponent: Groups signal updated, count =', this.groupCount());
			},
			error: (err) => {
				console.error('GroupsListComponent: Error loading groups:', err);
				this.error.set('Errore nel caricamento dei gruppi');
				this.loading.set(false);
				// ✅ NON serve più this.cdr.detectChanges()!
			},
			complete: () => {
				console.log('GroupsListComponent: Observable completed');
			}
		});
	}

	createGroup() {
		this.router.navigate(['/groups/create']);
	}

	viewGroup(id: number) {
		this.router.navigate(['/groups', id]);
	}

	formatDate(dateString?: string): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('it-IT');
	}
}
