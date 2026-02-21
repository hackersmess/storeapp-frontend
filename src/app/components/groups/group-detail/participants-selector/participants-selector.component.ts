import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupMember } from '../../../../models/group.model';

@Component({
	selector: 'app-participants-selector',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './participants-selector.component.html',
	styleUrls: ['./participants-selector.component.scss']
})
export class ParticipantsSelectorComponent {
	members = input.required<GroupMember[]>();
	selectedUserIds = input<number[]>([]);
	selectionChange = output<number[]>();

	// State: array di IDs selezionati
	private _selectedIds = signal<number[]>([]);

	// Computed pubblico per il template
	selectedIds = computed(() => this._selectedIds());

	// Computed: tutti selezionati?
	allSelected = computed(() => {
		const members = this.members();
		const selected = this._selectedIds();
		return members.length > 0 && members.length === selected.length;
	});

	constructor() {
		// Inizializza solo la prima volta quando cambiano gli input
		effect(() => {
			const preselected = this.selectedUserIds();
			// Solo se la selezione corrente è vuota, usa i preselezionati
			if (this._selectedIds().length === 0 && preselected.length > 0) {
				this._selectedIds.set([...preselected]);
			}
		}, { allowSignalWrites: true });
	}

	toggleMember(userId: number): void {
		const current = this._selectedIds();
		if (current.includes(userId)) {
			this._selectedIds.set(current.filter(id => id !== userId));
		} else {
			this._selectedIds.set([...current, userId]);
		}
		this.selectionChange.emit(this._selectedIds());
	}

	toggleAll(): void {
		if (this.allSelected()) {
			this._selectedIds.set([]);
		} else {
			this._selectedIds.set(this.members().map(m => m.user.id));
		}
		this.selectionChange.emit(this._selectedIds());
	}

	isSelected(userId: number): boolean {
		return this._selectedIds().includes(userId);
	}
}
