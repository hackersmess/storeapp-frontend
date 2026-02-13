import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { Group, GroupMember, GroupRole, AddMemberRequest } from '../../../models/group.model';
import { User } from '../../../models/user.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
	selector: 'app-group-detail',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmDialogComponent],
	templateUrl: './group-detail.component.html',
	styleUrls: ['./group-detail.component.scss']
})
export class GroupDetailComponent implements OnInit {
	private groupService = inject(GroupService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private fb = inject(FormBuilder);

	// ✨ Signal invece di variabili normali
	group = signal<Group | null>(null);
	loading = signal(false);
	error = signal<string | null>(null);
	showDeleteConfirm = signal(false);

	// Add member modal
	showAddMemberModal = signal(false);
	searchQuery$ = new Subject<string>();
	searchResults: User[] = [];
	searching = false;
	addingMember = false;
	showSearchResults = false;

	// New: Selected user before confirming
	selectedUserToAdd: User | null = null;
	selectedRole: GroupRole = GroupRole.MEMBER;
	searchQuery: string = '';
	roleDropdownOpen = false;

	// Confirm dialogs
	showRemoveMemberConfirm = signal(false);
	showLeaveGroupConfirm = signal(false);
	memberToRemove: GroupMember | null = null;
	confirmLoading = signal(false);

	GroupRole = GroupRole;

	ngOnInit() {
		this.setupMemberSearch();

		this.route.params.subscribe(params => {
			const id = +params['id'];
			if (id) {
				this.loadGroup(id);
			}
		});
	}

	setupMemberSearch() {
		this.searchQuery$
			.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(query => {
					const currentGroup = this.group();
					if (!query || query.length < 2 || !currentGroup) {
						this.searchResults = [];
						this.searching = false;
						return [];
					}
					this.searching = true;
					return this.groupService.getAvailableUsers(currentGroup.id);
				})
			)
			.subscribe({
				next: (users) => {
					this.searchResults = users.filter(user =>
						user.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
						user.name.toLowerCase().includes(this.searchQuery.toLowerCase())
					);
					this.searching = false;
					this.showSearchResults = true;
				},
				error: (err) => {
					console.error('Error searching users:', err);
					this.searching = false;
				}
			});
	}

	onSearchChange(query: string) {
		this.searchQuery$.next(query);
	}

	loadGroup(id: number) {
		this.loading.set(true);
		this.error.set(null);

		this.groupService.getGroup(id).subscribe({
			next: (group) => {
				this.group.set(group);
				this.loading.set(false);
			},
			error: (err) => {
				console.error('Error loading group:', err);
				this.error.set('Errore nel caricamento del gruppo');
				this.loading.set(false);
			}
		});
	}

	editGroup() {
		const currentGroup = this.group(); //  Usa ()
		if (currentGroup) {
			this.router.navigate(['/groups', currentGroup.id, 'edit']);
		}
	}

	deleteGroup() {
		const currentGroup = this.group();
		if (!currentGroup) return;

		this.confirmLoading.set(true);
		this.groupService.deleteGroup(currentGroup.id).subscribe({
			next: () => {
				this.confirmLoading.set(false);
				this.showDeleteConfirm.set(false);
				this.router.navigate(['/groups']);
			},
			error: (err) => {
				console.error('Error deleting group:', err);
				this.confirmLoading.set(false);
				this.error.set('Errore nell\'eliminazione del gruppo');
			}
		});
	}

	leaveGroup() {
		this.showLeaveGroupConfirm.set(true);
	}

	confirmLeaveGroup() {
		const currentGroup = this.group();
		if (!currentGroup) return;

		this.confirmLoading.set(true);
		this.groupService.leaveGroup(currentGroup.id).subscribe({
			next: () => {
				this.confirmLoading.set(false);
				this.showLeaveGroupConfirm.set(false);
				this.router.navigate(['/groups']);
			},
			error: (err) => {
				console.error('Error leaving group:', err);
				this.confirmLoading.set(false);
				this.error.set('Errore nell\'abbandonare il gruppo');
			}
		});
	}

	removeMember(member: GroupMember) {
		this.memberToRemove = member;
		this.showRemoveMemberConfirm.set(true);
	}

	confirmRemoveMember() {
		const currentGroup = this.group();
		if (!currentGroup || !this.memberToRemove) return;

		this.confirmLoading.set(true);
		this.groupService.removeMember(currentGroup.id, this.memberToRemove.id).subscribe({
			next: () => {
				this.confirmLoading.set(false);
				this.showRemoveMemberConfirm.set(false);
				this.memberToRemove = null;
				this.loadGroup(currentGroup.id);
			},
			error: (err) => {
				console.error('Error removing member:', err);
				this.confirmLoading.set(false);
				this.error.set('Errore nella rimozione del membro: ' + (err.error?.message || err.message));
			}
		});
	}

	toggleMemberRole(member: GroupMember) {
		const currentGroup = this.group();
		if (!currentGroup) return;

		const newRole = member.role === GroupRole.ADMIN ? GroupRole.MEMBER : GroupRole.ADMIN;

		this.groupService.updateMemberRole(currentGroup.id, member.id, { role: newRole }).subscribe({
			next: () => {
				this.loadGroup(currentGroup.id);
			},
			error: (err) => {
				console.error('Error updating role:', err);
				this.error.set('Errore nell\'aggiornamento del ruolo');
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

	openAddMemberModal() {
		this.showAddMemberModal.set(true);
		this.searchQuery = '';
		this.searchResults = [];
		this.selectedUserToAdd = null;
		this.selectedRole = GroupRole.MEMBER;
		this.showSearchResults = false;
		this.roleDropdownOpen = false;
	}

	closeAddMemberModal() {
		this.showAddMemberModal.set(false);
		this.searchResults = [];
		this.searchQuery = '';
		this.selectedUserToAdd = null;
		this.selectedRole = GroupRole.MEMBER;
		this.showSearchResults = false;
	}

	selectUserToAdd(user: User) {
		this.selectedUserToAdd = user;
		this.searchQuery = '';
		this.searchResults = [];
		this.showSearchResults = false;
	}

	clearSelectedUser() {
		this.selectedUserToAdd = null;
		this.selectedRole = GroupRole.MEMBER;
	}

	hideSearchResults() {
		setTimeout(() => {
			this.showSearchResults = false;
		}, 200);
	}

	confirmAddMember() {
		const currentGroup = this.group();
		if (!currentGroup || !this.selectedUserToAdd) return;

		this.addingMember = true;
		const request: AddMemberRequest = {
			email: this.selectedUserToAdd.email,
			role: this.selectedRole
		};

		this.groupService.addMember(currentGroup.id, request).subscribe({
			next: () => {
				this.addingMember = false;
				this.closeAddMemberModal();
				this.loadGroup(currentGroup.id);
			},
			error: (err) => {
				console.error('Error adding member:', err);
				this.error.set('Errore nell\'aggiunta del membro');
				this.addingMember = false;
			}
		});
	}

	toggleRoleDropdown() {
		this.roleDropdownOpen = !this.roleDropdownOpen;
	}

	selectRole(role: GroupRole) {
		this.selectedRole = role;
		this.roleDropdownOpen = false;
	}
}
