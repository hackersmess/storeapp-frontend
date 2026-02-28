export interface ActivityExpense {
	id?: number;
	activityId: number;
	description: string;
	currency: string;
	createdAt?: string;
	payers: ExpensePayer[];
	splits: ExpenseSplit[];
}

export interface ExpensePayer {
	groupMemberId: number;
	userName: string;
	paidAmount: number;
}

export interface ExpenseSplit {
	groupMemberId: number;
	userName: string;
	amount: number;
	isPayer: boolean;
}

export interface ExpenseRequest {
	activityId: number;
	description: string;
	currency: string;
	payers: PayerRequest[];
	splits: SplitRequest[];
	expenseIdToReplace?: number; // set when editing (delete old + create new)
}

export interface PayerRequest {
	groupMemberId: number;
	paidAmount: number;
}

export interface SplitRequest {
	groupMemberId: number;
	amount: number;
	isPayer: boolean;
	paidAmount: number;
}

export type SplitType = 'equal' | 'custom' | 'percentage';

export interface MemberWithAmount {
	groupMemberId: number;
	userName: string;
	avatarUrl?: string;
	amount: number;
	isPayer?: boolean;
}
