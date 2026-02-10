import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { Group, GroupRole, AddMemberRequest } from '../../../models/group.model';
import { User } from '../../../models/user.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
	isEditMode = false;
	loading = false;
	error: string | null = null;

	// Gestione membri
	selectedMembers: Array<{
		user: {
			id: number;
			email: string;
			name: string;
			avatarUrl?: string;
		};
		role: GroupRole;
	}> = [];
	searchQuery$ = new Subject<string>();
	searchResults: User[] = [];
	searching = false;
	showSearchResults = false;

	GroupRole = GroupRole;

	ngOnInit() {
		this.initForm();
		this.setupSearch();

		this.route.params.subscribe(params => {
			if (params['id']) {
				this.groupId = +params['id'];
				this.isEditMode = true;
				this.loadGroup();
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
						this.searchResults = [];
						this.searching = false;
						return [];
					}
					this.searching = true;
					return this.groupService.getAllUsers();
				})
			)
			.subscribe({
				next: (users) => {
					const query = this.groupForm.get('memberSearch')?.value.toLowerCase();
					this.searchResults = users.filter(user =>
						(user.email.toLowerCase().includes(query) ||
							user.name.toLowerCase().includes(query)) &&
						!this.selectedMembers.some(m => m.user.id === user.id)
					);
					this.searching = false;
					this.showSearchResults = true;
				},
				error: (err) => {
					console.error('Error searching users:', err);
					this.searching = false;
				}
			});

		this.groupForm.get('memberSearch')?.valueChanges.subscribe(value => {
			this.searchQuery$.next(value);
		});
	}

	loadGroup() {
		if (!this.groupId) return;

		this.loading = true;
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

				this.loading = false;
			},
			error: (err) => {
				console.error('Error loading group:', err);
				this.error = 'Errore nel caricamento del gruppo';
				this.loading = false;
			}
		});
	}

	selectUser(user: User) {
		if (!this.selectedMembers.some(m => m.user.id === user.id)) {
			this.selectedMembers.push({ user, role: GroupRole.MEMBER });
		}
		this.groupForm.patchValue({ memberSearch: '' });
		this.searchResults = [];
		this.showSearchResults = false;
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

		this.loading = true;
		this.error = null;

		const formValue = this.groupForm.value;
		const groupData = {
			name: formValue.name,
			description: formValue.description,
			vacationStartDate: formValue.vacationStartDate,
			vacationEndDate: formValue.vacationEndDate,
			coverImageUrl: formValue.coverImageUrl
		};

		const operation = this.isEditMode && this.groupId
			? this.groupService.updateGroup(this.groupId, groupData)
			: this.groupService.createGroup(groupData);

		operation.subscribe({
			next: (group) => {
				if (!this.isEditMode) {
					// Add members to the newly created group
					this.addMembersToGroup(group.id);
				} else {
					this.router.navigate(['/groups', group.id]);
				}
			},
			error: (err) => {
				console.error('Error saving group:', err);
				this.error = 'Errore nel salvataggio del gruppo';
				this.loading = false;
			}
		});
	}

	addMembersToGroup(groupId: number) {
		if (this.selectedMembers.length === 0) {
			this.router.navigate(['/groups', groupId]);
			return;
		}

		let completed = 0;
		const total = this.selectedMembers.length;

		this.selectedMembers.forEach(member => {
			const request: AddMemberRequest = {
				email: member.user.email,
				role: member.role
			};

			this.groupService.addMember(groupId, request).subscribe({
				next: () => {
					completed++;
					if (completed === total) {
						this.router.navigate(['/groups', groupId]);
					}
				},
				error: (err) => {
					console.error('Error adding member:', err);
					completed++;
					if (completed === total) {
						this.router.navigate(['/groups', groupId]);
					}
				}
			});
		});
	}

	cancel() {
		if (this.isEditMode && this.groupId) {
			this.router.navigate(['/groups', this.groupId]);
		} else {
			this.router.navigate(['/groups']);
		}
	}

	hideSearchResults() {
		setTimeout(() => {
			this.showSearchResults = false;
		}, 200);
	}
}
