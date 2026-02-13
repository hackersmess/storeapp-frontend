import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { Group, GroupMember, GroupRole, AddMemberRequest } from '../../../models/group.model';
import { User } from '../../../models/user.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-group-detail',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
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
	memberSearchForm!: FormGroup;
	searchQuery$ = new Subject<string>();
	searchResults: User[] = [];
	searching = false;
	addingMember = false;

	GroupRole = GroupRole;

	ngOnInit() {
		this.initMemberSearchForm();
		this.setupMemberSearch();

		this.route.params.subscribe(params => {
			const id = +params['id'];
			if (id) {
				this.loadGroup(id);
			}
		});
	}

	initMemberSearchForm() {
		this.memberSearchForm = this.fb.group({
			search: [''],
			role: [GroupRole.MEMBER]
		});
	}

	setupMemberSearch() {
		this.searchQuery$
			.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(query => {
					const currentGroup = this.group(); // Usa () per leggere il signal
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
					const query = this.memberSearchForm.get('search')?.value.toLowerCase();
					this.searchResults = users.filter(user =>
						user.email.toLowerCase().includes(query) ||
						user.name.toLowerCase().includes(query)
					);
					this.searching = false;
				},
				error: (err) => {
					console.error('Error searching users:', err);
					this.searching = false;
				}
			});

		this.memberSearchForm.get('search')?.valueChanges.subscribe(value => {
			this.searchQuery$.next(value);
		});
	}

	loadGroup(id: number) {
		this.loading.set(true); //  Usa .set() per Signal
		this.error.set(null);

		this.groupService.getGroup(id).subscribe({
			next: (group) => {
				console.log('GroupDetailComponent: Received group:', group);
				this.group.set(group); //  Usa .set()
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
		const currentGroup = this.group(); //  Usa ()
		if (!currentGroup) return;

		this.loading.set(true);
		this.groupService.deleteGroup(currentGroup.id).subscribe({
			next: () => {
				this.router.navigate(['/groups']);
			},
			error: (err) => {
				console.error('Error deleting group:', err);
				this.error.set('Errore nell\'eliminazione del gruppo');
				this.loading.set(false);
				this.showDeleteConfirm.set(false);
			}
		});
	}

	leaveGroup() {
		const currentGroup = this.group();
		if (!currentGroup) return;

		if (confirm('Sei sicuro di voler abbandonare questo gruppo?')) {
			this.loading.set(true);
			this.groupService.leaveGroup(currentGroup.id).subscribe({
				next: () => {
					this.router.navigate(['/groups']);
				},
				error: (err) => {
					console.error('Error leaving group:', err);
					this.error.set('Errore nell\'abbandonare il gruppo');
					this.loading.set(false);
				}
			});
		}
	}

	removeMember(member: GroupMember) {
		const currentGroup = this.group();
		if (!currentGroup || !confirm(`Rimuovere ${member.user.name} dal gruppo?`)) return;

		this.groupService.removeMember(currentGroup.id, member.id).subscribe({
			next: () => {
				this.loadGroup(currentGroup.id);
			},
			error: (err) => {
				console.error('Error removing member:', err);
				this.error.set('Errore nella rimozione del membro');
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
		this.memberSearchForm.patchValue({ search: '', role: GroupRole.MEMBER });
		this.searchResults = [];
	}

	closeAddMemberModal() {
		this.showAddMemberModal.set(false);
		this.searchResults = [];
		this.memberSearchForm.reset({ role: GroupRole.MEMBER });
	}

	selectUserToAdd(user: User) {
		const currentGroup = this.group();
		if (!currentGroup) return;

		this.addingMember = true;
		const request: AddMemberRequest = {
			email: user.email,
			role: this.memberSearchForm.get('role')?.value || GroupRole.MEMBER
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
}
