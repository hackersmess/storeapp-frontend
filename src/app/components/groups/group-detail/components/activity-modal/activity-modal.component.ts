import { Component, OnInit, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
	lucideX,
	lucideCalendar,
	lucideClock,
	lucideMapPin,
	lucideAlignLeft,
	lucideSave,
	lucideDollarSign
} from '@ng-icons/lucide';
import { Activity, ActivityRequest } from '../../../../../models/activity.model';
import { GroupMember } from '../../../../../models/group.model';

@Component({
	selector: 'app-activity-modal',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
	templateUrl: './activity-modal.component.html',
	styleUrls: ['./activity-modal.component.scss'],
	viewProviders: [provideIcons({
		lucideX,
		lucideCalendar,
		lucideClock,
		lucideMapPin,
		lucideAlignLeft,
		lucideSave,
		lucideDollarSign
	})]
})
export class ActivityModalComponent implements OnInit {
	private fb = inject(FormBuilder);

	// Input signals
	show = input.required<boolean>();
	activity = input<Activity | null>(null);
	prefilledDate = input<Date | null>(null);
	loading = input<boolean>(false);
	members = input<GroupMember[]>([]);

	// Output events
	close = output<void>();
	save = output<ActivityRequest>();
	manageExpenses = output<number>(); // activity ID

	// Internal signals
	activityForm!: FormGroup;
	isEditMode = signal<boolean>(false);

	constructor() {
		// Effect per popolare il form quando cambia l'activity
		effect(() => {
			const currentActivity = this.activity();
			if (currentActivity) {
				this.isEditMode.set(true);
				this.populateForm(currentActivity);
			} else {
				this.isEditMode.set(false);
				this.resetForm();
			}
		});

		// Effect per pre-compilare la data se fornita
		effect(() => {
			const date = this.prefilledDate();
			if (date && !this.activity()) {
				this.activityForm.patchValue({
					scheduledDate: this.formatDateForInput(date)
				});
			}
		});
	}

	ngOnInit() {
		this.initForm();
	}

	initForm() {
		this.activityForm = this.fb.group({
			name: ['', [Validators.required, Validators.maxLength(200)]],
			description: [''],
			scheduledDate: [''],
			startTime: [''],
			endTime: [''],
			locationName: ['', Validators.maxLength(200)],
			locationAddress: ['', Validators.maxLength(500)]
		});
	}

	populateForm(activity: Activity) {
		this.activityForm.patchValue({
			name: activity.name,
			description: activity.description || '',
			scheduledDate: activity.scheduledDate || '',
			startTime: activity.startTime || '',
			endTime: activity.endTime || '',
			locationName: activity.locationName || '',
			locationAddress: activity.locationAddress || ''
		});
	}

	resetForm() {
		this.activityForm.reset();
		const date = this.prefilledDate();
		if (date) {
			this.activityForm.patchValue({
				scheduledDate: this.formatDateForInput(date)
			});
		}
	}

	onClose() {
		this.close.emit();
		this.resetForm();
	}

	onSubmit() {
		if (this.activityForm.invalid) {
			this.activityForm.markAllAsTouched();
			return;
		}

		const formValue = this.activityForm.value;
		const request: ActivityRequest = {
			name: formValue.name,
			description: formValue.description || undefined,
			scheduledDate: formValue.scheduledDate || undefined,
			startTime: formValue.startTime || undefined,
			endTime: formValue.endTime || undefined,
			locationName: formValue.locationName || undefined,
			locationAddress: formValue.locationAddress || undefined,
			participantUserIds: [] // Will be managed through expenses
		};

		this.save.emit(request);
	}

	onManageExpenses(): void {
		const currentActivity = this.activity();
		if (currentActivity) {
			this.manageExpenses.emit(currentActivity.id);
		}
	}

	private formatDateForInput(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	get titleControl() {
		return this.activityForm.get('name');
	}
}
