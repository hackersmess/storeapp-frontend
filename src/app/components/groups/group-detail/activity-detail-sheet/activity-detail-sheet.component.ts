import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
	lucideX,
	lucidePencil,
	lucideTrash2,
	lucideDollarSign,
	lucideMapPin,
	lucideClock,
	lucideCalendar,
	lucideUsers,
	lucidePlane,
	lucideTrain,
	lucideBus,
	lucideCar,
	lucideShip,
	lucideBike,
	lucideFootprints,
	lucideExternalLink,
	lucideTag,
	lucideArrowRight,
	lucideCheckCircle,
	lucideCircle
} from '@ng-icons/lucide';
import {
	Activity,
	Event,
	Trip,
	ActivityParticipant,
	EventCategory,
	TransportMode,
	isEvent,
	isTrip
} from '../../../../models/activity.model';

@Component({
	selector: 'app-activity-detail-sheet',
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	templateUrl: './activity-detail-sheet.component.html',
	styleUrls: ['./activity-detail-sheet.component.scss'],
	viewProviders: [provideIcons({
		lucideX,
		lucidePencil,
		lucideTrash2,
		lucideDollarSign,
		lucideMapPin,
		lucideClock,
		lucideCalendar,
		lucideUsers,
		lucidePlane,
		lucideTrain,
		lucideBus,
		lucideCar,
		lucideShip,
		lucideBike,
		lucideFootprints,
		lucideExternalLink,
		lucideTag,
		lucideArrowRight,
		lucideCheckCircle,
		lucideCircle
	})]
})
export class ActivityDetailSheetComponent {
	// Inputs
	activity = input.required<Activity>();
	canEdit = input<boolean>(false);

	// Outputs
	close = output<void>();
	edit = output<Activity>();
	delete = output<number>();
	addExpense = output<number>();

	// Type guards exposed to template
	isEvent = isEvent;
	isTrip = isTrip;

	// Computed shorthands
	asEvent = computed(() => this.activity() as Event);
	asTrip = computed(() => this.activity() as Trip);

	onClose() { this.close.emit(); }
	onEdit() { this.edit.emit(this.activity()); }
	onDelete() { this.delete.emit(this.activity().id); }
	onAddExpense() { this.addExpense.emit(this.activity().id); }

	// ─── Formatting helpers ────────────────────────────────────────────────────

	formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	}

	formatDateShort(dateStr?: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
	}

	formatTime(timeStr?: string): string {
		if (!timeStr) return '';
		return timeStr.slice(0, 5);
	}

	formatCurrency(amount?: number, currency = 'EUR'): string {
		if (amount == null) return '';
		return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(amount);
	}

	// ─── Labels ───────────────────────────────────────────────────────────────

	getCategoryLabel(cat?: EventCategory): string {
		const labels: Record<EventCategory, string> = {
			[EventCategory.RESTAURANT]: 'Ristorante',
			[EventCategory.MUSEUM]: 'Museo',
			[EventCategory.BEACH]: 'Spiaggia',
			[EventCategory.PARK]: 'Parco',
			[EventCategory.ATTRACTION]: 'Attrazione',
			[EventCategory.ACCOMMODATION]: 'Alloggio',
			[EventCategory.SHOPPING]: 'Shopping',
			[EventCategory.ENTERTAINMENT]: 'Intrattenimento',
			[EventCategory.SPORT]: 'Sport',
			[EventCategory.OTHER]: 'Altro'
		};
		return cat ? (labels[cat] ?? cat) : '';
	}

	getTransportLabel(mode?: TransportMode): string {
		const labels: Record<TransportMode, string> = {
			[TransportMode.FLIGHT]: 'Volo',
			[TransportMode.TRAIN]: 'Treno',
			[TransportMode.BUS]: 'Bus',
			[TransportMode.CAR]: 'Auto',
			[TransportMode.FERRY]: 'Traghetto',
			[TransportMode.BIKE]: 'Bicicletta',
			[TransportMode.WALK]: 'A piedi',
			[TransportMode.OTHER]: 'Altro'
		};
		return mode ? (labels[mode] ?? mode) : '';
	}

	getTransportIcon(mode?: TransportMode): string {
		const icons: Record<TransportMode, string> = {
			[TransportMode.FLIGHT]: 'lucidePlane',
			[TransportMode.TRAIN]: 'lucideTrain',
			[TransportMode.BUS]: 'lucideBus',
			[TransportMode.CAR]: 'lucideCar',
			[TransportMode.FERRY]: 'lucideShip',
			[TransportMode.BIKE]: 'lucideBike',
			[TransportMode.WALK]: 'lucideFootprints',
			[TransportMode.OTHER]: 'lucideCar'
		};
		return mode ? (icons[mode] ?? 'lucideCar') : 'lucideCar';
	}

	getParticipantStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			CONFIRMED: 'Confermato',
			MAYBE: 'Forse',
			DECLINED: 'Rifiutato',
			PENDING: 'In attesa'
		};
		return labels[status] ?? status;
	}

	getStatusIcon(): string {
		return this.activity().isCompleted ? 'lucideCheckCircle' : 'lucideCircle';
	}

	getStatusLabel(): string {
		return this.activity().isCompleted ? 'Completata' : 'In programma';
	}

	getParticipantsSummary(): string {
		const act = this.activity();
		const confirmed = act.confirmedCount ?? 0;
		const maybe = act.maybeCount ?? 0;
		const total = confirmed + maybe + (act.declinedCount ?? 0);
		if (total === 0) return 'Nessun partecipante';
		return `${confirmed} confermati · ${maybe} forse`;
	}

	isMultiDay(): boolean {
		const act = this.activity();
		if (isTrip(act)) {
			return !!(act.arrivalDate && act.arrivalDate !== act.departureDate);
		}
		return !!(act.endDate && act.endDate !== act.startDate);
	}
}
