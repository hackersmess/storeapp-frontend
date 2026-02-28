import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupMember } from '../../../../models/group.model';
import { MemberWithAmount, SplitType } from '../../../../models/expense.model';

@Component({
	selector: 'app-split-step',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './split-step.component.html',
	styleUrls: ['./split-step.component.scss']
})
export class SplitStepComponent {
	// Inputs
	members = input.required<GroupMember[]>();
	totalAmount = input.required<number>();
	payers = input.required<Map<number, number>>(); // memberId -> amount paid
	initialSplits = input<MemberWithAmount[]>([]); // pre-fill on edit

	// Outputs
	splitsChange = output<MemberWithAmount[]>();
	validChange = output<boolean>();

	// State
	splitType = signal<SplitType>('equal');
	customSplits = signal<Map<number, number>>(new Map()); // memberId -> amount owed
	selectedMembers = signal<Set<number>>(new Set()); // who owes money

	// Computed values
	splitsList = computed<MemberWithAmount[]>(() => {
		const type = this.splitType();
		const selected = this.selectedMembers();
		const custom = this.customSplits();
		const total = this.totalAmount();

		if (selected.size === 0) {
			return [];
		}

		const result: MemberWithAmount[] = [];

		if (type === 'equal') {
			const amountPerPerson = total / selected.size;
			for (const memberId of selected) {
				const member = this.members().find(m => m.id === memberId);
				if (member) {
					result.push({
						groupMemberId: member.id,
						userName: member.user.name,
						amount: amountPerPerson
					});
				}
			}
		} else {
			// custom or percentage
			for (const memberId of selected) {
				const amount = custom.get(memberId) || 0;
				const member = this.members().find(m => m.id === memberId);
				if (member) {
					result.push({
						groupMemberId: member.id,
						userName: member.user.name,
						amount
					});
				}
			}
		}

		return result;
	});

	totalOwed = computed(() => {
		return this.splitsList().reduce((sum, split) => sum + split.amount, 0);
	});

	difference = computed(() => {
		return this.totalOwed() - this.totalAmount();
	});

	isValid = computed(() => {
		const splits = this.splitsList();
		if (splits.length === 0) return false;
		return Math.abs(this.difference()) < 0.01;
	});

	constructor() {
		// Start with no members selected - user must choose
		// (They can click "Seleziona tutti" if they want everyone)

		// Pre-populate when editing an existing expense
		effect(() => {
			const initial = this.initialSplits();
			if (initial.length > 0) {
				const selected = new Set<number>(initial.map(s => s.groupMemberId));
				this.selectedMembers.set(selected);
				// Check if it's a custom split (amounts differ from equal)
				const total = this.totalAmount();
				const equalAmount = selected.size > 0 ? total / selected.size : 0;
				const isCustom = initial.some(s => Math.abs(s.amount - equalAmount) > 0.01);
				if (isCustom) {
					const map = new Map<number, number>();
					initial.forEach(s => map.set(s.groupMemberId, s.amount));
					this.customSplits.set(map);
					this.splitType.set('custom');
				} else {
					this.splitType.set('equal');
				}
			}
		});

		// Emit changes
		effect(() => {
			this.splitsChange.emit(this.splitsList());
		});

		effect(() => {
			this.validChange.emit(this.isValid());
		});
	}

	/**
	 * Toggle member selection for splitting
	 */
	toggleMember(memberId: number): void {
		const selected = new Set(this.selectedMembers());
		if (selected.has(memberId)) {
			selected.delete(memberId);
		} else {
			selected.add(memberId);
		}
		this.selectedMembers.set(selected);

		// Recalculate equal split if in equal mode
		if (this.splitType() === 'equal') {
			this.customSplits.set(new Map());
		}
	}

	/**
	 * Check if member is selected
	 */
	isSelected(memberId: number): boolean {
		return this.selectedMembers().has(memberId);
	}

	/**
	 * Check if all members are selected
	 */
	allSelected = computed(() => {
		const selected = this.selectedMembers();
		const total = this.members().length;
		return total > 0 && selected.size === total;
	});

	/**
	 * Toggle select all members
	 */
	toggleAll(): void {
		if (this.allSelected()) {
			// Deselect all
			this.selectedMembers.set(new Set());
		} else {
			// Select all
			const allIds = this.members().map(m => m.id);
			this.selectedMembers.set(new Set(allIds));
		}

		// Recalculate if in equal mode
		if (this.splitType() === 'equal') {
			this.customSplits.set(new Map());
		} else {
			this.initializeCustomAmounts();
		}
	}

	/**
	 * Change split type
	 */
	changeSplitType(type: SplitType): void {
		this.splitType.set(type);

		if (type === 'equal') {
			// Clear custom amounts when switching to equal
			this.customSplits.set(new Map());
		} else if (type === 'custom') {
			// Initialize custom amounts with equal split
			this.initializeCustomAmounts();
		}
	}

	/**
	 * Update custom amount for a member
	 */
	updateCustomAmount(memberId: number, value: string): void {
		const amount = parseFloat(value) || 0;
		const map = new Map(this.customSplits());
		map.set(memberId, amount);
		this.customSplits.set(map);
	}

	/**
	 * Get custom amount for a member
	 */
	getCustomAmount(memberId: number): number {
		return this.customSplits().get(memberId) || 0;
	}

	/**
	 * Initialize custom amounts with equal split
	 */
	private initializeCustomAmounts(): void {
		const selected = this.selectedMembers();
		if (selected.size === 0) return;

		const amountPerPerson = this.totalAmount() / selected.size;
		const map = new Map<number, number>();
		for (const memberId of selected) {
			map.set(memberId, amountPerPerson);
		}
		this.customSplits.set(map);
	}

	/**
	 * Distribute remaining difference equally among selected members
	 */
	distributeRemaining(): void {
		const diff = this.difference();
		if (Math.abs(diff) < 0.01) return;

		const selected = this.selectedMembers();
		if (selected.size === 0) return;

		const adjustmentPerPerson = -diff / selected.size;
		const map = new Map(this.customSplits());

		for (const memberId of selected) {
			const current = map.get(memberId) || 0;
			map.set(memberId, current + adjustmentPerPerson);
		}

		this.customSplits.set(map);
	}

	/**
	 * Utility method for template
	 */
	abs(value: number): number {
		return Math.abs(value);
	}
}
