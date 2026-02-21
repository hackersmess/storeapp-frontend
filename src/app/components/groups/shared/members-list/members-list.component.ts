import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideShield, lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { GroupMember, GroupRole } from '../../../../models/group.model';
import { AuthService } from '../../../../services/auth.service';

@Component({
	selector: 'app-members-list',
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	templateUrl: './members-list.component.html',
	styleUrls: ['./members-list.component.scss'],
	viewProviders: [provideIcons({ lucideShield, lucidePlus, lucideTrash2 })]
})
export class MembersListComponent {
	private authService = inject(AuthService);

	@Input() members: GroupMember[] = [];
	@Input() isAdmin = false;
	@Input() showAddButton = false;
	@Input() title = 'Membri del Gruppo';
	@Input() description = '';

	@Output() addMember = new EventEmitter<void>();
	@Output() removeMember = new EventEmitter<GroupMember>();
	@Output() toggleRole = new EventEmitter<GroupMember>();

	GroupRole = GroupRole;

	onAddMember() {
		this.addMember.emit();
	}

	onRemoveMember(member: GroupMember) {
		this.removeMember.emit(member);
	}

	onToggleRole(member: GroupMember) {
		this.toggleRole.emit(member);
	}

	canModifyMember(member: GroupMember): boolean {
		const currentUser = this.authService.getCurrentUser();
		if (!currentUser) return false;

		// Non puoi modificare te stesso
		if (member.user.id === currentUser.id) return false;

		// Solo gli admin possono modificare
		return this.isAdmin;
	}

	canRemoveMember(member: GroupMember): boolean {
		const currentUser = this.authService.getCurrentUser();
		if (!currentUser) return false;

		// Non puoi rimuovere te stesso
		if (member.user.id === currentUser.id) return false;

		// Solo gli admin possono rimuovere
		return this.isAdmin;
	}

	isCurrentUser(userId: number): boolean {
		const currentUser = this.authService.getCurrentUser();
		return currentUser?.id === userId;
	}
}
