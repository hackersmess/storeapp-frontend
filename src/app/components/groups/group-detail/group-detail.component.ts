import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../services/group.service';
import { Group, GroupMember, GroupRole, AddMemberRequest, LeaveGroupStatus } from '../../../models/group.model';
import { User } from '../../../models/user.model';
import { ActivityService } from '../../../services/activity.service';
import { ActivityCalendar, ActivityRequest, Activity } from '../../../models/activity.model';
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
	lucideShield,
	lucideChevronDown,
	lucideChevronUp,
	lucideBarChart3,
	lucideMap
} from '@ng-icons/lucide';
import { GroupCalendarComponent } from './group-calendar/group-calendar.component';
import { GroupPollsComponent } from './group-polls/group-polls.component';
import { ActivityModalComponent } from './activity-modal/activity-modal.component';
import { ExpenseModalComponent } from './expense-modal/expense-modal.component';
import { AddMemberModalComponent } from './add-member-modal/add-member-modal.component';
import { MembersListComponent } from '../shared/members-list/members-list.component';
import { ExpenseRequest } from '../../../models/expense.model';

@Component({
	selector: 'app-group-detail',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		ConfirmDialogComponent,
		NgIconComponent,
		GroupCalendarComponent,
		GroupPollsComponent,
		ActivityModalComponent,
		ExpenseModalComponent,
		AddMemberModalComponent,
		MembersListComponent
	],
	templateUrl: './group-detail.component.html',
	styleUrls: ['./group-detail.component.scss'],
	viewProviders: [provideIcons({
		lucideCalendar,
		lucideUsers,
		lucideEdit,
		lucideTrash2,
		lucideLogOut,
		lucidePlus,
		lucideShield,
		lucideChevronDown,
		lucideChevronUp,
		lucideBarChart3,
		lucideMap
	})]
})
export class GroupDetailComponent implements OnInit {
	private groupService = inject(GroupService);
	private activityService = inject(ActivityService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private fb = inject(FormBuilder);
	private authService = inject(AuthService);

	// ✨ Signal invece di variabili normali
	group = signal<Group | null>(null);
	loading = signal(false);
	error = signal<string | null>(null);
	showDeleteConfirm = signal(false);
	activityToDelete = signal<number | null>(null);

	// Tabs for mobile-first layout
	activeTab = signal<'calendar' | 'activities' | 'map' | 'members' | 'info'>('calendar');

	// Calendar & Activities
	activities = signal<ActivityCalendar[]>([]);
	loadingActivities = signal(false);
	selectedDate = signal<Date | null>(null);
	showActivityModal = signal(false);
	activityToEdit = signal<Activity | null>(null);
	savingActivity = signal(false);

	// Collapsible sections (collapsed by default)
	groupInfoCollapsed = signal(true);
	membersCollapsed = signal(true);

	// Add member modal
	showAddMemberModal = signal(false);
	searchQuery$ = new Subject<string>();
	searchResults = signal<User[]>([]);
	searching = signal(false);
	addingMember = signal(false);

	// Confirm dialogs
	showRemoveMemberConfirm = signal(false);
	showLeaveGroupConfirm = signal(false);
	memberToRemove: GroupMember | null = null;
	confirmLoading = signal(false);

	// Leave group status
	leaveStatus: LeaveGroupStatus | null = null;
	leaveConfirmMessage = signal<string>('');
	leaveConfirmTitle = signal<string>('');

	// Expense modal
	showExpenseModal = signal(false);
	expenseActivityId = signal<number>(0);
	savingExpense = signal(false);

	GroupRole = GroupRole;

	ngOnInit() {
		this.setupMemberSearch();

		this.route.params.subscribe(params => {
			const id = +params['id'];
			if (id) {
				this.loadGroup(id);
				this.loadActivities(id);
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
						this.searchResults.set([]);
						this.searching.set(false);
						return [];
					}
					this.searching.set(true);
					// 🚀 Passa la query al backend per filtrare lato server
					return this.groupService.getAvailableUsers(currentGroup.id, query);
				})
			)
			.subscribe({
				next: (users) => {
					// ✨ Gli utenti arrivano già filtrati dal backend
					this.searchResults.set(users);
					this.searching.set(false);
				},
				error: (err) => {
					console.error('Error searching users:', err);
					this.searching.set(false);
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
		this.searchResults.set([]);
	}

	closeAddMemberModal() {
		this.showAddMemberModal.set(false);
		this.searchResults.set([]);
	}

	selectUserToAdd(user: User) {
		// Método chamado pelo componente modal quando um usuário é selecionado
		console.log('User selected:', user);
	}

	onConfirmAddMember(event: { user: User; role: GroupRole }) {
		const currentGroup = this.group();
		if (!currentGroup) return;

		this.addingMember.set(true);
		const request: AddMemberRequest = {
			email: event.user.email,
			role: event.role
		};

		this.groupService.addMember(currentGroup.id, request).subscribe({
			next: () => {
				this.addingMember.set(false);
				this.closeAddMemberModal();
				this.loadGroup(currentGroup.id);
			},
			error: (err) => {
				console.error('Error adding member:', err);
				this.error.set('Errore nell\'aggiunta del membro');
				this.addingMember.set(false);
			}
		});
	}

	toggleGroupInfo() {
		this.groupInfoCollapsed.set(!this.groupInfoCollapsed());
	}

	toggleMembers() {
		this.membersCollapsed.set(!this.membersCollapsed());
	}

	// ==================== CALENDAR & ACTIVITIES ====================

	loadActivities(groupId: number) {
		this.loadingActivities.set(true);
		this.activityService.getAllActivitiesCalendar(groupId).subscribe({
			next: (activities) => {
				this.activities.set(activities);
				this.loadingActivities.set(false);
			},
			error: (err) => {
				console.error('Error loading activities:', err);
				this.error.set('Errore nel caricamento delle attività');
				this.loadingActivities.set(false);
			}
		});
	}

	onDateSelected(date: Date) {
		this.selectedDate.set(date);
		// Scroll to activities list on mobile
		if (window.innerWidth < 768) {
			setTimeout(() => {
				document.querySelector('.activities-section')?.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}, 100);
		}
	}

	onAddActivity(date: Date) {
		this.selectedDate.set(date);
		this.activityToEdit.set(null);
		this.showActivityModal.set(true);
	}

	onActivityClick(activity: ActivityCalendar) {
		const currentGroup = this.group();
		if (!currentGroup) return;

		// Carica i dettagli completi dell'attività
		this.activityService.getActivity(currentGroup.id, activity.id).subscribe({
			next: (fullActivity) => {
				this.activityToEdit.set(fullActivity);
				this.showActivityModal.set(true);
			},
			error: (err) => {
				console.error('Error loading activity details:', err);
				this.error.set('Errore nel caricamento dei dettagli');
			}
		});
	}

	onSaveActivity(request: ActivityRequest) {
		const currentGroup = this.group();
		if (!currentGroup) return;

		const activityToEdit = this.activityToEdit();
		this.savingActivity.set(true);

		const operation = activityToEdit
			? this.activityService.updateActivity(currentGroup.id, activityToEdit.id, request)
			: this.activityService.createActivity(currentGroup.id, request);

		operation.subscribe({
			next: () => {
				this.savingActivity.set(false);
				this.showActivityModal.set(false);
				this.activityToEdit.set(null);
				this.loadActivities(currentGroup.id);
			},
			error: (err) => {
				console.error('Error saving activity:', err);
				this.error.set('Errore nel salvataggio dell\'attività');
				this.savingActivity.set(false);
			}
		});
	}

	onDeleteActivity(activityId: number) {
		// Salva l'ID e mostra il dialog di conferma
		this.activityToDelete.set(activityId);
		this.showDeleteConfirm.set(true);
	}

	confirmDeleteActivity() {
		const currentGroup = this.group();
		const activityId = this.activityToDelete();

		if (!currentGroup || !activityId) {
			this.showDeleteConfirm.set(false);
			return;
		}

		this.loading.set(true);

		this.activityService.deleteActivity(currentGroup.id, activityId).subscribe({
			next: () => {
				this.loading.set(false);
				this.showDeleteConfirm.set(false);
				this.activityToDelete.set(null);
				this.loadActivities(currentGroup.id);
			},
			error: (err) => {
				console.error('Error deleting activity:', err);
				this.error.set('Errore nell\'eliminazione dell\'attività');
				this.loading.set(false);
				this.showDeleteConfirm.set(false);
				this.activityToDelete.set(null);
			}
		});
	}

	cancelDeleteActivity() {
		this.showDeleteConfirm.set(false);
		this.activityToDelete.set(null);
	}

	closeActivityModal() {
		this.showActivityModal.set(false);
		this.activityToEdit.set(null);
	}

	setActiveTab(tab: 'calendar' | 'activities' | 'members' | 'info') {
		this.activeTab.set(tab);
	}

	// ==================== EXPENSES ====================

	openExpenseModal(activityId: number) {
		this.expenseActivityId.set(activityId);
		this.showExpenseModal.set(true);
	}

	closeExpenseModal() {
		this.showExpenseModal.set(false);
		this.expenseActivityId.set(0);
	}

	onSaveExpense(request: ExpenseRequest) {
		const currentGroup = this.group();
		if (!currentGroup) return;

		this.savingExpense.set(true);

		// TODO: Create expense service and endpoint
		// For now, just log the request
		console.log('Saving expense:', request);

		// Simulate API call
		setTimeout(() => {
			this.savingExpense.set(false);
			this.closeExpenseModal();
			// Reload activities to get updated totals
			this.loadActivities(currentGroup.id);
		}, 500);

		/*
		// Future implementation:
		this.expenseService.createExpense(request).subscribe({
			next: () => {
				this.savingExpense.set(false);
				this.closeExpenseModal();
				this.loadActivities(currentGroup.id);
			},
			error: (err) => {
				console.error('Error saving expense:', err);
				this.savingExpense.set(false);
				this.error.set('Errore durante il salvataggio della spesa');
			}
		});
		*/
	}
}
