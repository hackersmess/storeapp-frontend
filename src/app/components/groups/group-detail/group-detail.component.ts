import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { Group, GroupMember, GroupRole, AddMemberRequest, LeaveGroupStatus } from '../../../models/group.model';
import { User } from '../../../models/user.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
	lucideCalendar,
	lucideUsers,
	lucideEdit,
	lucideTrash2,
	lucideLogOut,
	lucidePlus,
	lucideShield
} from '@ng-icons/lucide';

@Component({
	selector: 'app-group-detail',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmDialogComponent, NgIconComponent],
	templateUrl: './group-detail.component.html',
	styleUrls: ['./group-detail.component.scss'],
	viewProviders: [provideIcons({
		lucideCalendar,
		lucideUsers,
		lucideEdit,
		lucideTrash2,
		lucideLogOut,
		lucidePlus,
		lucideShield
	})]
})
export class GroupDetailComponent implements OnInit {
	private groupService = inject(GroupService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private fb = inject(FormBuilder);
	private authService = inject(AuthService);

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

	// Leave group status
	leaveStatus: LeaveGroupStatus | null = null;
	leaveConfirmMessage = signal<string>('');
	leaveConfirmTitle = signal<string>('');

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

	goToItinerary() {
		const currentGroup = this.group();
		if (currentGroup) {
			this.router.navigate(['/groups', currentGroup.id, 'itinerary']);
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
		const currentGroup = this.group();
		if (!currentGroup) return;

		// Prima verifica lo stato
		this.loading.set(true);
		this.groupService.checkLeaveGroupStatus(currentGroup.id).subscribe({
			next: (status) => {
				this.loading.set(false);
				this.leaveStatus = status;

				if (!status.canLeave) {
					// Non può abbandonare (ultimo admin)
					this.leaveConfirmTitle.set('Impossibile abbandonare il gruppo');
					this.leaveConfirmMessage.set(status.reason || 'Non puoi abbandonare il gruppo');
					this.showLeaveGroupConfirm.set(true);
				} else if (status.willDeleteGroup) {
					// Unico membro - il gruppo verrà eliminato
					this.leaveConfirmTitle.set('Abbandona ed Elimina Gruppo');
					this.leaveConfirmMessage.set(status.reason || 'Essendo l\'unico membro, uscendo verrà cancellato il gruppo');
					this.showLeaveGroupConfirm.set(true);
				} else {
					// Può abbandonare normalmente
					this.leaveConfirmTitle.set('Abbandona Gruppo');
					this.leaveConfirmMessage.set('Sei sicuro di voler abbandonare questo gruppo?');
					this.showLeaveGroupConfirm.set(true);
				}
			},
			error: (err) => {
				console.error('Error checking leave status:', err);
				this.loading.set(false);
				this.error.set('Errore nella verifica dello stato');
			}
		});
	}

	confirmLeaveGroup() {
		const currentGroup = this.group();
		if (!currentGroup) return;

		// Se non può abbandonare (ultimo admin), chiudi solo la modale
		if (this.leaveStatus && !this.leaveStatus.canLeave) {
			this.showLeaveGroupConfirm.set(false);
			return;
		}

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
		const currentGroup = this.group();
		const currentUser = this.authService.getCurrentUser();

		if (!currentGroup || !currentUser) {
			console.log('isAdmin: Missing group or user', { currentGroup, currentUser });
			return false;
		}

		// Verifica se l'utente corrente è admin del gruppo
		const currentMember = currentGroup.members?.find(m => m.user.id === currentUser.id);
		const isAdmin = currentMember?.role === GroupRole.ADMIN;
		console.log('isAdmin:', { userId: currentUser.id, currentMember, isAdmin });
		return isAdmin;
	}

	isCurrentUser(userId: number): boolean {
		const currentUser = this.authService.getCurrentUser();
		return currentUser?.id === userId;
	}

	canModifyMember(member: GroupMember): boolean {
		// Un utente non può modificare se stesso
		if (this.isCurrentUser(member.user.id)) return false;
		// Solo gli admin possono modificare altri membri
		return this.isAdmin();
	}

	canRemoveMember(member: GroupMember): boolean {
		// Un utente non può rimuovere se stesso (deve usare "Abbandona gruppo")
		if (this.isCurrentUser(member.user.id)) return false;
		// Solo gli admin possono rimuovere altri membri
		return this.isAdmin();
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
