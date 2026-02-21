import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupMember } from '../../../../models/group.model';
import { MemberWithAmount, ExpenseRequest, PayerRequest, SplitRequest } from '../../../../models/expense.model';
import { PayersStepComponent } from '../payers-step/payers-step.component';
import { SplitStepComponent } from '../split-step/split-step.component';

@Component({
	selector: 'app-expense-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, PayersStepComponent, SplitStepComponent],
	templateUrl: './expense-modal.component.html',
	styleUrls: ['./expense-modal.component.scss']
})
export class ExpenseModalComponent {
	// Inputs
	activityId = input.required<number>();
	members = input.required<GroupMember[]>();
	isOpen = input.required<boolean>();

	// Outputs
	close = output<void>();
	save = output<ExpenseRequest>();

	// State
	currentStep = signal<1 | 2>(1);
	description = signal<string>('');
	currency = signal<string>('EUR');

	// Step 1: Payers
	payers = signal<Map<number, number>>(new Map()); // memberId -> amount paid
	payersValid = signal<boolean>(false);

	// Step 2: Splits
	splits = signal<MemberWithAmount[]>([]);
	splitsValid = signal<boolean>(false);

	// Computed
	totalAmount = computed(() => {
		// Il totale è la somma di quanto hanno pagato i paganti
		const payersMap = this.payers();
		let total = 0;
		for (const amount of payersMap.values()) {
			total += amount;
		}
		return total;
	});

	canProceedToStep2 = computed(() => {
		return this.description().trim() !== '' &&
			this.totalAmount() > 0 &&
			this.payersValid();
	});

	canSave = computed(() => {
		return this.canProceedToStep2() && this.splitsValid();
	});

	constructor() {
		// Reset form when modal closes
		effect(() => {
			if (!this.isOpen()) {
				this.resetForm();
			}
		}, { allowSignalWrites: true });
	}

	/**
	 * Handle payers change from Step 1
	 */
	onPayersChange(payers: MemberWithAmount[]): void {
		const payersMap = new Map<number, number>();
		for (const payer of payers) {
			payersMap.set(payer.groupMemberId, payer.amount);
		}
		this.payers.set(payersMap);
		console.log('Payers changed:', payers, 'Total:', this.totalAmount());
	}

	/**
	 * Handle payers validation change
	 */
	onPayersValidChange(valid: boolean): void {
		this.payersValid.set(valid);
		console.log('Payers valid:', valid, 'Description:', this.description(), 'Total:', this.totalAmount(), 'Can proceed:', this.canProceedToStep2());
	}

	/**
	 * Handle splits change from Step 2
	 */
	onSplitsChange(splits: MemberWithAmount[]): void {
		this.splits.set(splits);
	}

	/**
	 * Handle splits validation change
	 */
	onSplitsValidChange(valid: boolean): void {
		this.splitsValid.set(valid);
	}

	/**
	 * Go to next step
	 */
	nextStep(): void {
		if (this.currentStep() === 1 && this.canProceedToStep2()) {
			this.currentStep.set(2);
		}
	}

	/**
	 * Go to previous step
	 */
	previousStep(): void {
		if (this.currentStep() === 2) {
			this.currentStep.set(1);
		}
	}

	/**
	 * Save the expense
	 */
	saveExpense(): void {
		if (!this.canSave()) return;

		const payersArray = Array.from(this.payers().entries());
		const payerRequests: PayerRequest[] = payersArray.map(([memberId, amount]) => ({
			groupMemberId: memberId,
			paidAmount: amount
		}));

		const splitRequests: SplitRequest[] = this.splits().map(split => {
			const isPayer = this.payers().has(split.groupMemberId);
			const paidAmount = this.payers().get(split.groupMemberId) || 0;

			return {
				groupMemberId: split.groupMemberId,
				amount: split.amount,
				isPayer,
				paidAmount
			};
		});

		const request: ExpenseRequest = {
			activityId: this.activityId(),
			description: this.description(),
			currency: this.currency(),
			payers: payerRequests,
			splits: splitRequests
		};

		this.save.emit(request);
		this.closeModal();
	}

	/**
	 * Close the modal
	 */
	closeModal(): void {
		this.close.emit();
	}

	/**
	 * Reset the form
	 */
	private resetForm(): void {
		this.currentStep.set(1);
		this.description.set('');
		this.currency.set('EUR');
		this.payers.set(new Map());
		this.splits.set([]);
		this.payersValid.set(false);
		this.splitsValid.set(false);
	}
}
