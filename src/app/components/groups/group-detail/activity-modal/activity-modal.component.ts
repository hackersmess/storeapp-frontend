import { Component, input, output, signal, effect, inject, computed } from '@angular/core';
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
	lucideDollarSign,
	lucidePlane,
	lucideMapPinned,
	lucideTag,
	lucideLink,
	lucideTicket,
	lucideUsers,
	lucideFlag,
	lucideArmchair,
	lucideRuler
} from '@ng-icons/lucide';
import { Activity, EventRequest, TripRequest, ActivityType, EventCategory, TransportMode, isEvent, isTrip, getEventCategoryLabel, getTransportModeLabel } from '../../../../models/activity.model';
import { GroupMember } from '../../../../models/group.model';
import { eventDateTimeValidator, tripDateTimeValidator } from '../../../../shared/validators/date-time-range.validator';

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
		lucideDollarSign,
		lucidePlane,
		lucideMapPinned,
		lucideTag,
		lucideLink,
		lucideTicket,
		lucideUsers,
		lucideFlag,
		lucideArmchair,
		lucideRuler
	})]
})
export class ActivityModalComponent {
	private fb = inject(FormBuilder);

	// Input signals
	show = input.required<boolean>();
	activity = input<Activity | null>(null);
	prefilledDate = input<Date | null>(null);
	loading = input<boolean>(false);
	members = input<GroupMember[]>([]);

	// Output events
	close = output<void>();
	save = output<EventRequest | TripRequest>();
	manageExpenses = output<number>(); // activity ID

	// Internal signals
	activityForm!: FormGroup;
	isEditMode = signal<boolean>(false);
	selectedActivityType = signal<ActivityType>('EVENT');
	private formInitialized = false;
	selectedParticipantIds = signal<number[]>([]);

	// Computed signals for template
	isEventType = computed(() => this.selectedActivityType() === 'EVENT');
	isTripType = computed(() => this.selectedActivityType() === 'TRIP');
	noParticipantsSelected = computed(() => this.selectedParticipantIds().length === 0);

	// Expose enums to template
	readonly EventCategory = EventCategory;
	readonly TransportMode = TransportMode;
	readonly eventCategories = Object.values(EventCategory);
	readonly transportModes = Object.values(TransportMode);

	// Helper functions for template
	readonly getEventCategoryLabel = getEventCategoryLabel;
	readonly getTransportModeLabel = getTransportModeLabel;

	constructor() {
		// Effect per gestire l'activity in edit mode
		effect(() => {
			const currentActivity = this.activity();

			if (currentActivity) {
				this.isEditMode.set(true);
				const activityType = currentActivity.activityType;

				// Setta il tipo
				this.selectedActivityType.set(activityType);

				// Ricrea il form con il tipo corretto
				this.initForm();

				// Popola subito dopo aver creato il form
				this.populateForm(currentActivity);
			} else {
				this.isEditMode.set(false);

				// Ricrea il form vuoto con il tipo selezionato
				const currentType = this.selectedActivityType();
				if (currentType && !this.activityForm) {
					this.initForm();
				} else if (this.activityForm) {
					this.resetForm();
				}
			}
		});

		// Effect per ricreare il form quando l'utente cambia tipo in modalità creazione
		effect(() => {
			const activityType = this.selectedActivityType();
			const currentActivity = this.activity();

			// Solo se NON siamo in edit mode (altrimenti gestiamo sopra)
			if (!currentActivity && activityType) {
				this.initForm();
			}
		});

		// Effect per pre-compilare la data se fornita
		effect(() => {
			const date = this.prefilledDate();
			if (date && !this.activity() && this.activityForm) {
				this.activityForm.patchValue({
					startDate: this.formatDateForInput(date)
				});
			}
		});
	}

	initForm() {
		const type = this.selectedActivityType();

		// Common fields for both types
		const commonFields = {
			name: ['', [Validators.required, Validators.maxLength(255)]],
			description: [''],
			startDate: ['', Validators.required],
			endDate: ['', Validators.required],
			startTime: ['', Validators.required],
			endTime: ['', Validators.required]
		};

		if (type === 'EVENT') {
			// Event-specific fields
			this.activityForm = this.fb.group({
				...commonFields,
				category: [EventCategory.OTHER, Validators.required],
				locationName: ['', Validators.maxLength(500)],
				locationAddress: ['', Validators.maxLength(500)],
				locationLatitude: [null],
				locationLongitude: [null],
				bookingUrl: ['', Validators.maxLength(1000)],
				bookingReference: ['', Validators.maxLength(255)],
				reservationTime: ['']
			}, { validators: eventDateTimeValidator() });
		} else {
			// Trip-specific fields
			this.activityForm = this.fb.group({
				...commonFields,
				transportMode: [TransportMode.OTHER, Validators.required],
				originName: ['', Validators.maxLength(500)],
				originAddress: ['', Validators.maxLength(500)],
				originLatitude: [null],
				originLongitude: [null],
				destinationName: ['', Validators.maxLength(500)],
				destinationAddress: ['', Validators.maxLength(500)],
				destinationLatitude: [null],
				destinationLongitude: [null],
				departureTime: ['', Validators.required],
				arrivalTime: ['', Validators.required],
				bookingReference: ['', Validators.maxLength(255)]
			}, { validators: tripDateTimeValidator() });
		}
	}

	populateForm(activity: Activity) {
		// Load participants
		if (activity.participants && activity.participants.length > 0) {
			const participantIds = activity.participants.map(p => p.groupMember.id);
			this.selectedParticipantIds.set(participantIds);
		} else {
			this.selectedParticipantIds.set([]);
		}

		if (isEvent(activity)) {
			const formData = {
				name: activity.name,
				description: activity.description || '',
				startDate: activity.startDate || '',
				endDate: activity.endDate || '',
				startTime: activity.startTime || '',
				endTime: activity.endTime || '',
				category: activity.category,
				locationName: activity.location?.name || '',
				locationAddress: activity.location?.address || '',
				locationLatitude: activity.location?.latitude || null,
				locationLongitude: activity.location?.longitude || null,
				bookingUrl: activity.bookingUrl || '',
				bookingReference: activity.bookingReference || '',
				reservationTime: activity.reservationTime || ''
			};

			this.activityForm.patchValue(formData);
		} else if (isTrip(activity)) {
			this.activityForm.patchValue({
				name: activity.name,
				description: activity.description || '',
				startDate: activity.startDate || '',
				endDate: activity.endDate || '',
				departureTime: activity.departureTime || '',
				arrivalTime: activity.arrivalTime || '',
				transportMode: activity.transportMode,
				originName: activity.origin?.name || '',
				originAddress: activity.origin?.address || '',
				originLatitude: activity.origin?.latitude || null,
				originLongitude: activity.origin?.longitude || null,
				destinationName: activity.destination?.name || '',
				destinationAddress: activity.destination?.address || '',
				destinationLatitude: activity.destination?.latitude || null,
				destinationLongitude: activity.destination?.longitude || null,
				bookingReference: activity.bookingReference || ''
			});
		}
	}

	resetForm() {
		this.activityForm.reset();
		const date = this.prefilledDate();
		if (date) {
			this.activityForm.patchValue({
				startDate: this.formatDateForInput(date)
			});
		}
		// Set default values
		if (this.selectedActivityType() === 'EVENT') {
			this.activityForm.patchValue({ category: EventCategory.OTHER });
		} else {
			this.activityForm.patchValue({ transportMode: TransportMode.OTHER });
		}
	}

	onActivityTypeChange(type: ActivityType) {
		if (!this.isEditMode()) {
			this.selectedActivityType.set(type);

			// Ricrea immediatamente il form per il nuovo tipo
			this.initForm();

			// Ripristina la data precompilata se presente
			const date = this.prefilledDate();
			if (date) {
				this.activityForm.patchValue({
					startDate: this.formatDateForInput(date)
				});
			}
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

		// Validate at least one participant
		if (this.selectedParticipantIds().length === 0) {
			alert('Seleziona almeno un partecipante per creare l\'attività');
			return;
		}

		const formValue = this.activityForm.value;
		const type = this.selectedActivityType();

		if (type === 'EVENT') {
			const request: EventRequest = {
				name: formValue.name,
				description: formValue.description || undefined,
				startDate: formValue.startDate,
				endDate: formValue.endDate || undefined,
				startTime: formValue.startTime || undefined,
				endTime: formValue.endTime || undefined,
				category: formValue.category,
				locationName: formValue.locationName || undefined,
				locationAddress: formValue.locationAddress || undefined,
				locationLatitude: formValue.locationLatitude || undefined,
				locationLongitude: formValue.locationLongitude || undefined,
				bookingUrl: formValue.bookingUrl || undefined,
				bookingReference: formValue.bookingReference || undefined,
				reservationTime: formValue.reservationTime || undefined,
				participantIds: this.selectedParticipantIds().length > 0 ? this.selectedParticipantIds() : undefined
			};
			this.save.emit(request);
		} else {
			const request: TripRequest = {
				name: formValue.name,
				description: formValue.description || undefined,
				startDate: formValue.startDate,
				endDate: formValue.endDate || undefined,
				startTime: formValue.startTime || undefined,
				endTime: formValue.endTime || undefined,
				transportMode: formValue.transportMode,
				originName: formValue.originName || undefined,
				originAddress: formValue.originAddress || undefined,
				originLatitude: formValue.originLatitude || undefined,
				originLongitude: formValue.originLongitude || undefined,
				destinationName: formValue.destinationName || undefined,
				destinationAddress: formValue.destinationAddress || undefined,
				destinationLatitude: formValue.destinationLatitude || undefined,
				destinationLongitude: formValue.destinationLongitude || undefined,
				departureTime: formValue.departureTime || undefined,
				arrivalTime: formValue.arrivalTime || undefined,
				bookingReference: formValue.bookingReference || undefined,
				participantIds: this.selectedParticipantIds().length > 0 ? this.selectedParticipantIds() : undefined
			};
			this.save.emit(request);
		}
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

	/**
	 * Check if form has date/time range validation error
	 */
	get hasDateTimeRangeError(): boolean {
		return this.activityForm?.hasError('dateTimeRange') && this.activityForm?.touched || false;
	}

	/**
	 * Get date/time range error message
	 */
	get dateTimeRangeErrorMessage(): string {
		const error = this.activityForm?.getError('dateTimeRange');
		return error?.message || 'Data e ora di fine devono essere successive a quelle di inizio';
	}

	/**
	 * Check if a participant is selected
	 */
	isParticipantSelected(memberId: number): boolean {
		return this.selectedParticipantIds().includes(memberId);
	}

	/**
	 * Toggle participant selection
	 */
	toggleParticipant(memberId: number): void {
		const currentIds = this.selectedParticipantIds();
		if (currentIds.includes(memberId)) {
			this.selectedParticipantIds.set(currentIds.filter(id => id !== memberId));
		} else {
			this.selectedParticipantIds.set([...currentIds, memberId]);
		}
	}

	/**
	 * Select all members as participants
	 */
	selectAllParticipants(): void {
		const allMemberIds = this.members().map(m => m.id);
		this.selectedParticipantIds.set(allMemberIds);
	}

	/**
	 * Clear all participants
	 */
	clearAllParticipants(): void {
		this.selectedParticipantIds.set([]);
	}
}
