import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucidePlus } from '@ng-icons/lucide';
import { ActivityCalendar } from '../../../../../models/activity.model';
import { ActivityCardComponent } from '../activity-card/activity-card.component';

@Component({
	selector: 'app-group-activities-list',
	standalone: true,
	imports: [CommonModule, NgIconComponent, ActivityCardComponent],
	templateUrl: './group-activities-list.component.html',
	styleUrls: ['./group-activities-list.component.scss'],
	viewProviders: [provideIcons({
		lucideCalendar,
		lucidePlus
	})]
})
export class GroupActivitiesListComponent {
	// Input signals
	activities = input<ActivityCalendar[]>([]);
	selectedDate = input<Date | null>(null);
	loading = input<boolean>(false);

	// Output events
	activityClick = output<ActivityCalendar>();
	addActivity = output<Date>();

	// Computed
	filteredActivities = computed(() => {
		const selected = this.selectedDate();
		const activities = this.activities();

		if (!selected) return activities;

		const selectedTime = new Date(selected).setHours(0, 0, 0, 0);
		return activities.filter(activity => {
			const activityDate = new Date(activity.activityDate);
			activityDate.setHours(0, 0, 0, 0);
			return activityDate.getTime() === selectedTime;
		});
	});

	formattedDate = computed(() => {
		const date = this.selectedDate();
		if (!date) return 'Tutte le attività';
		return new Date(date).toLocaleDateString('it-IT', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		});
	});

	hasActivities = computed(() => this.filteredActivities().length > 0);

	onActivityClick(activity: ActivityCalendar) {
		this.activityClick.emit(activity);
	}

	onAddClick() {
		this.addActivity.emit(this.selectedDate() || new Date());
	}
}
