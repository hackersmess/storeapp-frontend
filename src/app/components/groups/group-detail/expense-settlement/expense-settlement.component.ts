import { Component, input, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRight,
	lucideTrendingUp,
	lucideTrendingDown,
	lucideMinus,
	lucideRefreshCw,
	lucideCheckCircle
} from '@ng-icons/lucide';
import { ActivityService } from '../../../../services/activity.service';
import { GroupExpenseSettlement, MemberBalance, SettlementTransaction } from '../../../../models/activity.model';

@Component({
	selector: 'app-expense-settlement',
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	templateUrl: './expense-settlement.component.html',
	styleUrls: ['./expense-settlement.component.scss'],
	viewProviders: [provideIcons({
		lucideArrowRight,
		lucideTrendingUp,
		lucideTrendingDown,
		lucideMinus,
		lucideRefreshCw,
		lucideCheckCircle
	})]
})
export class ExpenseSettlementComponent implements OnChanges {
	private activityService = inject(ActivityService);

	/** ID del gruppo per cui caricare i saldi */
	groupId = input.required<number>();

	/** Forza il refresh quando cambia questo valore (es. dopo salvataggio spesa) */
	refreshTrigger = input<number>(0);

	settlement = signal<GroupExpenseSettlement | null>(null);
	loading = signal(false);
	error = signal<string | null>(null);

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
