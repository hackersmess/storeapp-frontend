import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupMember } from '../../../../models/group.model';
import { MemberWithAmount } from '../../../../models/expense.model';

@Component({
	selector: 'app-payers-step',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './payers-step.component.html',
	styleUrls: ['./payers-step.component.scss']
})
export class PayersStepComponent {
	members = input.required<GroupMember[]>();
	initialPayers = input<MemberWithAmount[]>([]);

	payersChange = output<MemberWithAmount[]>();
	validChange = output<boolean>();

	// State: mappa member.id -> amount pagato
	payers = signal<Map<number, number>>(new Map());

	// Computed: totale pagato
	totalPaid = computed(() => {
		let sum = 0;
		this.payers().forEach(amount => sum += amount);
		return sum;
	});

	// Computed: valido se c'è almeno un pagante con importo > 0
	isValid = computed(() => {
		const map = this.payers();
		if (map.size === 0) return false;
		for (const amount of map.values()) {
			if (amount > 0) return true;
		}
		return false;
	});

	// Computed: lista paganti per output
	payersList = computed(() => {
		const result: MemberWithAmount[] = [];
		this.payers().forEach((amount, memberId) => {
			if (amount > 0) {
				const member = this.members().find(m => m.id === memberId);
				if (member) {
					result.push({
						groupMemberId: member.id,
						userName: member.user.name,
						avatarUrl: member.user.avatarUrl,
						amount,
						isPayer: true
					});
				}
			}
		});
		return result;
	});

	constructor() {
		// Inizializza con payers esistenti
		effect(() => {
			const initial = this.initialPayers();
			if (initial.length > 0) {
				const map = new Map<number, number>();
				initial.forEach(p => map.set(p.groupMemberId, p.amount));
				this.payers.set(map);
			}
		});

		// Emetti validità quando cambia
		effect(() => {
			this.validChange.emit(this.isValid());
		});

		// Emetti lista paganti quando cambia
		effect(() => {
			this.payersChange.emit(this.payersList());
		});
	}

	togglePayer(memberId: number): void {
		const map = new Map(this.payers());
		if (map.has(memberId)) {
			map.delete(memberId);
		} else {
			map.set(memberId, 0);
		}
		this.payers.set(map);
	}

	isPayer(memberId: number): boolean {
		return this.payers().has(memberId);
	}

	getAmount(memberId: number): number {
		return this.payers().get(memberId) || 0;
	}

	updateAmount(memberId: number, value: string): void {
		const amount = parseFloat(value) || 0;
		const map = new Map(this.payers());
		if (amount > 0) {
			map.set(memberId, amount);
		} else {
			map.delete(memberId);
		}
		this.payers.set(map);
	}

	splitEqually(): void {
		const payerCount = this.payers().size;
		if (payerCount === 0) return;

		// Dividi il totale corrente equamente
		const currentTotal = this.totalPaid();
		if (currentTotal === 0) return;

		const amountPerPayer = currentTotal / payerCount;
		const map = new Map<number, number>();

		this.payers().forEach((_, memberId) => {
			map.set(memberId, Math.round(amountPerPayer * 100) / 100);
		});

		this.payers.set(map);
	}

	/**
	 * Utility method for template
	 */
	abs(value: number): number {
		return Math.abs(value);
	}
}
