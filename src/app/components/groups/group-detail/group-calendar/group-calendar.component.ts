import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideDollarSign, lucideTrash2, lucideMapPin } from '@ng-icons/lucide';
import { ActivityCalendar } from '../../../../models/activity.model';

interface CalendarDay {
	date: Date;
	dayNumber: number;
	dayName: string;
	isToday: boolean;
	isSelected: boolean;
	activities: ActivityCalendar[];
}

@Component({
	selector: 'app-group-calendar',
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	templateUrl: './group-calendar.component.html',
	styleUrls: ['./group-calendar.component.scss'],
	viewProviders: [provideIcons({
		lucidePlus,
		lucideDollarSign,
		lucideTrash2,
		lucideMapPin
	})]
})
export class GroupCalendarComponent {
	// Input signals
	vacationStartDate = input.required<string>();
	vacationEndDate = input.required<string>();
	activities = input<ActivityCalendar[]>([]);
	selectedDate = input<Date | null>(null);

	// Output events
	dateSelected = output<Date>();
	activityClick = output<ActivityCalendar>();
	createActivity = output<Date>();
	addExpense = output<number>(); // activity ID
	deleteActivity = output<number>(); // activity ID

	// Internal signals
	calendarDays = signal<CalendarDay[]>([]);

	constructor() {
		// Effect per rigenerare il calendario quando cambiano i dati
		effect(() => {
			this.vacationStartDate();
			this.vacationEndDate();
			this.activities();
			this.selectedDate();
			this.generateCalendar();
		});
	}

	generateCalendar(): void {
		const startDate = new Date(this.vacationStartDate());
		const endDate = new Date(this.vacationEndDate());
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const selected = this.selectedDate();

		const days: CalendarDay[] = [];
		const current = new Date(startDate);

		while (current <= endDate) {
			const dateOnly = new Date(current);
			dateOnly.setHours(0, 0, 0, 0);

			const isToday = dateOnly.getTime() === today.getTime();
			const isSelected = selected ? dateOnly.getTime() === new Date(selected).setHours(0, 0, 0, 0) : false;

			// Trova le activity per questo giorno usando activityDate
			const dayActivities = this.activities().filter(activity => {
				if (!activity.activityDate) return false;
				const actDate = new Date(activity.activityDate);
				actDate.setHours(0, 0, 0, 0);
				return actDate.getTime() === dateOnly.getTime();
			}); days.push({
				date: new Date(dateOnly),
				dayNumber: current.getDate(),
				dayName: current.toLocaleDateString('it-IT', { weekday: 'short' }),
				isToday,
				isSelected,
				activities: dayActivities
			});

			current.setDate(current.getDate() + 1);
		}

		this.calendarDays.set(days);
	}

	onDayClick(day: CalendarDay): void {
		this.dateSelected.emit(day.date);
	}

	onActivityClick(activity: ActivityCalendar, event: Event): void {
		event.stopPropagation();
		this.activityClick.emit(activity);
	}

	onCreateActivity(day: CalendarDay, event: Event): void {
		event.stopPropagation();
		this.createActivity.emit(day.date);
	}

	onAddExpense(activityId: number, event: Event): void {
		event.stopPropagation();
		this.addExpense.emit(activityId);
	}

	onDeleteActivity(activityId: number, event: Event): void {
		event.stopPropagation();
		this.deleteActivity.emit(activityId);
	}

	formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString('it-IT', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
}
