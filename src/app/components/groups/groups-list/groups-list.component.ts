import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { Group } from '../../../models/group.model';

@Component({
	selector: 'app-groups-list',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './groups-list.component.html',
	styleUrls: ['./groups-list.component.scss']
})
export class GroupsListComponent implements OnInit {
	private groupService = inject(GroupService);
	private router = inject(Router);

	groups: Group[] = [];
	loading = false;
	error: string | null = null;

	ngOnInit() {
		this.loadGroups();
	}

	loadGroups() {
		this.loading = true;
		this.error = null;

		this.groupService.getMyGroups().subscribe({
			next: (groups) => {
				this.groups = groups;
				this.loading = false;
			},
			error: (err) => {
				this.error = 'Errore nel caricamento dei gruppi';
				this.loading = false;
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
