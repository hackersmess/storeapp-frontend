import { CommonModule } from '@angular/comm	ngOnInit() {
		this.initForm();
		this.setupSearch();

		this.route.params.subscribe(params => {
			if (params['id']) {
				this.groupId = +params['id'];
				this.isEditMode.set(true);
				this.loadGroup();
			}
		});
	}mponent, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AddMemberRequest, GroupRole } from '../../../models/group.model';
import { User, UserBasic } from '../../../models/user.model';
import { GroupService } from '../../../services/group.service';

@Component({
	selector: 'app-group-form',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './group-form.component.html',
	styleUrls: ['./group-form.component.scss']
})
export class GroupFormComponent implements OnInit {
	private fb = inject(FormBuilder);
	private groupService = inject(GroupService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);

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

	ngOnInit() {
		console.log(' GroupFormComponent ngOnInit');
		this.initForm();
		this.setupSearch();

		this.route.params.subscribe(params => {
			console.log(' Route params:', params);
			if (params['id']) {
				this.groupId = +params['id'];
				this.isEditMode = true;
				console.log(' Edit mode activated, groupId:', this.groupId);
				this.loadGroup();
			} else {
				console.log('Create mode');
			}
		});
	}

	initForm() {
		this.groupForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
			description: ['', [Validators.maxLength(2000)]],
			vacationStartDate: [''],
			vacationEndDate: [''],
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
					// Se in modalità edit, usa getAvailableUsers per escludere i membri già presenti
					// Altrimenti usa getAllUsers per la creazione iniziale
					if (this.isEditMode() && this.groupId) {
						return this.groupService.getAvailableUsers(this.groupId);
					} else {
						return this.groupService.getAllUsers();
					}
				})
			)
			.subscribe({
				next: (users) => {
					const query = this.groupForm.get('memberSearch')?.value.toLowerCase();
					this.searchResults.set(users.filter(user =>
						(user.email.toLowerCase().includes(query) ||
							user.name.toLowerCase().includes(query)) &&
						!this.selectedMembers.some(m => m.user.id === user.id)
					));
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
				}

				this.loading.set(false);
			},
			error: (err) => {
				console.error('Error loading group:', err);
				this.error.set('Errore nel caricamento del gruppo');
				this.loading.set(false);
			}
		});
	}

	selectUser(user: User) {
		if (!this.selectedMembers.some(m => m.user.id === user.id)) {
			this.selectedMembers.push({ user, role: GroupRole.MEMBER });
		}
		this.groupForm.patchValue({ memberSearch: '' });
		this.searchResults.set([]);
		this.showSearchResults.set(false);
	}

	removeMember(userId: number) {
		this.selectedMembers = this.selectedMembers.filter(m => m.user.id !== userId);
	}

	toggleRole(userId: number) {
		const member = this.selectedMembers.find(m => m.user.id === userId);
		if (member) {
			member.role = member.role === GroupRole.ADMIN ? GroupRole.MEMBER : GroupRole.ADMIN;
		}
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
}
