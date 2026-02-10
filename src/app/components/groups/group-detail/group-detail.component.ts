import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { Group, GroupMember, GroupRole } from '../../../models/group.model';

@Component({
	selector: 'app-group-detail',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './group-detail.component.html',
	styleUrls: ['./group-detail.component.scss']
})
export class GroupDetailComponent implements OnInit {
	private groupService = inject(GroupService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);

	group: Group | null = null;
	loading = false;
	error: string | null = null;
	showDeleteConfirm = false;

	GroupRole = GroupRole;

	ngOnInit() {
		this.route.params.subscribe(params => {
			const id = +params['id'];
			if (id) {
				this.loadGroup(id);
			}
		});
	}

	loadGroup(id: number) {
		this.loading = true;
		this.error = null;

		this.groupService.getGroup(id).subscribe({
			next: (group) => {
				this.group = group;
				this.loading = false;
			},
			error: (err) => {
				console.error('Error loading group:', err);
				this.error = 'Errore nel caricamento del gruppo';
				this.loading = false;
			}
		});
	}

	editGroup() {
		if (this.group) {
			this.router.navigate(['/groups', this.group.id, 'edit']);
		}
	}

	deleteGroup() {
		if (!this.group) return;

		this.loading = true;
		this.groupService.deleteGroup(this.group.id).subscribe({
			next: () => {
				this.router.navigate(['/groups']);
			},
			error: (err) => {
				console.error('Error deleting group:', err);
				this.error = 'Errore nell\'eliminazione del gruppo';
				this.loading = false;
				this.showDeleteConfirm = false;
			}
		});
	}

	leaveGroup() {
		if (!this.group) return;

		if (confirm('Sei sicuro di voler abbandonare questo gruppo?')) {
			this.loading = true;
			this.groupService.leaveGroup(this.group.id).subscribe({
				next: () => {
					this.router.navigate(['/groups']);
				},
				error: (err) => {
					console.error('Error leaving group:', err);
					this.error = 'Errore nell\'abbandonare il gruppo';
					this.loading = false;
				}
			});
		}
	}

	removeMember(member: GroupMember) {
		if (!this.group || !confirm(`Rimuovere ${member.user.name} dal gruppo?`)) return;

		this.groupService.removeMember(this.group.id, member.id).subscribe({
			next: () => {
				this.loadGroup(this.group!.id);
			},
			error: (err) => {
				console.error('Error removing member:', err);
				this.error = 'Errore nella rimozione del membro';
			}
		});
	}

	toggleMemberRole(member: GroupMember) {
		if (!this.group) return;

		const newRole = member.role === GroupRole.ADMIN ? GroupRole.MEMBER : GroupRole.ADMIN;

		this.groupService.updateMemberRole(this.group.id, member.id, { role: newRole }).subscribe({
			next: () => {
				this.loadGroup(this.group!.id);
			},
			error: (err) => {
				console.error('Error updating role:', err);
				this.error = 'Errore nell\'aggiornamento del ruolo';
			}
		});
	}

	formatDate(dateString?: string): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('it-IT');
	}

	formatDateTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleString('it-IT');
	}

	isAdmin(): boolean {
		// TODO: Check if current user is admin
		return true;
	}
}
