import { Component, input, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRight,
	lucideTrendingUp,
	lucideTrendingDown,
	lucideMinus,
	lucideRefreshCw,
	lucideCheckCircle,
	lucideHandCoins
} from '@ng-icons/lucide';
import { ActivityService } from '../../../../services/activity.service';
import { GroupExpenseSettlement, MemberBalance, SettlementTransaction } from '../../../../models/activity.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
	selector: 'app-expense-settlement',
	standalone: true,
	imports: [CommonModule, FormsModule, NgIconComponent, ConfirmDialogComponent],
	templateUrl: './expense-settlement.component.html',
	styleUrls: ['./expense-settlement.component.scss'],
	viewProviders: [provideIcons({
		lucideArrowRight,
		lucideTrendingUp,
		lucideTrendingDown,
		lucideMinus,
		lucideRefreshCw,
		lucideCheckCircle,
		lucideHandCoins
	})]
})
export class ExpenseSettlementComponent implements OnChanges {
	private activityService = inject(ActivityService);

	groupId = input.required<number>();
	refreshTrigger = input<number>(0);

	settlement = signal<GroupExpenseSettlement | null>(null);
	loading = signal(false);
	error = signal<string | null>(null);

	// --- Stato modale di saldo ---
	settleModal = signal<SettlementTransaction | null>(null); // transazione selezionata
	settleNote = '';
	settling = signal(false);
	settleError = signal<string | null>(null);
	settleSuccess = signal<string | null>(null);

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['groupId'] || changes['refreshTrigger']) {
			this.load();
		}
	}

	load(): void {
		const id = this.groupId();
		if (!id) return;
		this.loading.set(true);
		this.error.set(null);
		this.activityService.getExpenseSettlement(id).subscribe({
			next: (data) => {
				this.settlement.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossibile caricare i saldi');
				this.loading.set(false);
			}
		});
	}

	openSettleModal(tx: SettlementTransaction): void {
		this.settleModal.set(tx);
		this.settleNote = '';
		this.settleError.set(null);
		this.settleSuccess.set(null);
	}

	closeSettleModal(): void {
		this.settleModal.set(null);
	}

	get settleModalMessage(): string {
		const tx = this.settleModal();
		if (!tx) return '';
		return `${tx.fromMemberName} paga ${tx.amount.toFixed(2)} € a ${tx.toMemberName}`;
	}

	confirmSettle(): void {
		const tx = this.settleModal();
		if (!tx) return;

		this.settling.set(true);
		this.settleError.set(null);

		this.activityService.recordSettlement(this.groupId(), {
			fromMemberId: tx.fromMemberId,
			toMemberId: tx.toMemberId,
			amount: tx.amount,
			note: this.settleNote || undefined
		}).subscribe({
			next: () => {
				this.settling.set(false);
				this.settleModal.set(null);
				this.settleSuccess.set(`✓ Rimborso di ${tx.amount.toFixed(2)} € registrato`);
				// Ricarica i saldi
				this.load();
				setTimeout(() => this.settleSuccess.set(null), 4000);
			},
			error: (err) => {
				this.settling.set(false);
				this.settleError.set(err.error?.message || 'Errore nella registrazione del rimborso');
			}
		});
	}

	balanceClass(balance: number): string {
		if (balance > 0.005) return 'credit';
		if (balance < -0.005) return 'debit';
		return 'even';
	}

	balanceIcon(balance: number): string {
		if (balance > 0.005) return 'lucideTrendingUp';
		if (balance < -0.005) return 'lucideTrendingDown';
		return 'lucideMinus';
	}

	balanceLabel(balance: number): string {
		if (balance > 0.005) return 'da ricevere';
		if (balance < -0.005) return 'da pagare';
		return 'in pari';
	}

	avatarInitials(name: string): string {
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	}
}
