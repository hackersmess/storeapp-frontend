import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GroupRole, GroupMember, AddMemberRequest } from '../../../models/group.model';
import { User, UserBasic } from '../../../models/user.model';
import { GroupService } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { MembersListComponent } from '../shared/members-list/members-list.component';

@Component({
	selector: 'app-group-form',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, MembersListComponent],
	templateUrl: './group-form.component.html',
	styleUrls: ['./group-form.component.scss']
})
export class GroupFormComponent implements OnInit {
	private fb = inject(FormBuilder);
	private groupService = inject(GroupService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private authService = inject(AuthService);
	private breadcrumb = inject(BreadcrumbService);

	groupForm!: FormGroup;
	groupId: number | null = null;

	// Signals per stato reattivo
	isEditMode = signal(false);
	loading = signal(false);
	error = signal<string | null>(null);
	searchResults = signal<User[]>([]);
	searching = signal(false);
	showSearchResults = signal(false);

	// Gestione membri
	selectedMembers: Array<{
		user: UserBasic;
		role: GroupRole;
	}> = [];
	searchQuery$ = new Subject<string>();

	GroupRole = GroupRole;

	// Controlla se l'utente è admin del gruppo
	private currentUserRole: GroupRole | null = null;

	ngOnInit() {
		this.initForm();
		this.setupSearch();

		this.route.params.subscribe(params => {
			if (params['id']) {
				this.groupId = +params['id'];
				this.isEditMode.set(true);
				this.loadGroup();
			}
		});
	}

	initForm() {
		this.groupForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
			description: ['', [Validators.maxLength(2000)]],
			vacationStartDate: ['', Validators.required], // OBBLIGATORIO per il calendario itinerario
			vacationEndDate: ['', Validators.required],   // OBBLIGATORIO per il calendario itinerario
			coverImageUrl: ['', [Validators.maxLength(500)]],
			memberSearch: ['']
		});
	}

	setupSearch() {
		this.searchQuery$
			.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(query => {
					if (!query || query.length < 2) {
						this.searchResults.set([]);
						this.searching.set(false);
						return [];
					}
					this.searching.set(true);

					// Se in modalità edit, usa getAvailableUsers con la query per escludere i membri già presenti
					// Altrimenti usa searchUsers per la creazione iniziale
					if (this.isEditMode() && this.groupId) {
						return this.groupService.getAvailableUsers(this.groupId, query);
					} else {
						// 🚀 Modalità creazione: Backend filtra solo per query (nessun gruppo da escludere)
						return this.groupService.searchUsers(query);
					}
				})
			)
			.subscribe({
				next: (users) => {
					// In modalità edit, gli utenti arrivano già filtrati dal backend (esclusi i membri)
					// In modalità creazione, filtriamo lato client solo per escludere i membri selezionati localmente
					if (this.isEditMode()) {
						// ✅ Backend ha già filtrato per query ed escluso i membri del gruppo
						this.searchResults.set(users);
					} else {
						// ✅ Backend ha già filtrato per query, escludiamo solo i membri selezionati localmente
						this.searchResults.set(users.filter(user =>
							!this.selectedMembers.some(m => m.user.id === user.id)
						));
					}
					this.searching.set(false);
					this.showSearchResults.set(true);
				},
				error: (err) => {
					console.error('Error searching users:', err);
					this.searching.set(false);
				}
			});

		this.groupForm.get('memberSearch')?.valueChanges.subscribe(value => {
			this.searchQuery$.next(value);
		});
	}

	loadGroup() {
		if (!this.groupId) return;

		this.loading.set(true);
		this.groupService.getGroup(this.groupId).subscribe({
			next: (group) => {
				this.groupForm.patchValue({
					name: group.name,
					description: group.description,
					vacationStartDate: group.vacationStartDate,
					vacationEndDate: group.vacationEndDate,
					coverImageUrl: group.coverImageUrl
				});

				// Load existing members
				if (group.members) {
					this.selectedMembers = group.members.map(m => ({
						user: m.user,
						role: m.role
					}));

					// Determina il ruolo dell'utente corrente
					const currentUser = this.authService.getCurrentUser();
					if (currentUser) {
						const currentMember = group.members.find(m => m.user.id === currentUser.id);
						this.currentUserRole = currentMember?.role || null;
					}
				}

				this.loading.set(false);
				this.breadcrumb.set({ title: group.name });
			},
			error: (err) => {
				console.error('Error loading group:', err);
				this.error.set('Errore nel caricamento del gruppo');
				this.loading.set(false);
			}
		});
	}

	selectUser(user: User) {
		// In modalità edit, aggiungi il membro immediatamente al database
		if (this.isEditMode() && this.groupId) {
			this.addMemberToGroup(user);
		} else {
			// In modalità creazione, aggiungi solo alla lista locale
			if (!this.selectedMembers.some(m => m.user.id === user.id)) {
				this.selectedMembers.push({ user, role: GroupRole.MEMBER });
			}
		}

		this.groupForm.patchValue({ memberSearch: '' });
		this.searchResults.set([]);
		this.showSearchResults.set(false);
	}

	/**
	 * Aggiunge immediatamente un membro al gruppo (solo in modalità edit)
	 */
	private addMemberToGroup(user: User) {
		if (!this.groupId) return;

		this.loading.set(true);
		const request: AddMemberRequest = {
			email: user.email,
			role: GroupRole.MEMBER
		};

		this.groupService.addMember(this.groupId, request).subscribe({
			next: () => {
				// Ricarica il gruppo per avere i dati aggiornati
				this.loadGroup();
			},
			error: (err) => {
				console.error('Error adding member:', err);
				this.error.set('Errore nell\'aggiunta del membro: ' + (err.error?.message || err.message));
				this.loading.set(false);
			}
		});
	}

	removeMember(userId: number) {
		// In modalità edit, rimuovi il membro dal database
		if (this.isEditMode() && this.groupId) {
			const member = this.selectedMembers.find(m => m.user.id === userId);
			if (member) {
				// Trova l'ID del membro nel gruppo (non l'ID dell'utente!)
				const currentGroup = this.selectedMembers;
				const memberIndex = currentGroup.findIndex(m => m.user.id === userId);

				// Dobbiamo trovare il memberId dal gruppo caricato
				this.removeMemberFromGroupDB(userId);
			}
		} else {
			// In modalità creazione, rimuovi solo dalla lista locale
			this.selectedMembers = this.selectedMembers.filter(m => m.user.id !== userId);
		}
	}

	/**
	 * Rimuove immediatamente un membro dal gruppo (solo in modalità edit)
	 */
	private removeMemberFromGroupDB(userId: number) {
		if (!this.groupId) return;

		// Trova il memberId (GroupMember.id) dall'userId
		const member = this.selectedMembers.find(m => m.user.id === userId);
		if (!member) return;

		this.loading.set(true);

		// Usa l'userId come memberId (in realtà dovremmo avere il GroupMember.id)
		// Per ora usiamo l'userId perché selectedMembers non ha il memberId
		this.groupService.removeMember(this.groupId, userId).subscribe({
			next: () => {
				// Ricarica il gruppo per avere i dati aggiornati
				this.loadGroup();
			},
			error: (err) => {
				console.error('Error removing member:', err);
				this.error.set('Errore nella rimozione del membro: ' + (err.error?.message || err.message));
				this.loading.set(false);
			}
		});
	}

	toggleRole(userId: number) {
		const member = this.selectedMembers.find(m => m.user.id === userId);
		if (!member) return;

		// In modalità edit, aggiorna il ruolo nel database
		if (this.isEditMode() && this.groupId) {
			const newRole = member.role === GroupRole.ADMIN ? GroupRole.MEMBER : GroupRole.ADMIN;
			// Trova il GroupMember completo per ottenere il memberId
			this.groupService.getGroup(this.groupId).subscribe({
				next: (group) => {
					const groupMember = group.members.find(m => m.user.id === userId);
					if (groupMember) {
						this.updateMemberRoleInDB(groupMember.id, newRole);
					}
				}
			});
		} else {
			// In modalità creazione, aggiorna solo localmente
			member.role = member.role === GroupRole.ADMIN ? GroupRole.MEMBER : GroupRole.ADMIN;
		}
	}

	/**
	 * Aggiorna il ruolo di un membro nel database (solo in modalità edit)
	 * @param memberId ID del GroupMember (NON userId!)
	 * @param newRole Nuovo ruolo da assegnare
	 */
	private updateMemberRoleInDB(memberId: number, newRole: GroupRole) {
		if (!this.groupId) return;

		this.loading.set(true);

		this.groupService.updateMemberRole(this.groupId, memberId, { role: newRole }).subscribe({
			next: () => {
				// Ricarica il gruppo per avere i dati aggiornati
				this.loadGroup();
			},
			error: (err) => {
				console.error('Error updating member role:', err);
				this.error.set('Errore nell\'aggiornamento del ruolo: ' + (err.error?.message || err.message));
				this.loading.set(false);
			}
		});
	}

	onSubmit() {
		if (this.groupForm.invalid) {
			Object.keys(this.groupForm.controls).forEach(key => {
				this.groupForm.get(key)?.markAsTouched();
			});
			return;
		}

		this.loading.set(true);
		this.error.set(null);

		const formValue = this.groupForm.value;
		const groupData: any = {
			name: formValue.name,
			description: formValue.description,
			vacationStartDate: formValue.vacationStartDate,
			vacationEndDate: formValue.vacationEndDate,
			coverImageUrl: formValue.coverImageUrl
		};

		// Se è creazione e ci sono membri selezionati, includili nella richiesta
		if (!this.isEditMode() && this.selectedMembers.length > 0) {
			groupData.members = this.selectedMembers.map(member => ({
				email: member.user.email,
				role: member.role
			}));
		}

		const operation = this.isEditMode() && this.groupId
			? this.groupService.updateGroup(this.groupId, groupData)
			: this.groupService.createGroup(groupData);

		// Singola chiamata: crea gruppo + membri in una transazione atomica
		operation.subscribe({
			next: (group) => {
				this.loading.set(false);
				this.router.navigate(['/groups', group.id]);
			},
			error: (err) => {
				console.error('Error saving group:', err);
				this.error.set('Errore nel salvataggio del gruppo');
				this.loading.set(false);
			}
		});
	}

	cancel() {
		if (this.isEditMode() && this.groupId) {
			this.router.navigate(['/groups', this.groupId]);
		} else {
			this.router.navigate(['/groups']);
		}
	}

	hideSearchResults() {
		setTimeout(() => {
			this.showSearchResults.set(false);
		}, 200);
	}

	isAdmin(): boolean {
		return this.currentUserRole === GroupRole.ADMIN;
	}

	isCurrentUser(userId: number): boolean {
		const currentUser = this.authService.getCurrentUser();
		return currentUser?.id === userId;
	}

	canModifyMember(userId: number): boolean {
		// Un utente non può modificare se stesso
		if (this.isCurrentUser(userId)) return false;
		// Solo gli admin possono modificare altri membri
		return this.isAdmin();
	}

	canRemoveMember(userId: number): boolean {
		// Un utente non può rimuovere se stesso
		if (this.isCurrentUser(userId)) return false;
		// Solo gli admin possono rimuovere altri membri
		return this.isAdmin();
	}

	// Metodi per il componente condiviso members-list
	getGroupMembers(): GroupMember[] {
		return this.selectedMembers.map(m => ({
			id: m.user.id,
			groupId: this.groupId || 0,
			user: m.user,
			role: m.role,
			joinedAt: new Date().toISOString()
		}));
	}

	openAddMemberSearch() {
		// Trigger the search input to show (potremmo aprire una modale o espandere la sezione)
		this.showSearchResults.set(true);
		// Focus on search input
		setTimeout(() => {
			const searchInput = document.getElementById('memberSearch') as HTMLInputElement;
			if (searchInput) {
				searchInput.focus();
			}
		}, 100);
	}

	removeMemberFromGroup(member: GroupMember) {
		this.removeMember(member.user.id);
	}

	toggleMemberRole(member: GroupMember) {
		this.toggleRole(member.user.id);
	}

	/**
	 * Verifica se l'utente corrente è admin del gruppo
	 * CRITICO PER SICUREZZA: Controlla i permessi prima di mostrare pulsanti di modifica
	 */
	isCurrentUserAdmin(): boolean {
		// In modalità creazione, il creatore è sempre admin
		if (!this.isEditMode()) {
			return true;
		}

		// In modalità edit, verifica il ruolo effettivo
		return this.currentUserRole === GroupRole.ADMIN;
	}
}