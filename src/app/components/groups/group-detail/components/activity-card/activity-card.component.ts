import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
	lucideMapPin,
	lucideClock,
	lucideUsers,
	lucideCheckCircle,
	lucideCircle
} from '@ng-icons/lucide';
import { ActivityCalendar } from '../../../../../models/activity.model';

@Component({
	selector: 'app-activity-card',
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	templateUrl: './activity-card.component.html',
	styleUrls: ['./activity-card.component.scss'],
	viewProviders: [provideIcons({
		lucideMapPin,
		lucideClock,
		lucideUsers,
		lucideCheckCircle,
		lucideCircle
	})]
})
export class ActivityCardComponent {
	// Input signals
	activity = input.required<ActivityCalendar>();
	compact = input<boolean>(false);

	// Output events
	activityClick = output<ActivityCalendar>();

	onCardClick() {
		this.activityClick.emit(this.activity());
	}

	getStatusIcon(): string {
		const activity = this.activity();
		if (activity.isCompleted) return 'lucideCheckCircle';
		return 'lucideCircle';
	}

	getStatusClass(): string {
		const activity = this.activity();
		if (activity.isCompleted) return 'completed';
		return activity.calendarStatus;
	}

	formatTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
	}

	getParticipantsSummary(): string {
		const activity = this.activity();
		const confirmed = activity.confirmedCount;
		const total = activity.totalMembers;
		return `${confirmed}/${total}`;
	}
}
