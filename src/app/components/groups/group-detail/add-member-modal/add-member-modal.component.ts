import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideShield } from '@ng-icons/lucide';
import { User } from '../../../../models/user.model';
import { GroupRole } from '../../../../models/group.model';

@Component({
	selector: 'app-add-member-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, NgIconComponent],
	templateUrl: './add-member-modal.component.html',
	styleUrls: ['./add-member-modal.component.scss'],
	viewProviders: [provideIcons({ lucideChevronDown, lucideShield })]
})
export class AddMemberModalComponent {
	// Inputs
	show = input.required<boolean>();
	searchResults = input.required<User[]>();
	searching = input.required<boolean>();
	addingMember = input.required<boolean>();

	// Outputs
	close = output<void>();
	searchChange = output<string>();
	userSelected = output<User>();
	confirmAdd = output<{ user: User; role: GroupRole }>();

	// State
	searchQuery = signal('');
	showSearchResults = signal(false);
	selectedUser = signal<User | null>(null);
	selectedRole = signal<GroupRole>(GroupRole.MEMBER);
	roleDropdownOpen = signal(false);

	GroupRole = GroupRole;

	constructor() {
		// Reset state when modal is closed
		effect(() => {
			if (!this.show()) {
				this.resetState();
			}
		});
	}

	private resetState() {
		this.selectedUser.set(null);
		this.selectedRole.set(GroupRole.MEMBER);
		this.searchQuery.set('');
		this.showSearchResults.set(false);
		this.roleDropdownOpen.set(false);
	}

	onSearchChange(query: string) {
		this.searchQuery.set(query);
		this.searchChange.emit(query);
		this.showSearchResults.set(query.length >= 2);
	}

	selectUser(user: User) {
		this.selectedUser.set(user);
		this.searchQuery.set('');
		this.showSearchResults.set(false);
		this.userSelected.emit(user);
	}

	clearSelectedUser() {
		this.selectedUser.set(null);
		this.selectedRole.set(GroupRole.MEMBER);
	}

	hideSearchResults() {
		setTimeout(() => {
			this.showSearchResults.set(false);
		}, 200);
	}

	toggleRoleDropdown() {
		this.roleDropdownOpen.set(!this.roleDropdownOpen());
	}

	selectRole(role: GroupRole) {
		this.selectedRole.set(role);
		this.roleDropdownOpen.set(false);
	}

	onClose() {
		this.close.emit();
	}

	onConfirm() {
		const user = this.selectedUser();
		if (user) {
			this.confirmAdd.emit({ user, role: this.selectedRole() });
		}
	}
}
